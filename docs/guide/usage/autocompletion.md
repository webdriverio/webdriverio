name: autocompletion
category: usage
tags: guide
index: 8
title: WebdriverIO - Autocompletion
---

Autocompletion
=====================

If you have been writing program code for a while, you probably like autocompletion.
Autocomplete is available out of the box in many code editors.
However if autocompletion is required for some packages that are not installed in the usual locations, these too could be added via some configuration changes.

There'a two ways to add support for our framework:

1. Specify the location where commands are placed: `<your_package>/node_modules/webdriverio/lib/commands`.

2. Use a typed definition (*.d.ts) [file](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/webdriverio/webdriverio.d.ts).

![Autocompletion](../../../files/autocompletion.png)



For more information see the article [How WebStorm Works: Completion for JavaScript Libraries](https://blog.jetbrains.com/webstorm/2014/07/how-webstorm-works-completion-for-javascript-libraries/)
