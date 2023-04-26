---
id: autocompletion
title: Autocompletion
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## IntelliJ

Автодополнение работает из коробки в IDEA и WebStorm.

Если вы уже некоторое время занимаетесь написанием кода программ, то, вероятно, вам нравится автодополнение. Автодополнение доступно во многих редакторах кода по умолчанию.

![Autocompletion](/img/autocompletion/0.png)

Определения типов на основе [JSDoc](http://usejsdoc.org/) используется для документирования кода. Автодополнение помогает увидеть дополнительные детали о параметрах и их типах.

![Autocompletion](/img/autocompletion/1.png)

Используйте стандартные сочетания клавиш <kbd>⇧ + ⌥ + SPACE</kbd> в IntelliJ, чтобы просмотреть доступную документацию:

![Автозавершение](/img/autocompletion/2.png)

## Visual Studio Code (VSCode)

Visual Studio Code usually has type support automatically integrated and there is no action needed.

![Autocompletion](/img/autocompletion/14.png)

If you use vanilla JavaScript and want to have proper type support you have to create a `jsconfig.json` in your project root and refer to used wdio packages, e.g.:

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
