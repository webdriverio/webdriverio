---
id: faq
title: FAQ
---

### Preciso usar um método `save(Screen/Element/FullPageScreen)` quando quero executar `check(Screen/Element/FullPageScreen)`?

Não, você não precisa fazer isso. O `check(Screen/Element/FullPageScreen)` fará isso automaticamente para você.

### Meus testes visuais falham com uma diferença. Como posso atualizar minha linha de base?

Você pode atualizar as imagens de base por meio da linha de comando adicionando o argumento `--update-visual-baseline`. Isto irá

- copie automaticamente a captura de tela real e coloque-a na pasta de base
- se houver diferenças, o teste será aprovado porque a linha de base foi atualizada

**Uso:**

```sh
npm run test.local.desktop  --update-visual-baseline
```

Ao executar o modo de informações/depuração de logs, você verá os seguintes logs adicionados

```logs
[0-0] ..............
[0-0] #####################################################################################
[0-0]  INFO:
[0-0]  Updated the actual image to
[0-0]  /Users/wswebcreation/Git/wdio/visual-testing/localBaseline/chromel/demo-chrome-1366x768.png
[0-0] #####################################################################################
[0-0] ..........
```

### Largura e altura não podem ser negativas

Pode ser que o erro `Largura e altura não podem ser negativas` seja gerado. 9 em cada 10 vezes isso está relacionado à criação de uma imagem de um elemento que não está na visualização. Certifique-se sempre de que o elemento esteja na visualização antes de tentar criar uma imagem do elemento.

### A instalação do Canvas no Windows falhou com logs do Node-Gyp

Se você encontrar problemas com a instalação do Canvas no Windows devido a erros Node-Gyp, observe que isso se aplica apenas à versão 4 e anteriores. Para evitar esses problemas, considere atualizar para a versão 5 ou superior, que não tem essas dependências e usa [Jimp](https://github.com/jimp-dev/jimp) para processamento de imagens.

Se você ainda precisar resolver os problemas com a versão 4, verifique:

- a seção Node Canvas no guia [Introdução](/docs/visual-testing#system-requirements)
- [esta postagem](https://spin.atomicobject.com/2019/03/27/node-gyp-windows/) para corrigir problemas do Node-Gyp no Windows. (Agradecimentos a [IgorSasovets](https://github.com/IgorSasovets))
