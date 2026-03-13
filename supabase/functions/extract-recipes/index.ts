import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Lightweight Supabase REST helpers (no SDK import)
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
  const body = await res.json();
  return body;
}

async function sbInsert(table: string, rows: any) {
  const res = await fetch(`${sbUrl()}/rest/v1/${table}`, {
    method: "POST",
    headers: sbHeaders(),
    body: JSON.stringify(rows),
  });
  const body = await res.json();
  return body;
}

async function sbUpdate(table: string, query: string, data: any) {
  const res = await fetch(`${sbUrl()}/rest/v1/${table}?${query}`, {
    method: "PATCH",
    headers: { ...sbHeaders(), Prefer: "return=minimal" },
    body: JSON.stringify(data),
  });
  await res.text(); // consume body
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { bookId } = await req.json();
    if (!bookId) throw new Error("bookId is required");

    // 1. Get book
    const books = await sbSelect("books", `id=eq.${bookId}&select=*`);
    const book = books?.[0];
    if (!book) throw new Error("Book not found");

    // 2. Create job
    const jobs = await sbInsert("extraction_jobs", { book_id: bookId, status: "processing", progress: 10 });
    const job = jobs?.[0];
    if (!job) throw new Error("Could not create job");

    // 3. Background processing
    // @ts-ignore
    EdgeRuntime.waitUntil(processBook(book, job.id));

    return new Response(
      JSON.stringify({ jobId: job.id, message: "Extraction started" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("extract-recipes error:", e);
    return new Response(
      JSON.stringify({ error: e.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function processBook(book: any, jobId: string) {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

  try {
    const fileUrl = `${supabaseUrl}/storage/v1/object/public/books/${book.file_path}`;

    await sbUpdate("extraction_jobs", `id=eq.${jobId}`, { progress: 25, updated_at: new Date().toISOString() });

    const systemPrompt = `You are a recipe extraction assistant analyzing a cookbook. Extract ALL recipes.
For each recipe extract: title, page_reference (e.g. "p. 42" or null), ingredients (one per line), instructions (one step per line).
Use the extract_recipes tool to return results.`;

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
              { type: "image_url", image_url: { url: fileUrl } },
              { type: "text", text: `Extract all recipes from: "${book.title}"` },
            ],
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_recipes",
            description: "Submit extracted recipes",
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
        }],
        tool_choice: { type: "function", function: { name: "extract_recipes" } },
      }),
    });

    await sbUpdate("extraction_jobs", `id=eq.${jobId}`, { progress: 70, updated_at: new Date().toISOString() });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error(`AI failed (${aiResponse.status})`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("AI did not return structured recipes");

    const extracted = JSON.parse(toolCall.function.arguments);
    const recipes = extracted.recipes || [];

    await sbUpdate("extraction_jobs", `id=eq.${jobId}`, { progress: 85, updated_at: new Date().toISOString() });

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

      await sbInsert("recipes", toInsert);
    }

    await sbUpdate("extraction_jobs", `id=eq.${jobId}`, {
      status: "completed",
      progress: 100,
      result_count: recipes.length,
      updated_at: new Date().toISOString(),
    });

    console.log(`Done: ${recipes.length} recipes from "${book.title}"`);
  } catch (e: any) {
    console.error("processBook error:", e);
    await sbUpdate("extraction_jobs", `id=eq.${jobId}`, {
      status: "failed",
      error: e.message || "Unknown error",
      updated_at: new Date().toISOString(),
    });
  }
}
