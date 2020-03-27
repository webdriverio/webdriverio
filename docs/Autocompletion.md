---
id: autocompletion
title: Autocompletion
---

If you have been writing program code for a while, you probably like autocompletion. Autocomplete is available out of the box in many code editors.

![Autocompletion](/img/autocompletion/0.png)

Type definitions based on [JSDoc](http://usejsdoc.org/) is used for documenting code. It helps to see more additional details about parameters and their types.

![Autocompletion](/img/autocompletion/1.png)

Use standard shortcuts <kbd>⇧ + ⌥ + SPACE</kbd> on IntelliJ Platform to see available documentation:

![Autocompletion](/img/autocompletion/2.png)

### TypeScript

For TypeScript please see [TypeScript](TypeScript.md)

### Visual Studio Code (VSCode)

It's required to create `jsconfig.json` in project root and refer to used wdio packages to make autocompletion work in vanilla js. See examples below.

![Autocompletion](/img/autocompletion/14.png)

Sync version (you have `@wdio/sync` package installed) with Mocha
```json
{
  "include": [
    "**/*.js",
    "**/*.json",
    "node_modules/@wdio/sync",
    "node_modules/@wdio/mocha-framework"
  ]
}
```

Async version with Cucumber
```json
{
  "include": [
    "**/*.js",
    "**/*.json",
    "node_modules/webdriverio"
    "node_modules/@wdio/cucumber-framework"
  ]
}
```

### IntelliJ

Autocompletion works out of the box in IDEA and WebStorm.
