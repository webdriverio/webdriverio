---
id: autocompletion
title: Auto-completar
---

## IntelliJ

O preenchimento automático é feito em IDEA e WebStorm.

Se você tem escrito o código do programa por um tempo, você provavelmente gosta de preenchimento automático. Autocompletar está disponível para fora da caixa em muitos editores de código.

![Autocompletar](/img/autocompletion/0.png)

Definições de tipo com base em [JSDoc](http://usejsdoc.org/) são usadas para documentar o código. Ele ajuda a ver mais detalhes sobre parâmetros e seus tipos.

![Autocompletar](/img/autocompletion/1.png)

Usar atalhos padrão <kbd>├+ SPACE</kbd> na Plataforma IntelliJ para ver a documentação disponível:

![Autocompletar](/img/autocompletion/2.png)

## Visual Studio Code (VSCode)

O Visual Studio Code geralmente tem suporte de tipos automaticamente integrado e não há nenhuma ação necessária.

![Autocompletar](/img/autocompletion/14.png)

Se você usa o JavaScript vanilla e quer ter suporte adequado ao tipo, você precisa criar um `jsconfig. son` na raiz do seu projeto e consulte os pacotes usados do wdio, por exemplo:

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
