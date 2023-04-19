---
id: autocompletion
title: Autocompletado
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## IntelliJ

La autofinalización funciona de forma automática en IDEA y Webstorm.

Si ha estado escribiendo código de programa durante un tiempo, probablemente le vaya a gustar el autocompletado. Autocompletado está disponible en muchos editores de código.

![Autocompletado](/img/autocompletion/0.png)

Las definiciones de tipo basadas en [JSDoc](http://usejsdoc.org/) se utilizan para documentar el código. Ayuda a ver más detalles adicionales acerca de los parámetros y sus tipos.

![Autocompletado](/img/autocompletion/1.png)

Utilice los atajos estándar <kbd>+ + + + SPACE</kbd> en la Plataforma de IntelliJ para ver la documentación disponible

![Autocompletado](/img/autocompletion/2.png)

## Visual Studio Code (VSCode),

El Visual Studio Code normalmente tiene soporte de tipo integrado automáticamente y no hay acción necesaria.

![Autocompletado](/img/autocompletion/14.png)

Si usa vanilla JavaScript y quiere tener el soporte adecuado de tipos, tienes que crear un `jsconfig. hijo` en la raíz de tu proyecto y consulta los paquetes wdio usados, por ejemplo:

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
