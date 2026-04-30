export interface Cartela {
  id: string;
  nome: string;
  numeros: (number | null)[][]; // Grade 5x5
  marcados: boolean[][];
  vitoria: {
    quadra: boolean;
    quinaLinha: boolean;
    quinaColuna: boolean;
    quinaDiagonal: boolean;
    bingo: boolean;
  };
  dismissedVitorias: string[];
}

export type TipoVitoria = 'QUADRA' | 'QUINA_LINHA' | 'QUINA_COLUNA' | 'QUINA_DIAGONAL' | 'BINGO';

export interface JogoEstado {
  cartelas: Cartela[];
  numerosSorteados: number[];
  regras: {
    quadra: boolean;
    quinaLinha: boolean;
    quinaColuna: boolean;
    quinaDiagonal: boolean;
    bingo: boolean;
  };
  vitoriaRodada?: {
    tipo: 'QUADRA' | 'QUINA' | 'BINGO';
    qtd: number;
  } | null;
}
