import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { bookId } = await req.json();
    if (!bookId) throw new Error("bookId is required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceKey);

    // 1. Get book metadata
    const { data: book, error: bookErr } = await supabase
      .from("books")
      .select("*")
      .eq("id", bookId)
      .single();
    if (bookErr || !book) throw new Error("Book not found");

    // 2. Create a job record
    const { data: job, error: jobErr } = await supabase
      .from("extraction_jobs")
      .insert({ book_id: bookId, status: "processing", progress: 10 })
      .select()
      .single();
    if (jobErr || !job) throw new Error("Could not create job: " + jobErr?.message);

    // 3. Kick off background processing
    // @ts-ignore - EdgeRuntime.waitUntil is available in Supabase Edge Functions
    EdgeRuntime.waitUntil(processBook(supabase, book, job.id));

    // 4. Return immediately with the job ID
    return new Response(
      JSON.stringify({ jobId: job.id, message: "Extraction started" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("extract-recipes error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function processBook(supabase: any, book: any, jobId: string) {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

  try {
    // Get the public URL for the file
    const { data: urlData } = supabase.storage.from("books").getPublicUrl(book.file_path);
    const fileUrl = urlData.publicUrl;

    await supabase
      .from("extraction_jobs")
      .update({ progress: 20, updated_at: new Date().toISOString() })
      .eq("id", jobId);

    const systemPrompt = `You are a recipe extraction assistant. You will be given a cookbook. Extract ALL recipes you can find.

For each recipe, extract:
- title: the recipe name
- page_reference: the page number if visible (e.g. "p. 42"), or null
- ingredients: the full ingredients list as plain text, each ingredient on its own line
- instructions: the full method/instructions as plain text, each step on its own line

Return your results using the extract_recipes tool. Extract EVERY recipe you can find.`;

    await supabase
      .from("extraction_jobs")
      .update({ progress: 30, updated_at: new Date().toISOString() })
      .eq("id", jobId);

    // Send the file URL to the AI - no need to download into memory
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: fileUrl },
              },
              {
                type: "text",
                text: `Extract all recipes from this cookbook: "${book.title}". Find every recipe with its ingredients, instructions, and page numbers.`,
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_recipes",
              description: "Submit all extracted recipes from the cookbook",
              parameters: {
                type: "object",
                properties: {
                  recipes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        page_reference: { type: "string", nullable: true },
                        ingredients: { type: "string" },
                        instructions: { type: "string" },
                      },
                      required: ["title", "ingredients", "instructions"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["recipes"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_recipes" } },
      }),
    });

    await supabase
      .from("extraction_jobs")
      .update({ progress: 70, updated_at: new Date().toISOString() })
      .eq("id", jobId);

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error(`AI extraction failed (${aiResponse.status}): ${errText}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI response received, parsing tool call...");

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("AI did not return structured recipes");

    const extracted = JSON.parse(toolCall.function.arguments);
    const recipes = extracted.recipes || [];

    await supabase
      .from("extraction_jobs")
      .update({ progress: 85, updated_at: new Date().toISOString() })
      .eq("id", jobId);

    if (recipes.length > 0) {
      const toInsert = recipes.map((r: any) => ({
        title: r.title,
        book_source: book.title,
        page_reference: r.page_reference || null,
        ingredients: r.ingredients || null,
        instructions: r.instructions || null,
        status: "green",
        warnings: [],
        banned_ingredients_found: [],
      }));

      const { error: insertErr } = await supabase.from("recipes").insert(toInsert);
      if (insertErr) throw new Error("Failed to save recipes: " + insertErr.message);
    }

    await supabase
      .from("extraction_jobs")
      .update({
        status: "completed",
        progress: 100,
        result_count: recipes.length,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    console.log(`Extraction complete: ${recipes.length} recipes from "${book.title}"`);
  } catch (e) {
    console.error("processBook error:", e);
    await supabase
      .from("extraction_jobs")
      .update({
        status: "failed",
        error: e instanceof Error ? e.message : "Unknown error",
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);
  }
}
