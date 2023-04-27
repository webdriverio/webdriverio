---
id: autocompletion
title: Автодополнение
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## IntelliJ

Автодополнение работает из коробки в IDEA и WebStorm.

Если вы уже некоторое время занимаетесь написанием кода программ, то, вероятно, вам нравится автодополнение. Автодополнение доступно во многих редакторах кода по умолчанию.

![Автодополнение](/img/autocompletion/0.png)

Определения типов на основе [JSDoc](http://usejsdoc.org/) используется для документирования кода. Автодополнение помогает увидеть дополнительные детали о параметрах и их типах.

![Автодополнение](/img/autocompletion/1.png)

Используйте стандартные сочетания клавиш <kbd>⇧ + ⌥ + SPACE</kbd> в IntelliJ, чтобы просмотреть доступную документацию:

![Автозавершение](/img/autocompletion/2.png)

## Visual Studio Code (VSCode)

Visual Studio Code обычно автоматически использует поддержку типов, и никаких действий не требуется.

![Autocompletion](/img/autocompletion/14.png)

Если вы используете ванильный JavaScript и хотите иметь правильную поддержку типов, вам необходимо создать `jsconfig.json` в корне вашего проекта и обратиться к пакетам wdio, например:

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
