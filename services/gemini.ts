import { GoogleGenAI } from "@google/genai";

// Mengambil API Key dengan aman
const apiKey = process.env.API_KEY;

// Inisialisasi AI hanya jika API Key tersedia
let ai: GoogleGenAI | null = null;
if (apiKey && apiKey.startsWith("AIza")) {
  try {
    ai = new GoogleGenAI({ apiKey: apiKey });
  } catch (e) {
    console.warn("Gagal menginisialisasi Google GenAI, menggunakan mode offline.");
  }
}

export const generateQuoteOfTheDay = async () => {
  // Jika AI belum diinisialisasi (tidak ada key), langsung return default
  if (!ai) {
    return "Tuntutlah ilmu setinggi mungkin, karena ilmu adalah cahaya kehidupan.";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Menggunakan model yang lebih stabil & cepat
      contents: 'Generate a short Islamic wisdom or quote (hikmah) in Indonesian and its Arabic source if applicable, for a student portal of Islamic Education. Keep it inspiring for teenagers.',
      config: {
        temperature: 0.7,
      }
    });
    
    if (response && response.text) {
        return response.text;
    }
    return "Barangsiapa bersungguh-sungguh, maka dia akan mendapatkan kesuksesan.";
  } catch (error) {
    // Fallback jika terjadi error koneksi atau kuota habis
    return "Ilmu tanpa amal bagaikan pohon tanpa buah.";
  }
};