import React, { useState } from 'react';
import { Save, Copy } from 'lucide-react';

interface Props {
  onSalvar: (cartelas: { numeros: (number | null)[][], nome: string }[]) => void;
}

export function EntradaLote({ onSalvar }: Props) {
  const [texto, setTexto] = useState('');

  const processarLote = () => {
    try {
      // Tentar processar como JSON
      const dadas = JSON.parse(texto);
      const items = Array.isArray(dadas) ? dadas : [dadas];
      
      const cartelasFormatadas = items.map(c => {
        let numeros: (number | null)[][] = [];
        const rawNums = c.numeros || c.numbers;

        if (Array.isArray(rawNums) && rawNums.length > 0) {
          // Caso seja 2D [[...],[...]]
          if (Array.isArray(rawNums[0])) {
            numeros = rawNums.map((linha: any[]) => 
              linha.map(v => (v === 0 || v === null || v === 'FREE' || v === '') ? null : parseInt(v))
            );
          } 
          // Caso seja 1D [...]
          else {
            for (let i = 0; i < 5; i++) {
              numeros.push(rawNums.slice(i * 5, i * 5 + 5).map((v: any) => 
                (v === 0 || v === null || v === 'FREE' || v === '') ? null : parseInt(v)
              ));
            }
          }
        }

        // Validar se temos uma grade 5x5 (preencher com null se necessário)
        if (numeros.length < 5) {
          while (numeros.length < 5) numeros.push(Array(5).fill(null));
        }
        numeros = numeros.map(fila => {
          const novaFila = [...fila];
          while (novaFila.length < 5) novaFila.push(null);
          return novaFila.slice(0, 5);
        }).slice(0, 5);

        return {
          nome: c.nome || c.name || 'Cartela Importada',
          numeros
        };
      }).filter(c => c.numeros.some(fila => fila.some(n => n !== null)));

      if (cartelasFormatadas.length > 0) {
        onSalvar(cartelasFormatadas);
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
        alert('Nenhum dado válido encontrado. Verifique o formato do JSON ou a lista de números.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-[0.2em] px-1">Importação em Massa (JSON / Lista)</label>
        <textarea 
          placeholder='Ex: [ {"nome": "C1", "numeros": [...] }, {"nome": "C2", ...} ]'
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          className="w-full h-48 bg-slate-950 border border-slate-700 rounded-xl p-5 font-mono text-xs focus:outline-none focus:border-amber-500 transition-all text-amber-500/80 resize-none placeholder:text-slate-800"
        />
        <div className="flex items-start gap-2 bg-slate-950/50 p-3 rounded-lg border border-slate-700/50">
          <div className="w-4 h-4 rounded bg-amber-500 shrink-0 mt-0.5 flex items-center justify-center text-[8px] font-bold text-slate-900">!</div>
          <p className="text-[9px] text-slate-500 uppercase font-black leading-normal tracking-wide">
            DICA: VOCÊ PODE COLAR UMA ÚNICA CARTELA OU UMA LISTA COMPLETA "[...]" COM QUANTAS QUISER. O SISTEMA IDENTIFICA AUTOMATICAMENTE.
          </p>
        </div>
      </div>

      <button 
        onClick={processarLote}
        className="w-full bg-amber-600 text-slate-900 py-4 rounded-lg font-black text-xs tracking-widest uppercase shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 border border-amber-500/50"
      >
        <Copy size={18} /> IMPORTAR CARTELAS
      </button>

      <div className="pt-6 border-t border-slate-700/50">
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Assistente para Múltiplas Cartelas</h4>
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-700 flex flex-col gap-3">
          <p className="text-[10px] text-slate-400 italic">
            Use este prompt atualizado para extrair várias cartelas de uma vez só:
          </p>
          <button 
            onClick={() => {
              const prompt = `Atue como um extrator de dados de bingo de alta precisão. Analise a imagem e extraia TODAS as cartelas de bingo visíveis. 

Retorne estritamente uma LISTA (ARRAY) de objetos JSON no formato abaixo:

[
  {
    "nome": "Identificação ou Número da Cartela",
    "numeros": [
      [L1_C1, L1_C2, L1_C3, L1_C4, L1_C5],
      [L2_C1, L2_C2, L2_C3, L2_C4, L2_C5],
      [L3_C1, L3_C2, 0, L3_C4, L3_C5],
      [L4_C1, L4_C2, L4_C3, L4_C4, L4_C5],
      [L5_C1, L5_C2, L5_C3, L5_C4, L5_C5]
    ]
  },
  ... (mais cartelas se houver)
]

REGRAS:
1. O centro (FREE) deve ser o número 0.
2. Certifique-se de que cada "numeros" seja uma matriz 5x5.
3. Se houver nomes/séries nas cartelas, use no campo "nome".
4. Retorne APENAS o código JSON, sem textos adicionais.`;
              navigator.clipboard.writeText(prompt);
              alert('Prompt para Múltiplas Cartelas copiado!');
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
