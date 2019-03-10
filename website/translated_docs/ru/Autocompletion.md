---
id: autocompletion
title: Autocompletion
---
If you have been writing program code for a while, you probably like autocompletion. Autocomplete is available out of the box in many code editors. However if autocompletion is required for packages that are not installed in the usual locations or are excluded from indexing for some reasons, these too could be added via configuration changes.

![Autocompletion](/img/autocompletion/0.png)

[JSDoc](http://usejsdoc.org/) is used for documenting code. It helps to see more additional details about parameters and their types.

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