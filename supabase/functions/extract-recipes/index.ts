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
    const fileUrl = `${supabaseUrl}/storage/v1/object/public/books/${encodeURIComponent(book.file_path)}`;

    await sbUpdate("extraction_jobs", `id=eq.${jobId}`, { progress: 15, updated_at: new Date().toISOString() });

    // Download file
    const fileResp = await fetch(fileUrl);
    if (!fileResp.ok) throw new Error("Could not download book file");
    const fileBytes = new Uint8Array(await fileResp.arrayBuffer());

    await sbUpdate("extraction_jobs", `id=eq.${jobId}`, { progress: 30, updated_at: new Date().toISOString() });

    let userContent: any[];

    if (book.file_type === "epub") {
      // EPUB: extract text from the ZIP (XHTML files inside)
      const textContent = await extractEpubText(fileBytes);
      await sbUpdate("extraction_jobs", `id=eq.${jobId}`, { progress: 40, updated_at: new Date().toISOString() });
      userContent = [
        { type: "text", text: `Here is the full text of the cookbook "${book.title}". Extract all recipes:\n\n${textContent}` },
      ];
    } else {
      // PDF: send as base64 data URL
      let base64 = "";
      const chunkSize = 32768;
      for (let i = 0; i < fileBytes.length; i += chunkSize) {
        const chunk = fileBytes.subarray(i, i + chunkSize);
        base64 += String.fromCharCode(...chunk);
      }
      base64 = btoa(base64);
      const dataUrl = `data:application/pdf;base64,${base64}`;
      await sbUpdate("extraction_jobs", `id=eq.${jobId}`, { progress: 40, updated_at: new Date().toISOString() });
      userContent = [
        { type: "image_url", image_url: { url: dataUrl } },
        { type: "text", text: `Extract all recipes from: "${book.title}"` },
      ];
    }

    const systemPrompt = `You are a recipe extraction assistant analyzing a cookbook. Extract ONLY dinner and main meal recipes.
EXCLUDE: breakfasts, brunches, smoothies, snacks, desserts, sweets, cakes, muffins, biscuits, porridge, muesli, cereals, morning teas, and any side dishes that aren't a complete meal.
INCLUDE: dinners, mains, lunches that are substantial meals (e.g. curries, stir-fries, roasts, grills, casseroles, pasta dishes, salads that are a full meal, soups that are a main).
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
          { role: "user", content: userContent },
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

// Simple EPUB text extractor - EPUBs are ZIP files containing XHTML
async function extractEpubText(zipBytes: Uint8Array): Promise<string> {
  // Parse ZIP central directory to find XHTML/HTML files
  const textParts: string[] = [];
  const decoder = new TextDecoder();

  // Find end of central directory record
  let eocdPos = -1;
  for (let i = zipBytes.length - 22; i >= 0; i--) {
    if (zipBytes[i] === 0x50 && zipBytes[i+1] === 0x4b && zipBytes[i+2] === 0x05 && zipBytes[i+3] === 0x06) {
      eocdPos = i;
      break;
    }
  }
  if (eocdPos === -1) throw new Error("Not a valid ZIP/EPUB file");

  const view = new DataView(zipBytes.buffer);
  const cdOffset = view.getUint32(eocdPos + 16, true);
  const cdEntries = view.getUint16(eocdPos + 10, true);

  let pos = cdOffset;
  for (let e = 0; e < cdEntries; e++) {
    if (pos + 46 > zipBytes.length) break;
    const sig = view.getUint32(pos, true);
    if (sig !== 0x02014b50) break;

    const compMethod = view.getUint16(pos + 10, true);
    const compSize = view.getUint32(pos + 20, true);
    const uncompSize = view.getUint32(pos + 24, true);
    const nameLen = view.getUint16(pos + 28, true);
    const extraLen = view.getUint16(pos + 30, true);
    const commentLen = view.getUint16(pos + 32, true);
    const localHeaderOffset = view.getUint32(pos + 42, true);

    const fileName = decoder.decode(zipBytes.subarray(pos + 46, pos + 46 + nameLen));
    const nextEntry = pos + 46 + nameLen + extraLen + commentLen;

    // Only process XHTML/HTML files (where recipe content lives)
    if (/\.(xhtml|html|htm)$/i.test(fileName) && !fileName.includes("toc") && !fileName.includes("nav")) {
      // Read local file header to find data start
      const lfhExtra = view.getUint16(localHeaderOffset + 28, true);
      const lfhName = view.getUint16(localHeaderOffset + 26, true);
      const dataStart = localHeaderOffset + 30 + lfhName + lfhExtra;

      let content: string;
      if (compMethod === 0) {
        // Stored (no compression)
        content = decoder.decode(zipBytes.subarray(dataStart, dataStart + uncompSize));
      } else if (compMethod === 8) {
        // Deflated - wrap raw deflate with zlib header for DecompressionStream
        const compressed = zipBytes.subarray(dataStart, dataStart + compSize);
        // Prepend zlib header (0x78 0x01 = no compression/low) to raw deflate data
        const zlibWrapped = new Uint8Array(compressed.length + 2);
        zlibWrapped[0] = 0x78;
        zlibWrapped[1] = 0x01;
        zlibWrapped.set(compressed, 2);
        const ds = new DecompressionStream("deflate");
        const writer = ds.writable.getWriter();
        writer.write(zlibWrapped);

        writer.close();
        const reader = ds.readable.getReader();
        const chunks: Uint8Array[] = [];
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }
        const total = chunks.reduce((s, c) => s + c.length, 0);
        const merged = new Uint8Array(total);
        let offset = 0;
        for (const c of chunks) { merged.set(c, offset); offset += c.length; }
        content = decoder.decode(merged);
      } else {
        pos = nextEntry;
        continue;
      }

      // Strip HTML tags to get plain text
      const text = content
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&#\d+;/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      if (text.length > 50) {
        textParts.push(text);
      }
    }
    pos = nextEntry;
  }

  // Truncate to ~100k chars to stay within AI context limits
  let combined = textParts.join("\n\n---\n\n");
  if (combined.length > 100000) {
    combined = combined.slice(0, 100000) + "\n\n[TRUNCATED]";
  }
  return combined;
}
