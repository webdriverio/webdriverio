---
id: autocompletion
title: Auto-complétion
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## IntelliJ

L'autocomplétion fonctionne sans problème dans IDEA et WebStorm.

Si vous écrivez du code du programme depuis un certain temps, vous aimez probablement l'auto-complétion. L'auto-complétion est disponible gratuitement dans de nombreux éditeurs de code.

![Auto-complétion](/img/autocompletion/0.png)

Les définitions de types basées sur [JSDoc](http://usejsdoc.org/) sont utilisées pour documenter du code. Il aide à voir plus de détails sur les paramètres et leurs types.

![Auto-complétion](/img/autocompletion/1.png)

Utilisez les raccourcis standards <kbd><unk> + <unk> + SPACE</kbd> sur la plate-forme IntelliJ pour voir la documentation disponible :

![Auto-complétion](/img/autocompletion/2.png)

## Code Visual Studio (VSCode)

Visual Studio Code a généralement la prise en charge automatique des types et il n'y a aucune action nécessaire.

![Auto-complétion](/img/autocompletion/14.png)

Si vous utilisez JavaScript vanilla et que vous voulez avoir un support de type approprié, vous devez créer un jsconfig `. son` à la racine de votre projet et reportez-vous aux paquets wdio utilisés, par exemple:

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
