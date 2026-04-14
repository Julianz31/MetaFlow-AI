import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

export async function analizarTransaccionIA(texto: string) {
  if (!apiKey) throw new Error("Configuración de IA incompleta");

  try {
    // Usamos el modelo estable 2.5 Flash recomendado para producción
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      Analiza este texto y responde SOLO con un objeto JSON.
      Texto: "${texto}"
      JSON: { "monto": número, "descripcion": "texto", "tipo": "gasto" o "ingreso", "categoria": "Otros" }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawText = response.text();
    
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Error detallado en Gemini:", error);
    return { 
      monto: 0, 
      descripcion: "Revisando motor de IA...", 
      tipo: "gasto", 
      categoria: "Otros" 
    };
  }
}