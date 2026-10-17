import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({
  imagePath: z.string().min(1).max(300),
  crop: z.string().max(80),
  stage: z.string().max(80),
  symptoms: z.string().max(1500),
});

export const diagnoseCrop = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (!data.imagePath.startsWith(`${userId}/`)) throw new Error("Forbidden");
    const { data: file, error } = await supabase.storage.from("crop-images").download(data.imagePath);
    if (error || !file) throw new Error("Could not read image");
    const bytes = new Uint8Array(await file.arrayBuffer());

    const { streamText, Output } = await import("ai");
    const { z: z4 } = await import("zod/v4");
    const { createGateway, MODEL, reasoningOptions } = await import("@/lib/ai.server");

    const schema = z4.object({
      identified_crop: z4.string(),
      image_usable: z4.boolean(),
      possible_issue: z4.string(),
      observations: z4.array(z4.string()),
      certainty: z4.enum(["low", "moderate", "high"]),
      alternatives: z4.array(z4.string()),
      organic_management: z4.array(z4.string()),
      chemical_guidance: z4.array(z4.string()),
      prevention: z4.array(z4.string()),
      monitoring: z4.array(z4.string()),
      consult_expert_when: z4.string(),
      summary_hindi: z4.string(),
    });

    const provider = createGateway();
    const result = streamText({
      model: provider.responses(MODEL),
      instructions:
        "You are an agricultural plant pathology assistant for Indian farmers. Analyse the crop photo and farmer notes. Be honest about uncertainty; never claim a confirmed diagnosis. If the image is not a plant or unclear, set image_usable=false and explain in possible_issue. Chemical guidance must mention reading the label, correct dose, PPE and pre-harvest intervals; only list actives approved in India. Keep each bullet short.",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `Crop: ${data.crop || "unknown"}\nGrowth stage: ${data.stage || "unknown"}\nFarmer notes: ${data.symptoms || "none"}` },
            { type: "file", data: bytes, mediaType: file.type || "image/jpeg" },
          ],
        },
      ],
      output: Output.object({ schema }),
      providerOptions: reasoningOptions,
    } as Parameters<typeof streamText>[0]);
    const output = (await result.output) as Record<string, unknown>;

    const { data: row, error: insErr } = await supabase
      .from("diagnoses")
      .insert({ user_id: userId, crop: data.crop, stage: data.stage, symptoms: data.symptoms, image_path: data.imagePath, result: output })
      .select("id")
      .single();
    if (insErr) throw new Error("Could not save diagnosis");
    return { id: row.id, result: output };
  });
