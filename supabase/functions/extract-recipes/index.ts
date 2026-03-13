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
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;

    const supabase = createClient(supabaseUrl, serviceKey);

    // 1. Get book metadata
    const { data: book, error: bookErr } = await supabase
      .from("books")
      .select("*")
      .eq("id", bookId)
      .single();
    if (bookErr || !book) throw new Error("Book not found");

    // 2. Download the file from storage
    const { data: fileData, error: dlErr } = await supabase.storage
      .from("books")
      .download(book.file_path);
    if (dlErr || !fileData) throw new Error("Could not download book file: " + dlErr?.message);

    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce((s, b) => s + String.fromCharCode(b), "")
    );

    const mimeType = book.file_type === "epub" ? "application/epub+zip" : "application/pdf";

    // 3. Send to AI for extraction
    const systemPrompt = `You are a recipe extraction assistant. You will be given a cookbook file. Extract ALL recipes you can find.

For each recipe, extract:
- title: the recipe name
- page_reference: the page number if visible (e.g. "p. 42"), or null
- ingredients: the full ingredients list as plain text, each ingredient on its own line
- instructions: the full method/instructions as plain text, each step on its own line
- image_description: a brief description of the recipe photo if one exists, or null

Return your results using the extract_recipes tool.`;

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
                type: "file",
                file: {
                  filename: book.file_path.split("/").pop() || "book",
                  data: base64,
                  mime_type: mimeType,
                },
              },
              {
                type: "text",
                text: `Extract all recipes from this cookbook: "${book.title}". Find every recipe with its ingredients and instructions.`,
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
                        title: { type: "string", description: "Recipe title" },
                        page_reference: {
                          type: "string",
                          description: "Page number reference like 'p. 42'",
                          nullable: true,
                        },
                        ingredients: {
                          type: "string",
                          description: "Full ingredients list, one per line",
                        },
                        instructions: {
                          type: "string",
                          description: "Full method/instructions, one step per line",
                        },
                        image_description: {
                          type: "string",
                          description: "Brief description of the recipe photo if present",
                          nullable: true,
                        },
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

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again in a minute." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please top up in Settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI extraction failed: " + errText);
    }

    const aiData = await aiResponse.json();
    console.log("AI response:", JSON.stringify(aiData).slice(0, 500));

    // Parse tool call result
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("AI did not return structured recipes");

    const extracted = JSON.parse(toolCall.function.arguments);
    const recipes = extracted.recipes || [];

    if (recipes.length === 0) {
      return new Response(JSON.stringify({ message: "No recipes found in this book.", count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Map book title to a matching BOOK_SOURCES entry or use the book title
    const bookSourceName = book.title;

    // 5. Insert recipes into the database
    const toInsert = recipes.map((r: any) => ({
      title: r.title,
      book_source: bookSourceName,
      page_reference: r.page_reference || null,
      ingredients: r.ingredients || null,
      instructions: r.instructions || null,
      status: "green",
      warnings: [],
      banned_ingredients_found: [],
    }));

    const { error: insertErr } = await supabase.from("recipes").insert(toInsert);
    if (insertErr) throw new Error("Failed to save recipes: " + insertErr.message);

    return new Response(
      JSON.stringify({ message: `Extracted ${recipes.length} recipes from "${book.title}"`, count: recipes.length }),
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
