import { Cartela, TipoVitoria } from '../types';

export function verificarVitoria(cartela: Cartela, regras: { 
  quadra: boolean, 
  quinaLinha: boolean, 
  quinaColuna: boolean, 
  quinaDiagonal: boolean, 
  letraX: boolean,
  moldura: boolean,
  losango: boolean,
  cruz: boolean,
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

  // 5. Letra X (Duas Diagonais)
  if (regras.letraX) {
    let d1 = true, d2 = true;
    for (let i = 0; i < 5; i++) {
      if (!marcados[i][i]) d1 = false;
      if (!marcados[i][4 - i]) d2 = false;
    }
    if (d1 && d2) vitorias.push('LETRA_X');
  }

  // 6. Moldura (Bordas)
  if (regras.moldura) {
    let molduraCheia = true;
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        if (i === 0 || i === 4 || j === 0 || j === 4) {
          if (!marcados[i][j]) molduraCheia = false;
        }
      }
    }
    if (molduraCheia) vitorias.push('MOLDURA');
  }

  // 7. Cruz (Linha 3 e Coluna 3)
  if (regras.cruz) {
    const linhaMeio = marcados[2].every(c => c);
    let colMeio = true;
    for (let i = 0; i < 5; i++) if (!marcados[i][2]) colMeio = false;
    if (linhaMeio && colMeio) vitorias.push('CRUZ');
  }

  // 8. Losango (Diamante Central)
  if (regras.losango) {
    const coords = [[0,2], [1,1], [1,3], [2,0], [2,4], [3,1], [3,3], [4,2]];
    if (coords.every(([r, c]) => marcados[r][c])) vitorias.push('LOSANGO');
  }

  // 9. Quadra (4 Cantos)
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
