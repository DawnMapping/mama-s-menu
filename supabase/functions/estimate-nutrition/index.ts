import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { recipe_id } = await req.json();
    if (!recipe_id) throw new Error("recipe_id is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch recipe
    const { data: recipe, error: fetchErr } = await supabase
      .from("recipes")
      .select("id, title, ingredients")
      .eq("id", recipe_id)
      .single();
    if (fetchErr) throw fetchErr;
    if (!recipe.ingredients) throw new Error("No ingredients to estimate from");

    // Call AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a nutrition estimation assistant. Given a recipe's ingredients, estimate per-serve nutritional values and cooking times. Be reasonable and realistic with estimates. Use Australian serving conventions. Include dietary fibre.`,
          },
          {
            role: "user",
            content: `Estimate the nutrition per serve for this recipe:\n\nTitle: ${recipe.title}\n\nIngredients:\n${recipe.ingredients}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "set_nutrition",
              description: "Set the estimated nutritional values for a recipe per serve",
              parameters: {
                type: "object",
                properties: {
                  calories: { type: "integer", description: "Estimated calories per serve" },
                  protein_g: { type: "number", description: "Grams of protein per serve" },
                  carbs_g: { type: "number", description: "Grams of carbohydrates per serve" },
                  fat_g: { type: "number", description: "Grams of fat per serve" },
                  fibre_g: { type: "number", description: "Grams of dietary fibre per serve" },
                  prep_time_min: { type: "integer", description: "Estimated prep time in minutes" },
                  cook_time_min: { type: "integer", description: "Estimated cook time in minutes" },
                },
                required: ["calories", "protein_g", "carbs_g", "fat_g", "fibre_g", "prep_time_min", "cook_time_min"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "set_nutrition" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await aiResponse.text();
      throw new Error(`AI gateway error ${status}: ${text}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const nutrition = JSON.parse(toolCall.function.arguments);

    // Update recipe
    const { error: updateErr } = await supabase
      .from("recipes")
      .update({
        calories: nutrition.calories,
        protein_g: nutrition.protein_g,
        carbs_g: nutrition.carbs_g,
        fat_g: nutrition.fat_g,
        prep_time_min: nutrition.prep_time_min,
        cook_time_min: nutrition.cook_time_min,
      })
      .eq("id", recipe_id);
    if (updateErr) throw updateErr;

    return new Response(JSON.stringify({ success: true, nutrition }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("estimate-nutrition error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
