# Guia para IAs de Visão (ChatGPT / Gemini / Claude)

Para facilitar a importação de cartelas físicas, use este prompt ao enviar uma foto da sua cartela para uma IA:

---

**Prompt:**
"Atue como um extrator de dados de bingo. Analise esta imagem de uma cartela de bingo 5x5 e extraia os números em ordem (da esquerda para direita, de cima para baixo). 

Por favor, retorne os dados estritamente no formato JSON abaixo para que eu possa colar no meu sistema:

{
  "nome": "Nome da Cartela",
  "numeros": [
    [N1, N2, N3, N4, N5],
    [N6, N7, N8, N9, N10],
    ...
  ]
}

Se houver um espaço vazio no centro, use o número 0 ou null. Apenas o JSON, sem explicações."

---

**Como usar no Bingo Pro:**
1. Copie o JSON gerado pela IA.
2. Vá em **Adicionar (+) → Lote**.
3. Cole o JSON e clique em **Importar**.
