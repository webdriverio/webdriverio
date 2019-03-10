---
id: autocompletion
title: Autovervollständigung
---
Wenn Sie bereits seit einiger Zeit als Entwickler arbeiten, mögen Sie sicherlich auch das Feature der Autovervollständigung. Diese ist oft verfügbar in den gängigen IDEs und Code Editoren. Dennoch kommt es oft vor das Pakete, die nicht in den üblichen Installationsordner installiert sind vom Indexing ignoriert werden und daher extra Konfigurationsänderungen benötigen.

![Autocompletion](/img/autocompletion/0.png)

[JSDoc](http://usejsdoc.org/) wird zur Dokumentation von Code verwendet. Es hilft, um mehr zusätzliche Details über Parameter und deren Typen einzusehen.

![Autocompletion](/img/autocompletion/1.png)

Use standard shortcuts *⇧ + ⌥ + SPACE* on IntelliJ Platform to see available documentation:

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