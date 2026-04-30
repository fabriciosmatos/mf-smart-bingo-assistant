import React, { useState } from 'react';
import { Save, User } from 'lucide-react';

interface Props {
  onSalvar: (numeros: (number | null)[][], nome: string) => void;
}

export function EntradaManual({ onSalvar }: Props) {
  const [nome, setNome] = useState('');
  const [grade, setGrade] = useState<(string)[][]>(Array(5).fill(null).map(() => Array(5).fill('')));

  const handleMudar = (i: number, j: number, valor: string) => {
    const novaVal = valor.slice(0, 2);
    const novaGrade = [...grade];
    novaGrade[i] = [...novaGrade[i]];
    novaGrade[i][j] = novaVal;
    setGrade(novaGrade);
    
    // Auto focus next field
    if (novaVal.length === 2 || (parseInt(novaVal) > 9)) {
       let nextJ = (j + 1) % 5;
       let nextI = nextJ === 0 ? i + 1 : i;
       
       // Skip center if it's the next cell
       if (nextI === 2 && nextJ === 2) {
         nextJ = (nextJ + 1) % 5;
         nextI = nextJ === 0 ? nextI + 1 : nextI;
       }

       if (nextI < 5) {
         const nextId = `cell-${nextI}-${nextJ}`;
         document.getElementById(nextId)?.focus();
       }
    }
  };

  const handleSalvar = () => {
    const final: (number | null)[][] = grade.map(fila => fila.map(v => v === '' ? null : parseInt(v)));
    onSalvar(final, nome || 'Cartela ' + Math.floor(Math.random() * 1000));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <label className="text-[10px] uppercase font-bold text-slate-400 px-1 tracking-widest">Identificação da Cartela</label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input 
            type="text" 
            placeholder="NOME / COR / ID"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 pl-12 pr-4 font-bold text-sm focus:outline-none focus:border-amber-500 transition-all placeholder:text-slate-700 uppercase"
          />
        </div>

        <label className="text-[10px] uppercase font-bold text-slate-400 px-1 tracking-widest pt-2 block">Grade Numérica</label>
        <div className="grid grid-cols-5 gap-1.5">
          {grade.map((fila, i) => (
            fila.map((valor, j) => {
              const isCenter = i === 2 && j === 2;
              return (
                <div key={`${i}-${j}`} className="relative aspect-square">
                  <input 
                    id={`cell-${i}-${j}`}
                    type="number"
                    inputMode="numeric"
                    value={isCenter ? '' : valor}
                    disabled={isCenter}
                    onChange={(e) => handleMudar(i, j, e.target.value)}
                    className={`w-full h-full bg-slate-950 border border-slate-700 rounded-md text-center font-black text-xs sm:text-sm focus:bg-amber-500 focus:text-slate-950 focus:border-amber-400 focus:outline-none transition-all tabular-nums ${isCenter ? 'opacity-50 !bg-slate-800' : ''}`}
                  />
                  {isCenter && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-[8px] font-black italic text-amber-500">FREE</span>
                    </div>
                  )}
                </div>
              );
            })
          ))}
        </div>
      </div>

      <button 
        onClick={handleSalvar}
        className="w-full bg-amber-600 text-slate-900 py-4 rounded-lg font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 border border-amber-500/50"
      >
        <Save size={18} /> CONFIRMAR REGISTRO
      </button>
    </div>
  );
}
