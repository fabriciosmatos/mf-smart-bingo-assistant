import { Cartela, TipoVitoria } from '../types';

export function verificarVitoria(cartela: Cartela, regras: { 
  quadra: boolean, 
  quinaLinha: boolean, 
  quinaColuna: boolean, 
  quinaDiagonal: boolean, 
  bingo: boolean 
}): TipoVitoria[] {
  const marcados = cartela.marcados;
  const vitorias: TipoVitoria[] = [];

  // 1. Bingo (Cartela Cheia)
  if (regras.bingo) {
    const cheia = marcados.every(fila => fila.every(celula => celula));
    if (cheia) vitorias.push('BINGO');
  }

  // 2. Quina Linha
  if (regras.quinaLinha) {
    for (let i = 0; i < 5; i++) {
      if (marcados[i].every(c => c)) {
        vitorias.push('QUINA_LINHA');
        break;
      }
    }
  }

  // 3. Quina Coluna
  if (regras.quinaColuna) {
    for (let j = 0; j < 5; j++) {
      let colunaCheia = true;
      for (let i = 0; i < 5; i++) {
        if (!marcados[i][j]) {
          colunaCheia = false;
          break;
        }
      }
      if (colunaCheia) {
        vitorias.push('QUINA_COLUNA');
        break;
      }
    }
  }

  // 4. Quina Diagonal
  if (regras.quinaDiagonal) {
    let d1 = true, d2 = true;
    for (let i = 0; i < 5; i++) {
      if (!marcados[i][i]) d1 = false;
      if (!marcados[i][4 - i]) d2 = false;
    }
    if (d1 || d2) vitorias.push('QUINA_DIAGONAL');
  }

  // 5. Quadra (4 Cantos)
  if (regras.quadra && !vitorias.includes('BINGO')) {
    const cantos = [
      marcados[0][0],
      marcados[0][4],
      marcados[4][0],
      marcados[4][4]
    ];
    if (cantos.every(c => c)) vitorias.push('QUADRA');
  }

  return vitorias;
}
