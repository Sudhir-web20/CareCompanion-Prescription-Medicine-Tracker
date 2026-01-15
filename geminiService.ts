
import { GoogleGenAI, Type } from "@google/genai";
import { Medicine, Interaction } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const medicineSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "Name of the medicine" },
      dosage: { type: Type.STRING, description: "Dosage amount (e.g., 500mg, 1 tablet)" },
      frequency: { type: Type.STRING, description: "How often to take it (e.g., Twice daily)" },
      timings: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "Standard slots: Morning, Afternoon, Evening, Night"
      },
      durationDays: { type: Type.NUMBER, description: "Duration in days" }
    },
    required: ["name", "dosage", "frequency", "timings", "durationDays"]
  }
};

export const parsePrescription = async (base64Image: string): Promise<Medicine[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
          { text: "Carefully extract the medicine details from this prescription. Provide a list of medicines with their dosage, frequency, and recommended timings (Morning, Afternoon, Evening, Night). Use the provided JSON schema." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: medicineSchema,
      }
    });

    const jsonStr = response.text;
    if (!jsonStr) throw new Error("No data extracted from prescription.");
    
    const parsed: any[] = JSON.parse(jsonStr);
    
    return parsed.map((m, index) => ({
      id: `med-${Date.now()}-${index}`,
      name: m.name,
      dosage: m.dosage,
      frequency: m.frequency,
      timings: m.timings,
      durationDays: m.durationDays || 10
    }));
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

export const checkInteractions = async (medicines: Medicine[], remedies: string[]): Promise<Record<string, Interaction>> => {
  if (remedies.length === 0 || medicines.length === 0) return {};

  const prompt = `Act as a clinical pharmacist. Analyze potential interactions between these prescribed medicines and the listed OTC remedies/natural supplements.
  
  Prescribed Medicines:
  ${medicines.map(m => `- ${m.name} (${m.dosage})`).join('\n')}
  
  OTC/Remedies:
  ${remedies.map(r => `- ${r}`).join('\n')}
  
  Identify any dangerous interactions or advice.
  Return a JSON object where the keys are the medicine IDs and the values are objects with:
  - "severity": either "high" (serious interaction) or "medium" (precautionary advice).
  - "summary": a short (3-5 words) punchy warning title.
  - "detail": a full explanation of the interaction and what to do.

  If no interaction exists for a medicine, do not include its ID.
  Return ONLY the JSON object.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const jsonStr = response.text;
    return jsonStr ? JSON.parse(jsonStr) : {};
  } catch (error) {
    console.error("Interaction Check Error:", error);
    return {};
  }
};
