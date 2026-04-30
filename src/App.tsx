import React, { useState } from 'react';
import { Gift, Sliders, Trash2, Camera, Plus, RotateCcw, LayoutGrid, Trophy, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useBingo } from './hooks/useBingo';
import { CartelaGrid } from './components/CartelaGrid';
import { SorteioPanel } from './components/SorteioPanel';
import { EntradaManual } from './components/EntradaManual';
import { EntradaOCR } from './components/EntradaOCR';
import { EntradaLote } from './components/EntradaLote';
import { verificarVitoria } from './utils/bingoLogic';

export default function App() {
  const { 
    estado, 
    adicionarCartela, 
    excluirCartela, 
    sortearNumero, 
    removerNumeroSorteado, 
    resetarJogo, 
    toggleRegra,
    dismissVitoria,
    dismissVitoriaRodada
  } = useBingo();

  const [abaAtiva, setAbaAtiva] = useState<'jogo' | 'add'>('jogo');
  const [modoAdd, setModoAdd] = useState<'manual' | 'ocr' | 'lote'>('manual');
  const [showConfig, setShowConfig] = useState(false);

  // Early return if state is not available (shouldn't happen with the new useBingo)
  if (!estado || !estado.regras) {
    return (
      <div className="h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <Trophy size={48} className="text-amber-500 mb-4 animate-bounce" />
        <h1 className="text-2xl font-black text-white mb-2 uppercase">Recuperando Sessão...</h1>
        <p className="text-slate-400 text-sm max-w-xs">Aguarde enquanto preparamos sua mesa de bingo.</p>
      </div>
    );
  }

  // Bloquear fechamento acidental
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const [confirmarReset, setConfirmarReset] = useState(false);

  const handleReset = () => {
    if (confirmarReset) {
      resetarJogo();
      setConfirmarReset(false);
    } else {
      setConfirmarReset(true);
      setTimeout(() => setConfirmarReset(false), 3000);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-900 text-slate-100 font-sans">
      {/* Notificação de Vitória Global */}
      <AnimatePresence>
        {estado.vitoriaRodada && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-lg"
            onClick={() => dismissVitoriaRodada()}
          >
            <motion.div 
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.5, rotate: 10 }}
              className="bg-green-500 text-slate-950 rounded-3xl p-8 shadow-[0_0_100px_rgba(34,197,94,0.6)] border-8 border-white/20 text-center relative max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white p-4 rounded-full shadow-2xl">
                <Trophy size={48} className="text-amber-500" />
              </div>
              <h2 className="text-5xl font-black mb-4 mt-4 tracking-tighter uppercase italic leading-none">
                {estado.vitoriaRodada.tipo === 'BINGO' ? 'BINGO!' : 
                 estado.vitoriaRodada.tipo === 'QUINA' ? 'QUINA!' : 'QUADRA!'}
              </h2>
              <div className="bg-slate-950/20 py-3 rounded-xl mb-6">
                <p className="text-xl font-bold tracking-tight">
                  {estado.vitoriaRodada.qtd > 1 
                    ? `EM ${estado.vitoriaRodada.qtd} CARTELAS!` 
                    : 'VOCÊ GANHOU!'}
                </p>
              </div>
              <button 
                onClick={() => dismissVitoriaRodada()}
                className="w-full py-4 bg-slate-950 text-white rounded-2xl font-black tracking-widest text-lg uppercase shadow-xl hover:bg-slate-900 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                BOA! <LayoutGrid size={20} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Navigation */}
      <header className="flex items-center justify-between px-3 sm:px-6 py-3 bg-slate-800 border-b border-slate-700 shadow-lg shrink-0 overflow-hidden">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-500 rounded-lg flex items-center justify-center shadow-inner font-bold text-slate-900 text-lg sm:text-xl italic shrink-0">B</div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight uppercase truncate">Bingo<span className="text-amber-500">Pro</span></h1>
          <span className="hidden md:inline-block px-2 py-0.5 bg-green-500/20 text-green-400 border border-green-500/30 text-[10px] rounded uppercase font-bold tracking-wider">PWA Ativo</span>
        </div>
        
        <div className="flex items-center gap-1.5 sm:gap-3">
          <button 
            onClick={() => setShowConfig(!showConfig)}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded border border-slate-600 transition-colors shrink-0"
          >
            <Sliders size={16} />
          </button>
          <button 
            onClick={handleReset}
            className={`${confirmarReset ? 'bg-red-600' : 'bg-slate-700'} hover:opacity-80 px-2 sm:px-3 py-2 rounded text-[10px] font-bold border border-slate-600 transition-all flex items-center gap-1 sm:gap-2 shrink-0`}
          >
            <RotateCcw size={14} className={confirmarReset ? 'animate-spin' : ''} /> 
            <span className="hidden sm:inline">
              {confirmarReset ? 'CONFIRMAR' : 'RESET'}
            </span>
            <span className="sm:hidden">
              {confirmarReset ? 'OK' : 'RST'}
            </span>
          </button>
          <button 
            onClick={() => setAbaAtiva(abaAtiva === 'jogo' ? 'add' : 'jogo')}
            className="bg-amber-600 hover:bg-amber-500 px-3 sm:px-4 py-2 rounded text-xs sm:text-sm font-bold text-slate-900 transition-colors whitespace-nowrap"
          >
            {abaAtiva === 'jogo' ? (
              <span className="flex items-center gap-1"><Plus size={14} className="sm:hidden" /> <span className="hidden sm:inline">NOVA CARTELA</span><span className="sm:hidden">NOVA</span></span>
            ) : (
              <span className="flex items-center gap-1"><LayoutGrid size={14} className="sm:hidden" /> <span className="hidden sm:inline">VER JOGO</span><span className="sm:hidden">VER</span></span>
            )}
          </button>
        </div>
      </header>

      {/* Configurações Overlay */}
      <AnimatePresence>
        {showConfig && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-40 bg-slate-800 rounded-xl p-6 shadow-2xl border border-slate-700 w-80"
          >
            <h3 className="text-[11px] uppercase font-bold text-slate-400 mb-4 tracking-widest">Regras de Vitória</h3>
            <div className="space-y-2">
              {[
                { id: 'quadra', label: 'Quadra (4 Cantos)' },
                { id: 'quinaLinha', label: 'Quina (Linha)' },
                { id: 'quinaColuna', label: 'Quina (Coluna)' },
                { id: 'quinaDiagonal', label: 'Quina (Diagonal)' },
                { id: 'bingo', label: 'Bingo (Cheia)' }
              ].map(regra => (
                <label key={regra.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded border border-slate-700 cursor-pointer">
                  <span className="text-xs font-medium">{regra.label}</span>
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={estado.regras[regra.id as keyof typeof estado.regras]} 
                      onChange={() => toggleRegra(regra.id as any)}
                    />
                    <div className="w-8 h-4 bg-slate-700 rounded-full peer-checked:bg-amber-500 transition-colors"></div>
                    <div className="absolute top-0.5 left-0.5 peer-checked:left-4.5 w-3 h-3 bg-white rounded-full transition-all"></div>
                  </div>
                </label>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: Drawing Controls & Stats */}
        <aside className="w-72 bg-slate-800/50 border-r border-slate-700 p-4 flex flex-col gap-6 overflow-y-auto shrink-0 hidden md:flex">
          <SorteioPanel 
            onSortear={sortearNumero} 
            historico={estado.numerosSorteados}
            onRemover={removerNumeroSorteado}
          />
          
          <div className="bg-indigo-900/10 rounded-xl border border-indigo-500/20 p-4 relative overflow-hidden">
            <h4 className="text-[10px] uppercase font-bold text-indigo-400 mb-1">Status da Partida</h4>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="opacity-60">Cartelas Ativas</span>
                <span className="font-bold">{estado.cartelas.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="opacity-60">Números Chamados</span>
                <span className="font-bold">{estado.numerosSorteados.length}</span>
              </div>
            </div>
            <div className="h-1 w-full bg-indigo-950 rounded-full mt-3">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(estado.numerosSorteados.length / 75) * 100}%` }}></div>
            </div>
          </div>
        </aside>

        {/* Main Viewport */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="md:hidden mb-6">
            <SorteioPanel 
              onSortear={sortearNumero} 
              historico={estado.numerosSorteados}
              onRemover={removerNumeroSorteado}
            />
          </div>

          <AnimatePresence mode="wait">
            {abaAtiva === 'jogo' ? (
              <motion.div 
                key="jogo"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {estado.cartelas.length === 0 ? (
                  <div className="col-span-full text-center py-24 bg-slate-800/30 rounded-xl border-2 border-dashed border-slate-700">
                    <p className="text-slate-500 font-bold mb-6">SISTEMA AGUARDANDO DADOS</p>
                    <button 
                      onClick={() => setAbaAtiva('add')}
                      className="bg-amber-600 text-slate-900 px-8 py-3 rounded font-black tracking-widest text-xs uppercase"
                    >
                      ADICIONAR PRIMEIRA CARTELA
                    </button>
                  </div>
                ) : (
                  estado.cartelas.map(cartela => (
                    <CartelaGrid 
                      key={cartela.id} 
                      cartela={cartela} 
                      onExcluir={() => excluirCartela(cartela.id)}
                      onDismissVitoria={(tipo) => dismissVitoria(cartela.id, tipo)}
                    />
                  ))
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="add"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-2xl mx-auto space-y-6"
              >
                <div className="flex gap-1 p-1 bg-slate-800 rounded-lg border border-slate-700">
                  {[
                    { id: 'manual', label: 'MANUAL', icon: Plus },
                    { id: 'ocr', label: 'FOTO/OCR', icon: Camera },
                    { id: 'lote', label: 'LOTE/JSON', icon: LayoutGrid }
                  ].map(modo => (
                    <button 
                      key={modo.id}
                      onClick={() => setModoAdd(modo.id as any)}
                      className={`flex-1 py-2 rounded font-bold text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all ${modoAdd === modo.id ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      <modo.icon size={14} /> {modo.label}
                    </button>
                  ))}
                </div>

                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-2xl">
                  {modoAdd === 'manual' && <EntradaManual onSalvar={(n, nome) => { adicionarCartela(n, nome); setAbaAtiva('jogo'); }} />}
                  {modoAdd === 'ocr' && <EntradaOCR onSalvar={(n, nome) => { adicionarCartela(n, nome); setAbaAtiva('jogo'); }} />}
                  {modoAdd === 'lote' && <EntradaLote onSalvar={(cartelas) => { cartelas.forEach(c => adicionarCartela(c.numeros, c.nome)); setAbaAtiva('jogo'); }} />}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Footer Status Bar */}
      <footer className="bg-slate-950 px-6 py-2 border-t border-slate-800 flex justify-between items-center text-[10px] font-mono text-slate-500 shrink-0">
        <div className="flex gap-6 items-center">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_5px_green]"></span>
            DIRETRIZES PWA ATIVAS
          </div>
          <div>CARTELAS: <span className="text-slate-300">{estado.cartelas.length}</span></div>
          <div>CHAMADOS: <span className="text-slate-300">{estado.numerosSorteados.length}/75</span></div>
        </div>
        <div className="flex gap-4">
          <span className="hidden sm:inline">SESSÃO: #B-2026-PRO</span>
          <span className="text-slate-400 font-bold uppercase tracking-widest">v1.0.6-resilience</span>
        </div>
      </footer>
    </div>
  );
}
