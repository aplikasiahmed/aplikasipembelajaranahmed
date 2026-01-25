
import { GoogleGenAI } from "@google/genai";

// Fixed: Initialize GoogleGenAI strictly using the process.env.API_KEY directly as required by guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateQuoteOfTheDay = async () => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: 'Generate a short Islamic wisdom or quote (hikmah) in Indonesian and its Arabic source if applicable, for a student portal of Islamic Education. Keep it inspiring for teenagers.',
      config: {
        temperature: 0.7,
      }
    });
    // The .text property is used correctly to retrieve the generated string.
    return response.text;
  } catch (error) {
    return "Tuntutlah ilmu setinggi mungkin, karena ilmu adalah cahaya kehidupan.";
  }
};
