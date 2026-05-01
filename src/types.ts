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
    letraX: boolean;
    moldura: boolean;
    losango: boolean;
    cruz: boolean;
    bingo: boolean;
  };
  dismissedVitorias: string[];
}

export type TipoVitoria = 
  | 'QUADRA' 
  | 'QUINA_LINHA' 
  | 'QUINA_COLUNA' 
  | 'QUINA_DIAGONAL' 
  | 'LETRA_X'
  | 'MOLDURA'
  | 'LOSANGO'
  | 'CRUZ'
  | 'BINGO';

export interface JogoEstado {
  cartelas: Cartela[];
  numerosSorteados: number[];
  regras: {
    quadra: boolean;
    quinaLinha: boolean;
    quinaColuna: boolean;
    quinaDiagonal: boolean;
    letraX: boolean;
    moldura: boolean;
    losango: boolean;
    cruz: boolean;
    bingo: boolean;
  };
  vitoriaRodada?: {
    tipo: 'QUADRA' | 'QUINA' | 'BINGO' | 'PADRÃO';
    qtd: number;
  } | null;
}
