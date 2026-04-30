import { Trash2, Trophy, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Cartela, TipoVitoria } from '../types';

interface Props {
  cartela: Cartela;
  onExcluir: () => void;
  onDismissVitoria: (tipo: string) => void;
  key?: string | number;
}

export function CartelaGrid({ cartela, onExcluir, onDismissVitoria }: Props) {
  const vitoriaAtiva = (cartela.vitoria.bingo && !cartela.dismissedVitorias.includes('BINGO')) ||
                       (cartela.vitoria.quinaLinha && !cartela.dismissedVitorias.includes('QUINA_LINHA')) ||
                       (cartela.vitoria.quinaColuna && !cartela.dismissedVitorias.includes('QUINA_COLUNA')) ||
                       (cartela.vitoria.quinaDiagonal && !cartela.dismissedVitorias.includes('QUINA_DIAGONAL')) ||
                       (cartela.vitoria.quadra && !cartela.dismissedVitorias.includes('QUADRA'));

  const getTipoVitoriaEnum = (): TipoVitoria => {
    if (cartela.vitoria.bingo && !cartela.dismissedVitorias.includes('BINGO')) return 'BINGO';
    if (cartela.vitoria.quinaLinha && !cartela.dismissedVitorias.includes('QUINA_LINHA')) return 'QUINA_LINHA';
    if (cartela.vitoria.quinaColuna && !cartela.dismissedVitorias.includes('QUINA_COLUNA')) return 'QUINA_COLUNA';
    if (cartela.vitoria.quinaDiagonal && !cartela.dismissedVitorias.includes('QUINA_DIAGONAL')) return 'QUINA_DIAGONAL';
    return 'QUADRA';
  };

  const tipoVitoriaEnum = getTipoVitoriaEnum();
  const tipoVitoriaDisplay = tipoVitoriaEnum === 'BINGO' ? 'BINGO!' : 
                            tipoVitoriaEnum.includes('QUINA') ? 'QUINA!' : 'QUADRA!';
  
  const ganhouReal = cartela.vitoria.bingo || 
                    cartela.vitoria.quinaLinha || 
                    cartela.vitoria.quinaColuna || 
                    cartela.vitoria.quinaDiagonal || 
                    cartela.vitoria.quadra;

  return (
    <div className={`bg-slate-800 rounded-xl border-t-4 transition-all shadow-2xl flex flex-col gap-2 p-3 ${ganhouReal ? 'border-green-500 ring-4 ring-green-500/20' : 'border-amber-500'}`}>
      <div className="flex justify-between items-center px-1 mb-1 relative overflow-hidden">
        <div className="flex flex-col">
          <span className="text-[10px] font-black tracking-tighter opacity-50 uppercase">ID: #{cartela.id.slice(0, 4)}</span>
          <h3 className="font-bold text-xs text-slate-100 truncate max-w-[120px] uppercase tracking-wider">{cartela.nome}</h3>
        </div>
        
        {ganhouReal ? (
          <div className="flex items-center gap-1">
             {vitoriaAtiva && (
               <button 
                 onClick={() => onDismissVitoria(tipoVitoriaEnum)}
                 className="bg-slate-700 text-slate-300 p-1 rounded-full hover:bg-slate-600 transition-colors"
                 title="Fechar aviso de vitória"
               >
                 <X size={10} />
               </button>
             )}
             <span className="text-[10px] px-2 py-0.5 bg-green-500 text-slate-950 font-bold rounded uppercase">VENCEDORA</span>
          </div>
        ) : (
          <button 
            onClick={onExcluir}
            className="text-slate-500 hover:text-red-400 p-1 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-5 gap-1 aspect-square">
        {cartela.numeros.map((fila, i) => (
          fila.map((num, j) => {
            const marcado = cartela.marcados[i][j];
            return (
              <div 
                key={`${i}-${j}`}
                className={`
                  aspect-square flex items-center justify-center border text-[10px] sm:text-xs font-bold transition-all duration-300
                  ${marcado 
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-black' 
                    : 'bg-slate-950 border-slate-700 text-slate-400'}
                  ${num === null ? 'opacity-20' : ''}
                  ${i === 2 && j === 2 ? 'ring-2 ring-amber-500/50' : ''}
                `}
              >
                {i === 2 && j === 2 ? (
                  <span className="text-[8px] sm:text-[10px] font-black italic">FREE</span>
                ) : (
                  num === null ? '·' : num
                )}
              </div>
            );
          })
        ))}
      </div>
      
      <AnimatePresence>
        {vitoriaAtiva && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-green-500/10 flex items-center justify-center backdrop-blur-[1px] rounded-xl z-10"
          >
            <motion.div 
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: -12 }}
              className="bg-green-500 text-slate-900 font-black text-2xl px-4 py-2 rounded-lg shadow-xl border-2 border-white/30 relative"
            >
              {tipoVitoriaDisplay}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDismissVitoria(tipoVitoriaEnum);
                }}
                className="absolute -top-3 -right-3 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center border-2 border-green-500 shadow-lg active:scale-95 transition-transform"
              >
                <X size={16} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
