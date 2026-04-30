import confetti from 'canvas-confetti';

export function dispararVitoria(tipo: 'QUADRA' | 'QUINA' | 'BINGO', qtd: number = 1) {
  // Vibrar dispositivo
  if ('vibrate' in navigator) {
    const padrao = tipo === 'BINGO' ? [200, 100, 200, 100, 200] : [200, 100, 200];
    navigator.vibrate(padrao);
  }

  // Efeito de confete
  if (tipo === 'BINGO') {
    const duracao = 5 * 1000;
    const fim = Date.now() + duracao;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#ff0000', '#00ff00', '#0000ff']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#ff0000', '#00ff00', '#0000ff']
      });

      if (Date.now() < fim) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  } else {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }
}
