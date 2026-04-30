import React, { useState } from 'react';
import { Hash, History, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  onSortear: (num: number) => void;
  onRemover: (num: number) => void;
  historico: number[];
}

export function SorteioPanel({ onSortear, historico, onRemover }: Props) {
  const [valor, setValor] = useState('');
  const [showHistorico, setShowHistorico] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseInt(valor);
    if (!isNaN(n) && n > 0 && n <= 99) {
      onSortear(n);
      setValor('');
    }
  };

  const ultimoSorteado = historico[historico.length - 1];

  return (
    <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-xl space-y-4">
      <div>
        <label className="text-[11px] uppercase font-bold text-slate-400 mb-2 block tracking-widest text-center">Número Sorteado</label>
        <form onSubmit={handleSubmit} className="relative">
          <input 
            type="number" 
            inputMode="numeric"
            value={valor}
            onChange={(e) => setValor(e.target.value.slice(0, 2))}
            className="w-full bg-slate-950 border-2 border-amber-500/50 rounded-lg py-4 text-center text-4xl font-black text-amber-500 focus:outline-none focus:border-amber-400 shadow-inner tabular-nums"
            placeholder={ultimoSorteado ? String(ultimoSorteado).padStart(2, '0') : "00"}
          />
          <button type="submit" className="hidden">SORTEAR</button>
        </form>
        <div className="mt-4 grid grid-cols-2 gap-2 text-center text-[10px] font-bold text-slate-500">
          <div className="p-1 bg-slate-700/50 rounded uppercase">Total: {historico.length}</div>
          <button 
            onClick={() => setShowHistorico(!showHistorico)}
            className="p-1 bg-slate-700/50 hover:bg-slate-700 rounded uppercase flex items-center justify-center gap-1"
          >
            <History size={10} /> Histórico
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showHistorico && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4 border-t border-slate-700">
              <h3 className="text-[11px] uppercase font-bold text-slate-400 mb-2 px-1">Sequência Recente</h3>
              <div className="grid grid-cols-5 gap-1.5 overflow-y-auto max-h-32 pr-1">
                {historico.slice().reverse().map((num, i) => (
                  <motion.button
                    key={`${num}-${i}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    onClick={() => onRemover(num)}
                    className={`w-full aspect-square flex items-center justify-center rounded font-bold text-xs relative group ${i === 0 ? 'bg-amber-500 text-slate-900 shadow' : 'bg-slate-700 text-slate-300'}`}
                  >
                    {num}
                    <X size={10} className="absolute -top-1 -right-1 hidden group-hover:block bg-red-500 rounded-full text-white" />
                  </motion.button>
                ))}
                {historico.length === 0 && <span className="col-span-full text-[10px] opacity-30 italic p-2">Nenhum dado</span>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
