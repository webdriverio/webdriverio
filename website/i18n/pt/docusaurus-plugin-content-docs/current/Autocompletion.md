---
id: autocompletion
title: AutoCompletar
---

## IntelliJ

AutoCompletar ou preenchimento automático vem pronto para o uso em IDEA e WebStorm.

Se você tem escrito código-fonte por um tempo, provavelmente gosta do preenchimento automático. O preenchimento automático está disponível e pronto para o uso em muitos editores de código.

![AutoCompletar](/img/autocompletion/0.png)

Definições de tipo com base em [JSDoc](http://usejsdoc.org/) são utilizadas para documentar o código. Isso ajuda a ver mais detalhes sobre os parâmetros e seus tipos.

![AutoCompletar](/img/autocompletion/1.png)

Use atalhos padrão <kbd>⇧ + ⌥ + SPACE</kbd> na Plataforma IntelliJ para ver documentação disponível:

![AutoCompletar](/img/autocompletion/2.png)

## Visual Studio Code (VScode)

O Visual Studio Code geralmente tem suporte de tipos integrado automaticamente, e não é necessária nenhuma ação.

![AutoCompletar](/img/autocompletion/14.png)

Se você usa o JavaScript vanilla e quer ter suporte adequado de tipos, você precisa criar um `jsconfig.json` na raiz do seu projeto e referenciar os pacotes usados do wdio, por exemplo:

```json title="jsconfig.json"
{
    "compilerOptions": {
        "types": [
            "node",
            "@wdio/globals/types",
            "@wdio/mocha-framework"
        ]
    }
}
```
