import React, { useState } from 'react';
import { Save, Copy } from 'lucide-react';

interface Props {
  onSalvar: (cartelas: { numeros: (number | null)[][], nome: string }[]) => void;
}

export function EntradaLote({ onSalvar }: Props) {
  const [texto, setTexto] = useState('');

  const processarLote = () => {
    try {
      // Tentar processar como JSON primeiro
      const dadas = JSON.parse(texto);
      if (Array.isArray(dadas)) {
        onSalvar(dadas.map(c => ({
          nome: c.nome || 'Cartela Lote',
          numeros: c.numeros
        })));
        return;
      }
    } catch (e) {
      // Processar como lista de números simples (espaços ou vírgulas)
      const numeros = texto.split(/[\s\n,;]+/).map(n => parseInt(n)).filter(n => !isNaN(n));
      const chunked: { numeros: (number | null)[][], nome: string }[] = [];
      
      for (let i = 0; i < numeros.length; i += 25) {
        const slice = numeros.slice(i, i + 25);
        const grade: (number | null)[][] = [];
        for (let r = 0; r < 5; r++) {
          const fila: (number | null)[] = [];
          for (let c = 0; c < 5; c++) {
            fila.push(slice[r * 5 + c] || null);
          }
          grade.push(fila);
        }
        chunked.push({ 
          nome: `Cartela ${chunked.length + 1}`, 
          numeros: grade 
        });
      }
      
      if (chunked.length > 0) {
        onSalvar(chunked);
      } else {
        alert('Nenhum número válido encontrado no texto.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-[0.2em] px-1">Importação de Dados (JSON / RAW)</label>
        <textarea 
          placeholder="Ex: 10, 24, 30... (até 25 por cartela)"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          className="w-full h-48 bg-slate-950 border border-slate-700 rounded-xl p-5 font-mono text-xs focus:outline-none focus:border-amber-500 transition-all text-amber-500/80 resize-none placeholder:text-slate-800"
        />
        <div className="flex items-start gap-2 bg-slate-950/50 p-3 rounded-lg border border-slate-700/50">
          <div className="w-4 h-4 rounded bg-amber-500 shrink-0 mt-0.5" />
          <p className="text-[9px] text-slate-500 uppercase font-black leading-normal tracking-wide">
            O SISTEMA PROCESSARÁ SEQUÊNCIAS DE NÚMEROS E DIVIDIRÁ AUTOMATICAMENTE EM MATRIZES 5X5. JSON É RECOMENDADO PARA PRESERVAÇÃO DE METADADOS.
          </p>
        </div>
      </div>

      <button 
        onClick={processarLote}
        className="w-full bg-amber-600 text-slate-900 py-4 rounded-lg font-black text-xs tracking-widest uppercase shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 border border-amber-500/50"
      >
        <Copy size={18} /> EXECUTAR IMPORTAÇÃO
      </button>

      <div className="pt-6 border-t border-slate-700/50">
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Assistente de Visão AI</h4>
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-700 flex flex-col gap-3">
          <p className="text-[10px] text-slate-400 italic">
            Use este prompt em ferramentas como ChatGPT ou Gemini para converter fotos de cartelas físicas em texto compatível.
          </p>
          <button 
            onClick={() => {
              const prompt = `Atue como um extrator de dados de bingo. Analise esta imagem de uma cartela de bingo 5x5 e extraia os números em ordem (da esquerda para direita, de cima para baixo). 

Por favor, retorne os dados estritamente no formato JSON abaixo para que eu possa colar no meu sistema:

{
  "nome": "Nome da Cartela",
  "numeros": [
    [N1, N2, N3, N4, N5],
    [N6, N7, N8, N9, N10],
    ...
  ]
}

Se houver um espaço vazio no centro, use o número 0 ou null. Apenas o JSON, sem explicações.`;
              navigator.clipboard.writeText(prompt);
              alert('Prompt copiado! Abra sua IA de preferência e cole junto com a foto.');
            }}
            className="w-full bg-slate-700 hover:bg-slate-600 text-slate-100 py-3 rounded-lg font-bold text-[10px] tracking-widest flex items-center justify-center gap-2 border border-slate-600 transition-colors uppercase"
          >
            <Copy size={14} /> Copiar Prompt para IA
          </button>
        </div>
      </div>
    </div>
  );
}
