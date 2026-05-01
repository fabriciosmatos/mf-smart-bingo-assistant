import { useState, useEffect, useCallback } from 'react';
import { Cartela, JogoEstado } from '../types';
import { verificarVitoria } from '../utils/bingoLogic';
import { dispararVitoria } from '../services/notificacaoService';

const STORAGE_KEY = 'bingo_pro_state_v2'; // Changed key to ensure clean state if corrupted

export function useBingo() {
  const [estado, setEstado] = useState<JogoEstado>(() => {
    const initialState: JogoEstado = {
      cartelas: [],
      numerosSorteados: [],
      regras: {
        quadra: true,
        quinaLinha: true,
        quinaColuna: true,
        quinaDiagonal: true,
        letraX: false,
        moldura: false,
        losango: false,
        cruz: false,
        bingo: true,
      },
      vitoriaRodada: null
    };

    try {
      const salvo = localStorage.getItem(STORAGE_KEY);
      if (!salvo) return initialState;

      const parsed = JSON.parse(salvo);
      if (!parsed || typeof parsed !== 'object') return initialState;

      const cartelasRaw = Array.isArray(parsed.cartelas) ? parsed.cartelas : [];
      const numerosSorteados = Array.isArray(parsed.numerosSorteados) ? parsed.numerosSorteados : [];
      const regrasRaw = (parsed.regras && typeof parsed.regras === 'object') ? parsed.regras : {};
      
      const rules: JogoEstado['regras'] = {
        quadra: regrasRaw.quadra ?? true,
        quinaLinha: regrasRaw.quinaLinha ?? true,
        quinaColuna: regrasRaw.quinaColuna ?? true,
        quinaDiagonal: regrasRaw.quinaDiagonal ?? true,
        letraX: regrasRaw.letraX ?? false,
        moldura: regrasRaw.moldura ?? false,
        losango: regrasRaw.losango ?? false,
        cruz: regrasRaw.cruz ?? false,
        bingo: regrasRaw.bingo ?? true,
      };

      const cartelas: Cartela[] = cartelasRaw.map((c: any) => {
        if (!c || typeof c !== 'object') return null;
        
        const vitoriaRaw = c.vitoria || {};
        const vitoria = {
          quadra: vitoriaRaw.quadra ?? false,
          quinaLinha: vitoriaRaw.quinaLinha ?? false,
          quinaColuna: vitoriaRaw.quinaColuna ?? false,
          quinaDiagonal: vitoriaRaw.quinaDiagonal ?? false,
          letraX: vitoriaRaw.letraX ?? false,
          moldura: vitoriaRaw.moldura ?? false,
          losango: vitoriaRaw.losango ?? false,
          cruz: vitoriaRaw.cruz ?? false,
          bingo: vitoriaRaw.bingo ?? false,
        };

        return {
          id: c.id || Math.random().toString(36).substring(2),
          nome: c.nome || 'Cartela',
          numeros: Array.isArray(c.numeros) ? c.numeros : [],
          marcados: Array.isArray(c.marcados) ? c.marcados : [],
          vitoria,
          dismissedVitorias: Array.isArray(c.dismissedVitorias) ? c.dismissedVitorias : []
        };
      }).filter((c): c is Cartela => c !== null);

      return {
        cartelas,
        numerosSorteados,
        regras: rules,
        vitoriaRodada: parsed.vitoriaRodada || null
      };
    } catch (e) {
      return initialState;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
  }, [estado]);

  const adicionarCartela = useCallback((numeros: (number | null)[][], nome: string) => {
    const nova: Cartela = {
      id: Math.random().toString(36).substring(2, 11),
      nome,
      numeros,
      marcados: numeros.map((fila, i) => fila.map((_, j) => (i === 2 && j === 2) ? true : false)),
      vitoria: { 
        quadra: false, quinaLinha: false, quinaColuna: false, quinaDiagonal: false, 
        letraX: false, moldura: false, losango: false, cruz: false, bingo: false 
      },
      dismissedVitorias: []
    };
    
    estado.numerosSorteados.forEach(num => {
      nova.numeros.forEach((fila, i) => {
        fila.forEach((n, j) => {
          if (n === num) nova.marcados[i][j] = true;
        });
      });
    });

    setEstado(prev => ({ ...prev, cartelas: [...prev.cartelas, nova] }));
  }, [estado.numerosSorteados]);

  const excluirCartela = useCallback((id: string) => {
    setEstado(prev => ({ ...prev, cartelas: prev.cartelas.filter(c => c.id !== id) }));
  }, []);

  const sortearNumero = useCallback((num: number) => {
    if (estado.numerosSorteados.includes(num)) return;

    setEstado(prev => {
      const novosSorteados = [...prev.numerosSorteados, num];
      let totalBingo = 0;
      let totalQuina = 0;
      let totalQuadra = 0;
      let totalPadrao = 0;

      const novasCartelas = prev.cartelas.map(cartela => {
        const novaMarcada = cartela.marcados.map((fila, i) => 
          fila.map((marcado, j) => marcado || cartela.numeros[i][j] === num)
        );
        
        const tempCartela: Cartela = { ...cartela, marcados: novaMarcada };
        const vitorias = verificarVitoria(tempCartela, prev.regras);
        
        if (vitorias.includes('BINGO') && !cartela.vitoria.bingo) totalBingo++;
        else if ((vitorias.includes('QUINA_LINHA') || vitorias.includes('QUINA_COLUNA') || vitorias.includes('QUINA_DIAGONAL')) && 
                 (!cartela.vitoria.quinaLinha && !cartela.vitoria.quinaColuna && !cartela.vitoria.quinaDiagonal)) {
          totalQuina++;
        }
        else if ((vitorias.includes('LETRA_X') || vitorias.includes('MOLDURA') || vitorias.includes('LOSANGO') || vitorias.includes('CRUZ')) && 
                (!cartela.vitoria.letraX && !cartela.vitoria.moldura && !cartela.vitoria.losango && !cartela.vitoria.cruz)) {
          totalPadrao++;
        }
        else if (vitorias.includes('QUADRA') && !cartela.vitoria.quadra) {
          totalQuadra++;
        }

        return { 
          ...cartela, 
          marcados: novaMarcada,
          vitoria: {
            quadra: vitorias.includes('QUADRA'),
            quinaLinha: vitorias.includes('QUINA_LINHA'),
            quinaColuna: vitorias.includes('QUINA_COLUNA'),
            quinaDiagonal: vitorias.includes('QUINA_DIAGONAL'),
            letraX: vitorias.includes('LETRA_X'),
            moldura: vitorias.includes('MOLDURA'),
            losango: vitorias.includes('LOSANGO'),
            cruz: vitorias.includes('CRUZ'),
            bingo: vitorias.includes('BINGO')
          }
        };
      });

      let vitoriaRodadaResult: JogoEstado['vitoriaRodada'] = null;
      if (totalBingo > 0) {
        dispararVitoria('BINGO', totalBingo);
        vitoriaRodadaResult = { tipo: 'BINGO', qtd: totalBingo };
      } else if (totalQuina > 0) {
        dispararVitoria('QUINA', totalQuina);
        vitoriaRodadaResult = { tipo: 'QUINA', qtd: totalQuina };
      } else if (totalPadrao > 0) {
        dispararVitoria('PADRÃO', totalPadrao);
        vitoriaRodadaResult = { tipo: 'PADRÃO', qtd: totalPadrao };
      } else if (totalQuadra > 0) {
        dispararVitoria('QUADRA', totalQuadra);
        vitoriaRodadaResult = { tipo: 'QUADRA', qtd: totalQuadra };
      }

      return { ...prev, numerosSorteados: novosSorteados, cartelas: novasCartelas, vitoriaRodada: vitoriaRodadaResult };
    });
  }, [estado.numerosSorteados]);

  const removerNumeroSorteado = useCallback((num: number) => {
    setEstado(prev => ({
      ...prev,
      vitoriaRodada: null,
      numerosSorteados: prev.numerosSorteados.filter(n => n !== num),
      cartelas: prev.cartelas.map(cartela => ({
        ...cartela,
        marcados: cartela.marcados.map((fila, i) => 
          fila.map((marcado, j) => marcado && cartela.numeros[i][j] !== num)
        )
      }))
    }));
  }, []);

  const resetarJogo = useCallback(() => {
    setEstado(prev => ({
      ...prev,
      vitoriaRodada: null,
      numerosSorteados: [],
      cartelas: prev.cartelas.map(c => ({
        ...c,
        marcados: c.marcados.map((f, i) => f.map((_, j) => (i === 2 && j === 2) ? true : false)),
        vitoria: { 
          quadra: false, quinaLinha: false, quinaColuna: false, quinaDiagonal: false,
          letraX: false, moldura: false, losango: false, cruz: false, bingo: false 
        },
        dismissedVitorias: []
      }))
    }));
  }, []);

  const toggleRegra = useCallback((regra: keyof JogoEstado['regras']) => {
    setEstado(prev => ({ ...prev, regras: { ...prev.regras, [regra]: !prev.regras[regra] } }));
  }, []);

  const dismissVitoriaRodada = useCallback(() => {
    setEstado(prev => ({ 
      ...prev, 
      vitoriaRodada: null,
      cartelas: prev.cartelas.map(c => ({
        ...c,
        dismissedVitorias: [...new Set([...c.dismissedVitorias, 'QUADRA', 'QUINA_LINHA', 'QUINA_COLUNA', 'QUINA_DIAGONAL', 'LETRA_X', 'MOLDURA', 'LOSANGO', 'CRUZ', 'BINGO'])]
      }))
    }));
  }, []);

  const dismissVitoria = useCallback((cartelaId: string, tipo: string) => {
    setEstado(prev => ({
      ...prev,
      cartelas: prev.cartelas.map(c => 
        c.id === cartelaId 
          ? { ...c, dismissedVitorias: [...new Set([...c.dismissedVitorias, tipo, 'QUADRA', 'QUINA_LINHA', 'QUINA_COLUNA', 'QUINA_DIAGONAL', 'LETRA_X', 'MOLDURA', 'LOSANGO', 'CRUZ', 'BINGO'])] }
          : c
      )
    }));
  }, []);

  return {
    estado,
    adicionarCartela,
    excluirCartela,
    sortearNumero,
    removerNumeroSorteado,
    resetarJogo,
    toggleRegra,
    dismissVitoria,
    dismissVitoriaRodada
  };
}
