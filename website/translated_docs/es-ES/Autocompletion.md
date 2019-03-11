---
id: autocompletar
title: Autocompletar
---
If you have been writing program code for a while, you probably like autocompletion. La función de autocompletar está disponible fuera de la caja en muchos editores de código. Sin embargo, si se requiere autocompletación para paquetes que no estén instalados en las ubicaciones habituales o que estén excluidos de la indexación por alguna razón, también se podrían añadir mediante cambios a la configuración.

![Autocompletion](/img/autocompletion/0.png)

[JSDoc](http://usejsdoc.org/) se utiliza para documentar el código. Ayuda a ver más detalles sobre los parámetros y sus tipos.

![Autocompletion](/img/autocompletion/1.png)

Utiliza accesos directos estándar *→ + → + SPACE* en IntelliJ Platform para ver la documentación disponible:

![Autocompletion](/img/autocompletion/2.png)

So, let's start to consider an example of adding autocompletion to code editors on the IntelliJ Platform like WebStorm.

### Node.js Core modules as External library

Open *Settings -> Preferences -> Languages & Frameworks -> JavaScript -> Libraries*

![Autocompletion](/img/autocompletion/3.png)

Add new library

![Autocompletion](/img/autocompletion/4.png)

Add directory with WebdriverIO commands

![Autocompletion](/img/autocompletion/5.png) ![Autocompletion](/img/autocompletion/6.png) ![Autocompletion](/img/autocompletion/7.png)

Enter documentation URL

![Autocompletion](/img/autocompletion/8.png) ![Autocompletion](/img/autocompletion/9.png) ![Autocompletion](/img/autocompletion/10.png)

### Using TypeScript community stubs (TypeScript definition files)

WebStorm provides one more workaround for adding coding assistance. It allows you to download [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) stubs.

![Autocompletion](/img/autocompletion/11.png) ![Autocompletion](/img/autocompletion/12.png)