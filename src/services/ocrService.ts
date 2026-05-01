import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

/**
 * Serviço de OCR usando Gemini diretamente no Browser.
 * Ideal para hospedagem estática (GitHub Pages).
 */

const getAI = () => {
  // O AI Studio injeta o GEMINI_API_KEY no process.env global
  const apiKey = (process.env.GEMINI_API_KEY as string);
  
  if (!apiKey) {
    throw new Error("API Key não encontrada.");
  }
  return new GoogleGenAI({ apiKey });
};

export async function processarImagemOCR(imageDataUrl: string): Promise<number[]> {
  console.log('--- 🤖 OCR: Gemini 3 Flash (Client-Side) ---');
  const startTime = Date.now();

  try {
    const ai = getAI();
    const [header, base64] = imageDataUrl.split(",");
    const mimeType = header.match(/:(.*?);/)?.[1] || "image/png";

    const prompt = `
      Examine esta imagem de uma cartela de Bingo 5x5 e extraia os números.
      
      Regras:
      1. Retorne APENAS um JSON: {"numeros": [n1, n2, ..., n25]}
      2. Ordem: esquerda para direita, linha por linha (5 colunas, 5 linhas).
      3. O centro (espaço FREE) deve ser 0.
      4. Colunas B(1-15), I(16-30), N(31-45), G(46-60), O(61-75).
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { data: base64, mimeType } }
        ]
      },
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text || "{}";
    const data = JSON.parse(text);
    const numeros = data.numeros || [];

    if (numeros.length !== 25) {
      const fixed = [...numeros];
      while (fixed.length < 25) fixed.push(0);
      return fixed.slice(0, 25);
    }

    console.log(`✅ OCR Concluído em ${(Date.now() - startTime) / 1000}s`);
    return numeros;

  } catch (error) {
    console.error('❌ Erro no OCR Gemini:', error);
    return Array(25).fill(0);
  }
}

export function formatarGrade(numeros: number[]): (number | null)[][] {
  const grade: (number | null)[][] = [];
  const safeNums = (numeros && numeros.length === 25) ? numeros : Array(25).fill(0);
  
  for (let i = 0; i < 5; i++) {
    const fila: (number | null)[] = [];
    for (let j = 0; j < 5; j++) {
      const val = safeNums[i * 5 + j];
      fila.push(val === 0 ? null : val);
    }
    grade.push(fila);
  }
  return grade;
}
