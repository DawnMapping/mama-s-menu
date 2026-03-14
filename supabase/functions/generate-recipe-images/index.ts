import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function sbUrl() { return Deno.env.get("SUPABASE_URL")!; }
function sbHeaders() {
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

async function sbSelect(table: string, query: string) {
  const res = await fetch(`${sbUrl()}/rest/v1/${table}?${query}`, { headers: sbHeaders() });
  return await res.json();
}

async function sbUpdate(table: string, query: string, data: any) {
  const res = await fetch(`${sbUrl()}/rest/v1/${table}?${query}`, {
    method: "PATCH",
    headers: { ...sbHeaders(), Prefer: "return=minimal" },
    body: JSON.stringify(data),
  });
  await res.text();
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { batchSize = 5 } = await req.json().catch(() => ({}));

    // Get recipes without images
    const recipes = await sbSelect(
      "recipes",
      `image_url=is.null&select=id,title,ingredients&limit=${Math.min(batchSize, 10)}`
    );

    if (!recipes?.length) {
      return new Response(
        JSON.stringify({ message: "All recipes already have images!", processed: 0, remaining: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Count remaining
    const allMissing = await sbSelect("recipes", "image_url=is.null&select=id");
    const remaining = allMissing?.length || 0;

    // Process in background
    // @ts-ignore
    EdgeRuntime.waitUntil(generateBatch(recipes));

    return new Response(
      JSON.stringify({
        message: `Generating images for ${recipes.length} recipes...`,
        processing: recipes.length,
        remaining: remaining - recipes.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("generate-recipe-images error:", e);
    return new Response(
      JSON.stringify({ error: e.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function generateBatch(recipes: any[]) {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  for (const recipe of recipes) {
    try {
      // Build a short ingredient summary for the prompt
      const ingredientHint = recipe.ingredients
        ? recipe.ingredients.split("\n").slice(0, 5).join(", ")
        : "";

      const prompt = `Generate a beautiful, appetizing food photography style image of "${recipe.title}". ${ingredientHint ? `Key ingredients: ${ingredientHint}.` : ""} The image should look like a professional cookbook photo: overhead or 45-degree angle, natural lighting, on a rustic table setting with garnishes. Photorealistic style.`;

      console.log(`Generating image for: ${recipe.title}`);

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: prompt }],
          modalities: ["image", "text"],
        }),
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        console.error(`AI error for "${recipe.title}":`, aiResponse.status, errText);
        // Rate limit - stop batch
        if (aiResponse.status === 429) {
          console.log("Rate limited, stopping batch");
          break;
        }
        continue;
      }

      const aiData = await aiResponse.json();
      const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (!imageData || !imageData.startsWith("data:image")) {
        console.error(`No image returned for "${recipe.title}"`);
        continue;
      }

      // Extract base64 data and upload to storage
      const base64Match = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!base64Match) {
        console.error(`Invalid image data format for "${recipe.title}"`);
        continue;
      }

      const ext = base64Match[1] === "jpeg" ? "jpg" : base64Match[1];
      const base64Content = base64Match[2];
      const binaryString = atob(base64Content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const filePath = `${recipe.id}.${ext}`;
      const uploadRes = await fetch(
        `${supabaseUrl}/storage/v1/object/recipe-images/${filePath}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${serviceKey}`,
            apikey: serviceKey,
            "Content-Type": `image/${base64Match[1]}`,
            "x-upsert": "true",
          },
          body: bytes,
        }
      );

      if (!uploadRes.ok) {
        const err = await uploadRes.text();
        console.error(`Upload failed for "${recipe.title}":`, err);
        continue;
      }
      await uploadRes.text();

      // Get the public URL and update the recipe
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/recipe-images/${filePath}`;
      await sbUpdate("recipes", `id=eq.${recipe.id}`, { image_url: publicUrl });

      console.log(`✓ Image generated for "${recipe.title}"`);

      // Small delay between generations to avoid rate limits
      await new Promise(r => setTimeout(r, 2000));
    } catch (e: any) {
      console.error(`Error generating image for "${recipe.title}":`, e.message);
    }
  }
}
