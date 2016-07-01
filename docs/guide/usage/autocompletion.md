name: autocompletion
category: usage
tags: guide
index: 8
title: WebdriverIO - Autocompletion
---

Autocompletion
=====================

If you have been writing program code for a while, you probably like autocompletion.
Autocomplete is available out of the box in many code editors. However if autocompletion is required for packages that are not installed in the usual locations or are excluded from indexing for some reasons, these too could be added via configuration changes.


![Autocompletion](../../../files/docs/guide/usage/autocompletion/0.png)

[JSDoc](http://usejsdoc.org/) is used for documenting code. It helps to see more additional details about parameters and their types.

![Autocompletion](../../../files/docs/guide/usage/autocompletion/1.png)

Use standard shortcuts *⇧ + ⌥ + SPACE* on IntelliJ Platform to see available documentation:

![Autocompletion](../../../files/docs/guide/usage/autocompletion/2.png)

So, let's start to consider an example of adding autocompletion to code editors on the IntelliJ Platform like WebStorm.

### Node.js Core modules as External library

Open *Settings -> Preferences -> Languages & Frameworks -> JavaScript -> Libraries*

![Autocompletion](../../../files/docs/guide/usage/autocompletion/3.png)

Add new library

![Autocompletion](../../../files/docs/guide/usage/autocompletion/4.png)

Add directory with WebdriverIO commands

![Autocompletion](../../../files/docs/guide/usage/autocompletion/5.png)
![Autocompletion](../../../files/docs/guide/usage/autocompletion/6.png)
![Autocompletion](../../../files/docs/guide/usage/autocompletion/7.png)

Enter documentation URL

![Autocompletion](../../../files/docs/guide/usage/autocompletion/8.png)
![Autocompletion](../../../files/docs/guide/usage/autocompletion/9.png)
![Autocompletion](../../../files/docs/guide/usage/autocompletion/10.png)

### Using TypeScript community stubs (TypeScript definition files)

WebStorm provides one more workaround for adding coding assistance. It allows you to download [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) stubs.

![Autocompletion](../../../files/docs/guide/usage/autocompletion/11.png)
![Autocompletion](../../../files/docs/guide/usage/autocompletion/12.png)
