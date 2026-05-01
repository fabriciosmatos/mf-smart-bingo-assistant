import Tesseract from 'tesseract.js';
import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('OCR: GEMINI_API_KEY não encontrada nas variáveis de ambiente.');
      return null;
    }
    console.log('OCR: Inicializando instância do Gemini com GoogleGenAI...');
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function processarImagemOCR(imageDataUrl: string): Promise<number[]> {
  console.log('OCR: Iniciando processamento da imagem...');
  let numerosTesseract: number[] = [];
  
  try {
    console.log('OCR: Tentando Tesseract.js (v7)...');
    const result = await Tesseract.recognize(imageDataUrl, 'eng', {
      logger: m => {
        if (m.status === 'recognizing text') {
          console.log('Tesseract:', Math.round(m.progress * 100) + '%');
        }
      }
    });
    
    const text = result.data.text;
    console.log('OCR: Texto extraído pelo Tesseract:', text);
    
    numerosTesseract = text
      .split(/[^0-9]+/)
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n) && n > 0 && n <= 99);
    
    numerosTesseract = Array.from(new Set(numerosTesseract));
    console.log('OCR: Números únicos (Tesseract):', numerosTesseract);
  } catch (error) {
    console.warn('OCR: Tesseract falhou, tentando Gemini...', error);
  }

  // Se o Tesseract falhou ou encontrou poucos números, usamos Gemini Vision
  if (numerosTesseract.length < 15) {
    console.log('OCR: Poucos números detectados. Recorrendo ao Gemini 3 Flash...');
    try {
      return await processarImagemComGemini(imageDataUrl);
    } catch (error) {
      console.error('OCR: Gemini falhou:', error);
      return numerosTesseract; 
    }
  }

  return numerosTesseract;
}

async function processarImagemComGemini(imageDataUrl: string): Promise<number[]> {
  console.log('OCR: Preparando payload para Gemini Vision...');
  const base64Data = imageDataUrl.split(',')[1];
  const ai = getAI();
  
  if (!ai) {
    throw new Error('IA não pôde ser inicializada. Verifique a sua chave de API.');
  }

  console.log('OCR: Enviando requisição ao Gemini...');
  const result = await ai.models.generateContent({
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
          text: "Extraia todos os números desta cartela de bingo 5x5 em ordem de leitura. Retorne apenas os números separados por vírgula. Ignore o texto 'Bingo' ou logos. Se houver um espaço vazio no meio (coringa), apenas pule-o.",
        }
      ]
    }
  });

  const text = result.text || "";
  console.log('OCR: Resposta do Gemini:', text);

  const numeros: number[] = text
    .split(/[^0-9]+/)
    .map(s => parseInt(s.trim()))
    .filter(n => !isNaN(n) && n >= 1 && n <= 99);
  
  const final = Array.from(new Set(numeros));
  console.log('OCR: Números finais extraídos:', final);
  return final;
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
