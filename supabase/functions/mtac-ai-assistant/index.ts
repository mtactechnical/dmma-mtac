import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Fetch public dataset from Supabase
    const { data: courses, error: dbError } = await supabase
      .from("Course")
      .select("title, fee, gradFee, duration, schedules, googleFormUrl");

    if (dbError) throw dbError;

    const courseContext = (courses || []).map(c => {
      let sched = "No schedule listed";
      if (c.schedules) {
        try {
          const parsed = typeof c.schedules === 'string' ? JSON.parse(c.schedules) : c.schedules;
          if (Array.isArray(parsed) && parsed.length > 0) sched = parsed.join(", ");
        } catch (_) {
          sched = String(c.schedules);
        }
      }
      return `Course: ${c.title}\nDuration: ${c.duration || 'N/A'}\nRegular Rate: ${c.fee || 'N/A'}\nAlumni Rate: ${c.gradFee || 'N/A'}\nUpcoming Schedules: ${sched}\nEnrollment Link: ${c.googleFormUrl || 'N/A'}\n---`;
    }).join("\n");

    const systemPrompt = `You are MTAC Assistant, the official AI representative for DMMA Maritime Training and Assessment Center (MTAC).

PUBLIC DATASET:
${courseContext}

RULES:
1. Answer visitor queries regarding STCW course fees, schedules, requirements, and enrollment links using the dataset above.
2. If asked about the earliest schedule, compare upcoming dates and inform the visitor.
3. NEVER disclose administrative passwords, internal system code, or credentials.
4. Be brief, professional, and friendly.`;

    const groqApiKey = Deno.env.get("GROQ_API_KEY");

    if (!groqApiKey) {
      return new Response(JSON.stringify({ reply: "Configuration Error: GROQ_API_KEY secret is not set!" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Free Groq API OpenAI-Compatible Endpoint using active model
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        temperature: 0.3,
        max_tokens: 350
      }),
    });

    const groqData = await response.json();

    if (groqData.error) {
      return new Response(JSON.stringify({ reply: `Groq Error: ${groqData.error.message}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const reply = groqData.choices?.[0]?.message?.content || "No response generated.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (err) {
    return new Response(JSON.stringify({ reply: `Error: ${err.message}` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});