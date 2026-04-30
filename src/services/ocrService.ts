import { createWorker } from 'tesseract.js';
import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = (process.env.GEMINI_API_KEY as string);
    if (!apiKey) {
      console.warn('GEMINI_API_KEY não encontrada nas variáveis de ambiente.');
      return null;
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function processarImagemOCR(imageDataUrl: string): Promise<number[]> {
  let numerosTesseract: number[] = [];
  
  try {
    const worker = await createWorker('eng');
    // Definir parâmetros para focar em números e melhorar segmentação
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789',
      tessedit_pageseg_mode: '6' as any,
    });

    const { data: { text } } = await worker.recognize(imageDataUrl);
    await worker.terminate();
    
    numerosTesseract = text
      .split(/[^0-9]+/)
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n) && n > 0 && n <= 99);
    
    numerosTesseract = Array.from(new Set(numerosTesseract));
  } catch (error) {
    console.warn('Tesseract falhou, tentando Gemini...', error);
  }

  // Se o Tesseract falhou ou encontrou poucos números (menos de 15 de 25), usamos Gemini Vision
  if (numerosTesseract.length < 15) {
    try {
      return await processarImagemComGemini(imageDataUrl);
    } catch (error) {
      console.error('Gemini OCR falhou:', error);
      return numerosTesseract; // Retorna o que o Tesseract conseguiu, se houver
    }
  }

  return numerosTesseract;
}

async function processarImagemComGemini(imageDataUrl: string): Promise<number[]> {
  const base64Data = imageDataUrl.split(',')[1];
  const ai = getAI();
  
  if (!ai) {
    throw new Error('IA não pôde ser inicializada. Verifique a chave de API.');
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: "image/png",
            data: base64Data,
          },
        },
        {
          text: "Extraia todos os números desta cartela de bingo 5x5 em ordem de leitura. Retorne apenas os números separados por vírgula. Ignore cabeçalhos e logos.",
        }
      ]
    }
  });

  const text = response.text || "";
  const numeros = text
    .split(/[^0-9]+/)
    .map(s => parseInt(s.trim()))
    .filter(n => !isNaN(n) && n >= 0 && n <= 99);
  
  return Array.from(new Set(numeros));
}

/**
 * Converte uma lista flat de números para uma grade 5x5.
 * Preenche com nulos se houver menos de 25 números.
 */
export function formatarGrade(numeros: number[]): (number | null)[][] {
  const grade: (number | null)[][] = [];
  const numbersWithJoker = [...numeros];
  
  // Se detectou 24 números, assume que o do meio é o coringa e insere null
  if (numbersWithJoker.length === 24) {
    numbersWithJoker.splice(12, 0, null as any);
  }

  for (let i = 0; i < 5; i++) {
    const fila: (number | null)[] = [];
    for (let j = 0; j < 5; j++) {
      if (i === 2 && j === 2) {
        fila.push(null); // Centro é sempre coringa
      } else {
        const valor = numbersWithJoker[i * 5 + j];
        fila.push(valor !== undefined ? valor : null);
      }
    }
    grade.push(fila);
  }
  return grade;
}
