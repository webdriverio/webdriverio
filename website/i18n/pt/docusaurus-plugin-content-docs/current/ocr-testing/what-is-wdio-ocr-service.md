---
id: ocr-testing
title: Teste de OCR
---

Testes automatizados em aplicativos nativos para dispositivos móveis e sites para desktop podem ser particularmente desafiadores ao lidar com elementos que não possuem identificadores exclusivos. Os [seletores WebdriverIO](https://webdriver.io/docs/selectors) padrão nem sempre podem ajudar você. Entre no mundo do `@wdio/ocr-service`, um serviço poderoso que utiliza OCR ([Reconhecimento Óptico de Caracteres](https://en.wikipedia.org/wiki/Optical_character_recognition)) para pesquisar, aguardar e interagir com elementos na tela com base em seu **texto visível**.

Os seguintes comandos personalizados serão fornecidos e adicionados ao objeto `browser/driver` para que você tenha o conjunto de ferramentas certo para fazer seu trabalho.

- [`await browser.ocrGetText`](./ocr-get-text.md)
- [`await browser.ocrGetElementPositionByText`](./ocr-get-element-position-by-text.md)
- [`await browser.ocrWaitForTextDisplayed`](./ocr-wait-for-text-displayed.md)
- [`await browser.ocrClickOnText`](./ocr-click-on-text.md)
- [`await browser.ocrSetValue`](./ocr-set-value.md)

### Como funciona

Este serviço irá

1. crie uma captura de tela da sua tela/dispositivo. (Se necessário, você pode fornecer um "haystack", que pode ser um elemento ou um objeto retangular, para localizar uma área específica. Veja a documentação de cada comando.)
2. otimize o resultado para OCR transformando a captura de tela em preto e branco com uma captura de tela de alto contraste (o alto contraste é necessário para evitar muito ruído de fundo na imagem). Isso pode ser personalizado por comando.)
3. usa [Reconhecimento Óptico de Caracteres](https://en.wikipedia.org/wiki/Optical_character_recognition) de [Tesseract.js](https://github.com/naptha/tesseract.js)/[Tesseract](https://github.com/tesseract-ocr/tesseract) para obter todo o texto da tela e destacar todo o texto encontrado em uma imagem. Ele pode suportar vários idiomas que podem ser encontrados [aqui.](https://tesseract-ocr.github.io/tessdoc/Data-Files-in-different-versions.html)
4. usa a lógica fuzzy do [Fuse.js](https://fusejs.io/) para encontrar strings que são _aproximadamente iguais_ a um determinado padrão (em vez de exatamente). Isso significa, por exemplo, que o valor de pesquisa `Nome de usuário` também pode encontrar o texto `Nome de usuário` ou vice-versa.
5. Forneça um assistente cli (`npx ocr-service`) para validar suas imagens e recuperar texto através do seu terminal

Um exemplo das etapas 1, 2 e 3 pode ser encontrado nesta imagem

![Etapas do processo](/img/ocr/processing-steps.jpg)

Ele funciona com **ZERO** dependências do sistema (além do que o WebdriverIO usa), mas, se necessário, também pode funcionar com uma instalação local do [Tesseract](https://tesseract-ocr.github.io/tessdoc/), o que reduzirá drasticamente o tempo de execução! (Veja também [Otimização de execução de testes](#test-execution-optimization) sobre como acelerar seus testes.)

Entusiasmado? Comece a usá-lo hoje mesmo seguindo o guia [Introdução](./getting-started).

:::caution Importante

Veja também [esta página](https://tesseract-ocr.github.io/tessdoc/ImproveQuality) para mais informações do Tesseract.

Não se esqueça também de ler o [FAQ](./ocr-faq).
:::
