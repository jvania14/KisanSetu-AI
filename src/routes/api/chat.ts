import { createFileRoute } from "@tanstack/react-router";
import { streamText, type ModelMessage } from "ai";
import { createGateway, MODEL, reasoningOptions, userClientFromRequest, fetchWeather } from "@/lib/ai.server";

const SYSTEM = `You are Kisan AI, the KisanSetu decision assistant for Indian farmers.
- Reply in the same language the farmer writes in (Hindi in Devanagari, English, or Hinglish).
- Be practical, short, structured with markdown headings and bullet points.
- Use ONLY the farm context, weather and farmer-recorded mandi prices provided below. Never invent live weather, mandi prices, MSP values, buyers, or disease confidence.
- When a diagnosis is uncertain, say so, list possibilities, and recommend uploading a photo in Crop Doctor (/crop-doctor) or consulting a local KVK expert.
- For market questions, point to /mandi to compare net proceeds, and /marketplace to list produce.
- Ask a follow-up question when key information (crop, area, location, stage) is missing.
- End with a short "Sources & uncertainty" line stating what data you used.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const ctx = await userClientFromRequest(request);
        if (!ctx) return new Response("Unauthorized", { status: 401 });
        const { supabase, userId } = ctx;
        const { message } = (await request.json()) as { message?: string };
        if (!message || message.length > 4000) return new Response("Invalid message", { status: 400 });

        const [{ data: profile }, { data: crops }, { data: prices }, { data: history }] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
          supabase.from("crops").select("name,variety,area,sowing_date,stage").eq("user_id", userId),
          supabase.from("mandi_prices").select("commodity,market,price_per_quintal,distance_km,observed_on").eq("user_id", userId).order("observed_on", { ascending: false }).limit(15),
          supabase.from("chat_messages").select("role,content").eq("user_id", userId).order("created_at").limit(40),
        ]);

        let weather: unknown = null;
        if (profile?.latitude != null && profile?.longitude != null) {
          weather = await fetchWeather(Number(profile.latitude), Number(profile.longitude)).catch(() => null);
        }

        const { error: insErr } = await supabase.from("chat_messages").insert({ user_id: userId, role: "user", content: message });
        if (insErr) return new Response("Could not save message", { status: 500 });

        const context = `FARM CONTEXT (JSON): ${JSON.stringify({ profile: profile && { name: profile.full_name, state: profile.state, district: profile.district, farm_area: profile.farm_area, unit: profile.area_unit, soil: profile.soil_type, ph: profile.soil_ph, irrigation: profile.irrigation, npk: [profile.n_value, profile.p_value, profile.k_value] }, crops, farmer_recorded_mandi_prices: prices, weather_open_meteo: weather ?? "not available (no farm location saved)" })}`;

        const messages: ModelMessage[] = [
          ...(history ?? []).map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
          { role: "user", content: message },
        ];

        const provider = createGateway();
        const result = streamText({
          model: provider.responses(MODEL),
          instructions: `${SYSTEM}\n\n${context}`,
          messages,
          abortSignal: request.signal,
          providerOptions: reasoningOptions,
          onFinish: async ({ text }) => {
            if (!text) return;
            const { error } = await supabase.from("chat_messages").insert({ user_id: userId, role: "assistant", content: text });
            if (error) console.error("save assistant", error);
          },
        } as Parameters<typeof streamText>[0]);
        return result.toTextStreamResponse();
      },
    },
  },
});
