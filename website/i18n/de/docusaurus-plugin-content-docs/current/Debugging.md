---
id: debugging
title: Debuggen
---

Das Debuggen ist erheblich schwieriger, wenn mehrere Prozesse Dutzende von Tests in mehreren Browsern ausführen.

<iframe width="560" height="315" src="https://www.youtube.com/embed/_bw_VWn5IzU" frameborder="0" allowFullScreen></iframe>

Zu Beginn sollten wir erst einmal die Parallelität einzuschränken, indem Sie `maxInstances` auf `1`setzen und nur auf die Tests und Browser abzielen, die debuggt werden müssen.

In `wdio.conf.js`:

```js
export const config = {
    // ...
    maxInstances: 1,
    specs: [
        '**/myspec.spec.js'
    ],
    capabilities: [{
        browserName: 'firefox'
    }],
    // ...
}
```

## Der Debug-Befehl

In vielen Fällen können Sie [`browser.debug()`](/docs/api/browser/debug) verwenden, um Ihren Test anzuhalten und den Browser zu untersuchen.

Ihre Befehlszeilenschnittstelle wechselt ebenfalls in den REPL-Modus. In diesem Modus können Sie mit Befehlen und Elementen auf der Seite herumspielen. Im REPL-Modus können Sie wie in Ihren Tests auf das `browser` Objekt, oder `$` und `$$` Funktionen zugreifen.

Wenn Sie `browser.debug()`verwenden, müssen Sie das Timeout des Test-Runners erhöhen, um zu verhindern, dass der Test-Runner den Test nicht abbricht, weil er zu lange dauert.  Zum Beispiel:

In `wdio.conf`:

```js
jasmineOpts: {
    defaultTimeoutInterval: (24 * 60 * 60 * 1000)
}
```

Siehe [timeouts](timeouts) für weitere Informationen darüber, wie man das mit anderen Frameworks macht.

Um nach dem Debuggen mit den Tests fortzufahren, verwenden Sie in der Shell die Tastenkombination `^C` oder den Befehl `.exit`.
## Dynamische Konfiguration

Beachten Sie, dass `wdio.conf.js` JavaScript enthalten kann. Da Sie Ihren Timeout-Wert wahrscheinlich nicht dauerhaft auf einen großen Betrag ändern möchten, kann es oft hilfreich sein, diese Einstellungen über eine Umgebungsvariable von der Befehlszeile aus zu ändern.

Mit dieser Technik können Sie die Konfiguration dynamisch ändern:

```js
const debug = process.env.DEBUG
const defaultCapabilities = ...
const defaultTimeoutInterval = ...
const defaultSpecs = ...

export const config = {
    // ...
    maxInstances: debug ? 1 : 100,
    capabilities: debug ? [{ browserName: 'chrome' }] : defaultCapabilities,
    execArgv: debug ? ['--inspect'] : [],
    jasmineOpts: {
      defaultTimeoutInterval: debug ? (24 * 60 * 60 * 1000) : defaultTimeoutInterval
    }
    // ...
}
```

Sie können dann dem Befehl `wdio` die Umgebungsvariable `debug` voranstellen:

```
$ DEBUG=true npx wdio wdio.conf.js --spec ./tests/e2e/myspec.test.js
```

... und dann Ihre Test-Datei mit den DevTools Fenster debuggen!

## Debuggen mit Visual Studio Code (VSCode)

If you want to debug your tests with breakpoints in latest VSCode, you have two options for starting the debugger of which option 1 is the easiest method:
 1. automatically attaching the debugger
 2. attaching the debugger using a configuration file

### VSCode Toggle Auto Attach

You can automatically attach the debugger by following these steps in VSCode:
 - Press CMD + Shift + P (Linux and Macos) or CTRL + Shift + P (Windows)
 - Type "attach" into the input field
 - Select "Debug: Toggle Auto Attach"
 - Select "Only With Flag"

 That's it! Now when you run your tests (remember you will need the --inspect flag set in your config as shown earlier) it will automatically start the debugger and stop on the first breakpoint that it reaches.

### VSCode Configuration file

Es ist möglich, alle oder ausgewählte Test-Dateien auszuführen. Debug-Konfiguration(en) müssen zu `.vscode/launch.json`hinzugefügt werden, um die ausgewählten Tests zu debuggen, fügen Sie die folgende Konfiguration hinzu:
```
{
    "name": "run select spec",
    "type": "node",
    "request": "launch",
    "args": ["wdio.conf.js", "--spec", "${file}"],
    "cwd": "${workspaceFolder}",
    "autoAttachChildProcesses": true,
    "program": "${workspaceRoot}/node_modules/@wdio/cli/bin/wdio.js",
    "console": "integratedTerminal",
    "skipFiles": [
        "${workspaceFolder}/node_modules/**/*.js",
        "${workspaceFolder}/lib/**/*.js",
        "<node_internals>/**/*.js"
    ]
},
```

Um alle Test-Dateien auszuführen, entfernen Sie `"--spec", "${file}"` von `"args"`

Hier ist eine Beispiel: [.vscode/launch.json](https://github.com/mgrybyk/webdriverio-devtools/blob/master/.vscode/launch.json) Datei.

Zusätzliche Informationen: https://code.visualstudio.com/docs/nodejs/nodejs-debugging

## Dynamische Repl mit Atom

Wenn Sie ein [Atom](https://atom.io/) Nutzer sind, können Sie [`wdio-repl`](https://github.com/kurtharriger/wdio-repl) von [@kurtharriger](https://github.com/kurtharriger) ausprobieren, die eine dynamische Repl, mit der Sie einzelne Codezeilen in Atom ausführen können. Sehen Sie sich [dieses](https://www.youtube.com/watch?v=kdM05ChhLQE) YouTube-Video an, um eine Demo zu sehen.

## Debuggen mit WebStorm / Intellij
Sie können WebStorm und IntelliJ wie folgt konfigurieren, um Debugging zu verinfachen: ![Screenshot from 2021-05-29 17-33-33](https://user-images.githubusercontent.com/18728354/120088460-81844c00-c0a5-11eb-916b-50f21c8472a8.png) Schauen Sie sich dieses [YouTube Video](https://www.youtube.com/watch?v=Qcqnmle6Wu8) an, um mehr Informationen zu bekommen.
