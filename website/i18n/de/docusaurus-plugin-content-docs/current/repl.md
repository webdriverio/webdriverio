---
id: repl
title: Repl Schnittstelle
---

Mit `v4.5.0`führte WebdriverIO eine [REPL](https://en.wikipedia.org/wiki/Read%E2%80%93eval%E2%80%93print_loop) -Schnittstelle ein, die Ihnen hilft, nicht nur die Framework-API zu lernen, sondern auch Ihre Tests zu debuggen und zu überprüfen. Es kann auf vielfältige Weise verwendet werden.

Zuerst können Sie es als CLI-Befehl verwenden, indem Sie `npm install -g @wdio/cli` installieren und eine WebDriver-Sitzung über die Befehlszeile erstellen, z.B.:

```sh
wdio repl chrome
```

Dies würde einen Chrome-Browser öffnen, den Sie mit der REPL-Oberfläche steuern können. Stellen Sie sicher, dass auf Port `4444` ein Browsertreiber ausgeführt wird, um die Sitzung zu initiieren. Wenn Sie ein [Sauce Labs](https://saucelabs.com) Konto (oder ein Konto eines anderen Cloud-Anbieters) haben, können Sie den Browser auch direkt in Ihrer Befehlszeile in der Cloud ausführen über:

```sh
wdio repl chrome -u $SAUCE_USERNAME -k $SAUCE_ACCESS_KEY
```

Wenn der Treiber auf einem anderen Port läuft, z.B.: 9515, könnte er mit dem Befehlszeilenargument --port oder alias -p übergeben werden

```sh
wdio repl chrome -u $SAUCE_USERNAME -k $SAUCE_ACCESS_KEY -p 9515
```

Die Repl-Schnittstelle kann auch mit Capabilities aus der WebdriverIO-Konfigurationsdatei ausgeführt werden. Es unterstützt Capabilities-Objekte; oder Multiremote-Capabilities.

Wenn die Konfigurationsdatei ein Capability-Objekt verwendet, übergeben Sie einfach den Pfad zur Konfigurationsdatei, andernfalls, wenn es sich um eine Multiremote-Capability handelt, geben Sie mit dem Positionsargument an, welche Capability aus der (Multiremote) Liste verwendet werden soll. Hinweis: Für die Liste betrachten wir einen nullbasierten Index.

### Beispiel

WebdriverIO mit Capability-Liste:

```ts title="wdio.conf.ts example"
export const config = {
    // ...
    capabilities:[{
        browserName: 'chrome', // options: `firefox`, `chrome`, `opera`, `safari`
        browserVersion: '27.0', // browser version
        platformName: 'Windows 10' // OS platform
    }]
}
```

```sh
wdio repl "./path/to/wdio.config.js" 0 -p 9515
```

WebdriverIO mit [Multiremote](https://webdriver.io/docs/multiremote/) Capability Objekt:

```ts title="wdio.conf.ts example"
export const config = {
    // ...
    capabilities: {
        myChromeBrowser: {
            capabilities: {
                browserName: 'chrome'
            }
        },
        myFirefoxBrowser: {
            capabilities: {
                browserName: 'firefox'
            }
        }
    }
}
```

```sh
wdio repl "./path/to/wdio.config.js" "myChromeBrowser" -p 9515
```

Oder wenn Sie lokale mobile Tests mit Appium durchführen möchten:

<Tabs
  defaultValue="android"
  values={[
    {label: 'Android', value: 'android'},
 {label: 'iOS', value: 'ios'}
 ]
}>
<TabItem value="android">

```sh
wdio repl android
```

</TabItem>
<TabItem value="ios">

```sh
wdio repl ios
```

</TabItem>
</Tabs>

Dies würde die Chrome/Safari-Sitzung auf dem verbundenen Gerät/Emulator/Simulator öffnen. Stellen Sie sicher, dass Appium auf Port `4444` ausgeführt wird, um die Sitzung zu initiieren.

```sh
wdio repl './path/to/your_app.apk'
```

Dies würde eine App-Sitzung auf einem verbundenen Gerät/Emulator/Simulator öffnen. Stellen Sie sicher, dass Appium auf Port `4444` ausgeführt wird, um die Sitzung zu initiieren.

Funktionen für iOS-Geräte können mit Argumenten übergeben werden:

* `-v`      - `platformVersion`: Version der Android/iOS-Plattform
* `-d`      - `deviceName`: Name des Mobilgeräts
* `-u`      - `udid`: udid für echte Geräte

Nutzung :

<Tabs
  defaultValue="long"
  values={[
    {label: 'Long Parameter Names', value: 'long'},
 {label: 'Short Parameter Names', value: 'short'}
 ]
}>
<TabItem value="long">

```sh
wdio repl ios --platformVersion 11.3 --deviceName 'iPhone 7' --udid 123432abc
```

</TabItem>
<TabItem value="short">

```sh
wdio repl ios -v 11.3 -d 'iPhone 7' -u 123432abc
```

</TabItem>
</Tabs>

Sie können alle Optionen anwenden (siehe `wdio repl --help`), die für Ihre REPL-Sitzung verfügbar sind.

![WebdriverIO REPL](https://webdriver.io/img/repl.gif)

Eine andere Möglichkeit, die REPL in Ihren Tests zu verwenden, besteht über den [`debug`](/docs/api/browser/debug) Befehl. Dies stoppt den Browser und erlaubt es Ihnen, in die Anwendung zu springen (z. B. zu den Entwicklungstools) oder den Browser von der Befehlszeile aus zu steuern. Dies ist hilfreich, wenn einige Befehle eine bestimmte Aktion nicht wie erwartet auslösen. Mit der REPL können Sie dann die Befehle ausprobieren, um zu sehen, welche am zuverlässigsten funktionieren.
