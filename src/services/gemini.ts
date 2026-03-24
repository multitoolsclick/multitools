import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

export const getGeminiModel = (modelName: string = "gemini-3-flash-preview") => {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  const ai = new GoogleGenAI({ apiKey });
  return ai;
};

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const isRateLimit = error.message?.includes('429') || error.status === 'RESOURCE_EXHAUSTED' || JSON.stringify(error).includes('429');
      
      if (isRateLimit && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export async function generateText(prompt: string, systemInstruction?: string) {
  return withRetry(async () => {
    const ai = getGeminiModel();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
      },
    });
    return response.text;
  });
}

export async function processFileWithAI(file: File | Blob, prompt: string, systemInstruction?: string, modelName: string = "gemini-3-flash-preview") {
  return withRetry(async () => {
    const ai = getGeminiModel(modelName);
    const base64Data = await fileToBase64(file);
    const mimeType = file.type || 'audio/webm';

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          parts: [
            { inlineData: { data: base64Data, mimeType } },
            { text: prompt }
          ]
        }
      ],
      config: {
        systemInstruction,
      },
    });
    return response.text;
  });
}

export async function textToSpeech(text: string, voice: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr' = 'Kore') {
  const ai = getGeminiModel("gemini-2.5-flash-preview-tts");
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voice },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("Failed to generate audio");
  
  return `data:audio/mp3;base64,${base64Audio}`;
}

async function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64String = result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = error => reject(error);
  });
}
