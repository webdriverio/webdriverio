---
id: autocompletion
title: Autocompletion
---

## IntelliJ

Autocompletion works out of the box in IDEA and WebStorm.

If you have been writing program code for a while, you probably like autocompletion. Autocomplete is available out of the box in many code editors.

![Autocompletion](/img/autocompletion/0.png)

Type definitions based on [JSDoc](http://usejsdoc.org/) is used for documenting code. It helps to see more additional details about parameters and their types.

![Autocompletion](/img/autocompletion/1.png)

Use standard shortcuts <kbd>⇧ + ⌥ + SPACE</kbd> on IntelliJ Platform to see available documentation:

![Autocompletion](/img/autocompletion/2.png)

## Visual Studio Code (VSCode)

Visual Studio Code usually has type support automatically integrated and there is no action needed.

![Autocompletion](/img/autocompletion/14.png)

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
