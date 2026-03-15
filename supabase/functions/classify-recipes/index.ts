import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Fetch all recipes
    const recipesRes = await fetch(`${SUPABASE_URL}/rest/v1/recipes?select=id,title,status,ingredients&order=title`, {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    const recipes = await recipesRes.json();

    // Build a compact list for AI
    const recipeList = recipes.map((r: any, i: number) => `${i + 1}. "${r.title}" [status: ${r.status}]`).join("\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a recipe classifier. You will receive a list of recipe titles. Classify each as either "dinner" (suitable as a main dinner meal) or "not_dinner" (breakfast, lunch, snack, dessert, side dish, condiment, marinade, or too light for dinner).

Rules:
- Main protein dishes (chicken, beef, lamb, fish, pork with sides) = dinner
- Substantial one-pot meals, curries, casseroles, stir-fries, pasta bakes = dinner
- Soups that are hearty/substantial = dinner
- Salads with protein = dinner (unless clearly a side salad)
- Wraps/sandwiches = not_dinner (lunch)
- Eggs as main (scrambled, poached, omelette) = not_dinner (breakfast)
- Yoghurt bowls, bento boxes, toast-based = not_dinner
- Marinades, rubs, sauces = not_dinner
- Desserts (custard, pineapple bake) = not_dinner
- Light salads without protein = not_dinner

Use the classify_recipes tool to return your classifications.`
          },
          {
            role: "user",
            content: `Classify these ${recipes.length} recipes:\n\n${recipeList}`
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "classify_recipes",
              description: "Return classification for each recipe",
              parameters: {
                type: "object",
                properties: {
                  classifications: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        index: { type: "number", description: "1-based index from the list" },
                        category: { type: "string", enum: ["dinner", "not_dinner"] },
                        reason: { type: "string", description: "Brief reason, max 5 words" },
                      },
                      required: ["index", "category", "reason"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["classifications"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "classify_recipes" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again shortly" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const { classifications } = JSON.parse(toolCall.function.arguments);

    // Map back to recipe IDs
    const result = classifications.map((c: any) => {
      const recipe = recipes[c.index - 1];
      return {
        id: recipe?.id,
        title: recipe?.title,
        status: recipe?.status,
        category: c.category,
        reason: c.reason,
      };
    }).filter((r: any) => r.id); // filter out any bad indices

    return new Response(JSON.stringify({ classifications: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("classify error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
