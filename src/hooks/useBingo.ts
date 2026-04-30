import { useState, useEffect, useCallback } from 'react';
import { Cartela, JogoEstado } from '../types';
import { verificarVitoria } from '../utils/bingoLogic';
import { dispararVitoria } from '../services/notificacaoService';

const STORAGE_KEY = 'bingo_pro_state_v2'; // Changed key to ensure clean state if corrupted

export function useBingo() {
  const [estado, setEstado] = useState<JogoEstado>(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEY);
      if (salvo) {
        const parsed = JSON.parse(salvo);
        
        if (parsed && typeof parsed === 'object') {
          // Garantir campos de nível superior
          const finalEstado: JogoEstado = {
            cartelas: Array.isArray(parsed.cartelas) ? parsed.cartelas : [],
            numerosSorteados: Array.isArray(parsed.numerosSorteados) ? parsed.numerosSorteados : [],
            regras: (parsed.regras && typeof parsed.regras === 'object') ? parsed.regras : {
              quadra: true,
              quinaLinha: true,
              quinaColuna: true,
              quinaDiagonal: true,
              bingo: true,
            },
            vitoriaRodada: parsed.vitoriaRodada !== undefined ? parsed.vitoriaRodada : null
          };

          // Migração de Regras
          if (finalEstado.regras && !('quinaLinha' in finalEstado.regras)) {
            const oldQuina = (finalEstado.regras as any).quina || false;
            finalEstado.regras = {
              ...(finalEstado.regras as any),
              quinaLinha: oldQuina,
              quinaColuna: oldQuina,
              quinaDiagonal: oldQuina,
              quadra: finalEstado.regras.quadra !== undefined ? finalEstado.regras.quadra : true,
              bingo: finalEstado.regras.bingo !== undefined ? finalEstado.regras.bingo : true
            };
            delete (finalEstado.regras as any).quina;
          }

          // Migração de Cartelas
          finalEstado.cartelas = finalEstado.cartelas.map((c: any) => {
            if (!c || typeof c !== 'object') return null;
            const updated = {
              ...c,
              dismissedVitorias: Array.isArray(c.dismissedVitorias) ? c.dismissedVitorias : []
            };
            
            if (updated.vitoria && !('quinaLinha' in updated.vitoria)) {
              const oldQuina = (updated.vitoria as any).quina || false;
              updated.vitoria = {
                ...updated.vitoria,
                quinaLinha: oldQuina,
                quinaColuna: oldQuina,
                quinaDiagonal: oldQuina,
                quadra: updated.vitoria.quadra || false,
                bingo: updated.vitoria.bingo || false
              };
              delete (updated.vitoria as any).quina;
            }
            return updated;
          }).filter((c): c is Cartela => c !== null);

          return finalEstado;
        }
      }
    } catch (e) {
      console.error('Erro ao carregar estado salvo:', e);
    }
    
    return {
      cartelas: [],
      numerosSorteados: [],
      regras: {
        quadra: true,
        quinaLinha: true,
        quinaColuna: true,
        quinaDiagonal: true,
        bingo: true,
      },
      vitoriaRodada: null
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
  }, [estado]);

  const adicionarCartela = useCallback((numeros: (number | null)[][], nome: string) => {
    const nova: Cartela = {
      id: Math.random().toString(36).substring(2, 11) + Date.now().toString(36),
      nome,
      numeros,
      marcados: numeros.map((fila, i) => fila.map((_, j) => (i === 2 && j === 2) ? true : false)),
      vitoria: { quadra: false, quinaLinha: false, quinaColuna: false, quinaDiagonal: false, bingo: false },
      dismissedVitorias: []
    };
    
    // Marcar automaticamente se algum número já foi sorteado
    estado.numerosSorteados.forEach(num => {
      nova.numeros.forEach((fila, i) => {
        fila.forEach((n, j) => {
          if (n === num) nova.marcados[i][j] = true;
        });
      });
    });

    setEstado(prev => ({
      ...prev,
      cartelas: [...prev.cartelas, nova]
    }));
  }, [estado.numerosSorteados]);

  const excluirCartela = useCallback((id: string) => {
    setEstado(prev => ({
      ...prev,
      cartelas: prev.cartelas.filter(c => c.id !== id)
    }));
  }, []);

  const sortearNumero = useCallback((num: number) => {
    if (estado.numerosSorteados.includes(num)) return;

    setEstado(prev => {
      const novosSorteados = [...prev.numerosSorteados, num];
      
      let totalBingo = 0;
      let totalQuina = 0;
      let totalQuadra = 0;

      const novasCartelas = prev.cartelas.map(cartela => {
        const novaMarcada = cartela.marcados.map((fila, i) => 
          fila.map((marcado, j) => marcado || cartela.numeros[i][j] === num)
        );
        
        const tempCartela: Cartela = { ...cartela, marcados: novaMarcada };
        const vitorias = verificarVitoria(tempCartela, prev.regras);
        
        // Contabilizar novas vitórias para notificação agregada
        if (vitorias.includes('BINGO') && !cartela.vitoria.bingo) totalBingo++;
        else if ((vitorias.includes('QUINA_LINHA') || vitorias.includes('QUINA_COLUNA') || vitorias.includes('QUINA_DIAGONAL')) && 
                 (!cartela.vitoria.quinaLinha && !cartela.vitoria.quinaColuna && !cartela.vitoria.quinaDiagonal)) {
          totalQuina++;
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
            bingo: vitorias.includes('BINGO')
          }
        };
      });

      // Disparar notificação única para o tipo de vitória mais importante da rodada
      let vitoriaRodadaResult: JogoEstado['vitoriaRodada'] = null;
      if (totalBingo > 0) {
        dispararVitoria('BINGO', totalBingo);
        vitoriaRodadaResult = { tipo: 'BINGO', qtd: totalBingo };
      }
      else if (totalQuina > 0) {
        dispararVitoria('QUINA', totalQuina);
        vitoriaRodadaResult = { tipo: 'QUINA', qtd: totalQuina };
      }
      else if (totalQuadra > 0) {
        dispararVitoria('QUADRA', totalQuadra);
        vitoriaRodadaResult = { tipo: 'QUADRA', qtd: totalQuadra };
      }

      return {
        ...prev,
        numerosSorteados: novosSorteados,
        cartelas: novasCartelas,
        vitoriaRodada: vitoriaRodadaResult
      };
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
        vitoria: { quadra: false, quinaLinha: false, quinaColuna: false, quinaDiagonal: false, bingo: false },
        dismissedVitorias: []
      }))
    }));
  }, []);

  const toggleRegra = useCallback((regra: keyof JogoEstado['regras']) => {
    setEstado(prev => ({
      ...prev,
      regras: { ...prev.regras, [regra]: !prev.regras[regra] }
    }));
  }, []);

  const dismissVitoriaRodada = useCallback(() => {
    setEstado(prev => ({ 
      ...prev, 
      vitoriaRodada: null,
      cartelas: prev.cartelas.map(c => ({
        ...c,
        dismissedVitorias: [...new Set([...c.dismissedVitorias, 'QUADRA', 'QUINA_LINHA', 'QUINA_COLUNA', 'QUINA_DIAGONAL', 'BINGO'])]
      }))
    }));
  }, []);

  const dismissVitoria = useCallback((cartelaId: string, tipo: string) => {
    setEstado(prev => ({
      ...prev,
      cartelas: prev.cartelas.map(c => 
        c.id === cartelaId 
          ? { ...c, dismissedVitorias: [...new Set([...c.dismissedVitorias, tipo, 'QUADRA', 'QUINA_LINHA', 'QUINA_COLUNA', 'QUINA_DIAGONAL', 'BINGO'])] }
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
