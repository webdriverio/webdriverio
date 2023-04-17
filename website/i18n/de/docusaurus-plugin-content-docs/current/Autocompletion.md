---
id: autocompletion
title: Autovervollständigung
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## IntelliJ

Die automatische Vervollständigung funktioniert in IDEA und WebStorm out-of-the-box.

Wenn Sie schon eine Weile Programmcode schreiben, mögen Sie wahrscheinlich die Autovervollständigung. Die automatische Vervollständigung ist in vielen Code-Editoren standardmäßig verfügbar.

![Autovervollständigung](/img/autocompletion/0.png)

Typdefinitionen basierend auf [JSDoc](http://usejsdoc.org/) wird zum Dokumentieren von Code verwendet. Es hilft, weitere Details zu Parametern und ihren Typen anzuzeigen.

![Autovervollständigung](/img/autocompletion/1.png)

Verwenden Sie die Standard-Shortcuts <kbd>⇧ + ⌥ + SPACE</kbd> auf der IntelliJ-Plattform, um die verfügbare Dokumentation anzuzeigen:

![Autovervollständigung](/img/autocompletion/2.png)

## Visual Studio-Code (VSCode)

In Visual Studio Code ist normalerweise Typunterstützung automatisch integriert, und es ist keine besonder Einstellung erforderlich.

![Autovervollständigung](/img/autocompletion/14.png)

Wenn Sie Vanilla-JavaScript verwenden und die richtige Typunterstützung haben möchten, müssen Sie eine `jsconfig.json` in Ihrem Projekt erstellen und auf verwendete WDIO-Pakete verweisen, z.B.:

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
