---
id: driverbinaries
title: Browser Treiber
---

Um Automation basierend auf dem WebDriver-Protokoll auszuführen, benötigen Sie Browser-Treiber, die die Automatisierungsbefehle übersetzen und im Browser ausführen können.

## Automatisierte Einrichtung

Mit WebdriverIO `v8.14` und höher ist es nicht mehr nötig, Browser-Treiber manuell herunterzuladen und einzurichten, da dies von WebdriverIO übernommen wird. Sie müssen lediglich den Browser angeben, den Sie testen möchten, und WebdriverIO erledigt den Rest.

### Anpassung des Automatisierungsgrads

WebdriverIO bietet drei Automatisierungsstufen:

**1. Herunterladen und Installieren des Browsers mit [@puppeteer/browsers](https://www.npmjs.com/package/@puppeteer/browsers).**

Wenn Sie eine `browserName`/`browserVersion`-Kombination in der [capabilities](configuration#capabilities-1)-Konfiguration angeben, wird WebdriverIO die angeforderte Kombination herunterladen und installieren, unabhängig davon, ob auf dem Gerät bereits eine Installation vorhanden ist. Wenn Sie `browserVersion` weglassen, versucht WebdriverIO zunächst, eine vorhandene Installation mit [locate-app](https://www.npmjs.com/package/locate-app) zu finden und zu verwenden. Andernfalls wird die aktuelle stabile Browser-Version heruntergeladen und installiert. Weitere Details zu `browserVersion` finden Sie [hier](capabilities#automate-different-browser-channels).

:::caution

Die automatisierte Browser-Einrichtung unterstützt Microsoft Edge nicht. Derzeit werden nur Chrome, Chromium und Firefox unterstützt.

:::

Wenn Sie eine Browser-Installation an einem Ort haben, der von WebdriverIO nicht automatisch erkannt werden kann, können Sie die Browser-Binary angeben, was den automatischen Download und die Installation deaktiviert.

```ts
{
    capabilities: [
        {
            browserName: 'chrome', // or 'firefox' or 'chromium'
            'goog:chromeOptions': { // or 'moz:firefoxOptions' or 'wdio:chromedriverOptions'
                binary: '/path/to/chrome'
            },
        }
    ]
}
```

**2. Herunterladen und Installieren des Treibers mit [Chromedriver](https://www.npmjs.com/package/chromedriver), [Edgedriver](https://www.npmjs.com/package/edgedriver) oder [Geckodriver](https://www.npmjs.com/package/geckodriver).**

WebdriverIO wird dies immer tun, es sei denn, der Treiber [binary](capabilities#binary) ist in der Konfiguration angegeben:

```ts
{
    capabilities: [
        {
            browserName: 'chrome', // or 'firefox', 'msedge', 'safari', 'chromium'
            'wdio:chromedriverOptions': { // or 'wdio:geckodriverOptions', 'wdio:edgedriverOptions'
                binary: '/path/to/chromedriver' // or 'geckodriver', 'msedgedriver'
            }
        }
    ]
}
```

:::info

WebdriverIO lädt den Safari-Treiber nicht automatisch herunter, da er bereits auf macOS installiert ist.

:::

:::caution

Vermeiden Sie es, eine `binary` für den Browser anzugeben und die entsprechende Treiber-`binary` wegzulassen oder umgekehrt. Wenn nur einer der `binary`-Werte angegeben wird, versucht WebdriverIO, einen damit kompatiblen Browser/Treiber zu verwenden oder herunterzuladen. In einigen Szenarien kann dies jedoch zu einer inkompatiblen Kombination führen. Daher wird empfohlen, immer beide anzugeben, um Probleme durch Versionsinkompatibilitäten zu vermeiden.

:::

**3. Starten/Stoppen des Treibers.**

Standardmäßig startet und stoppt WebdriverIO den Treiber automatisch unter Verwendung eines beliebigen ungenutzten Ports. Die Angabe einer der folgenden Konfigurationen deaktiviert diese Funktion, was bedeutet, dass Sie den Treiber manuell starten und stoppen müssen:

- Jeder Wert für [port](configuration#port).
- Jeder Wert, der vom Standardwert für [protocol](configuration#protocol), [hostname](configuration#hostname), [path](configuration#path) abweicht.
- Jeder Wert für sowohl [user](configuration#user) als auch [key](configuration#key).

## Manuelle Einrichtung

Im Folgenden wird beschrieben, wie Sie jeden Treiber individuell einrichten können. Eine Liste mit allen Treibern finden Sie in der [`awesome-selenium`](https://github.com/christian-bromann/awesome-selenium#driver) README.

:::tip

Wenn Sie das Testen von mobilen und anderen UI-Plattformen einrichten möchten, werfen Sie einen Blick in unser [Appium Setup](appium) -Guide.

:::

### Chromedriver

Um Chrome zu automatisieren, können Sie Chromedriver direkt auf der [-Projektwebsite](http://chromedriver.chromium.org/downloads) oder über das NPM-Paket herunterladen:

```bash npm2yarn
npm install -g chromedriver
```

Sie können dann den Treiber starten mit:

```sh
chromedriver --port=4444 --verbose
```

### Geckodriver

Um Firefox zu automatisieren, laden Sie die neueste Version von `geckodriver` für Ihre Umgebung herunter und entpacken Sie sie in Ihr Projektverzeichnis:

<Tabs
  defaultValue="npm"
  values={[
    {label: 'NPM', value: 'npm'},
 {label: 'Curl', value: 'curl'},
 {label: 'Brew', value: 'brew'},
 {label: 'Windows (64 bit / Chocolatey)', value: 'chocolatey'},
 {label: 'Windows (64 bit / Powershell) DevTools', value: 'powershell'},
 ]
}>
<TabItem value="npm">

```bash npm2yarn
npm install geckodriver
```

</TabItem>
<TabItem value="curl">

Linux:

```sh
curl -L https://github.com/mozilla/geckodriver/releases/download/v0.24.0/geckodriver-v0.24.0-linux64.tar.gz | tar xz
```

MacOS (64 bit):

```sh
curl -L https://github.com/mozilla/geckodriver/releases/download/v0.24.0/geckodriver-v0.24.0-macos.tar.gz | tar xz
```

</TabItem>
<TabItem value="brew">

```sh
brew install geckodriver
```

</TabItem>
<TabItem value="chocolatey">

```sh
choco install selenium-gecko-driver
```

</TabItem>
<TabItem value="powershell">

```sh
# Als privilegierte Sitzung ausführen. Rechtsklick und 'Als Administrator ausführen' wählen
# Verwenden Sie geckodriver-v0.24.0-win32.zip für 32-Bit-Windows
$url = "https://github.com/mozilla/geckodriver/releases/download/v0.24.0/geckodriver-v0.24.0-win64.zip"
$output = "geckodriver.zip" # wird im aktuellen Verzeichnis abgelegt, sofern nicht anders definiert
$unzipped_file = "geckodriver" # wird in diesen Ordnernamen entpackt

# Standardmäßig verwendet Powershell TLS 1.0, die Webseitensicherheit erfordert TLS 1.2
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# Lädt Geckodriver herunter
Invoke-WebRequest -Uri $url -OutFile $output

# Entpackt Geckodriver
Expand-Archive $output -DestinationPath $unzipped_file
cd $unzipped_file

# Setzt Geckodriver global in PATH
[System.Environment]::SetEnvironmentVariable("PATH", "$Env:Path;$pwd\geckodriver.exe", [System.EnvironmentVariableTarget]::Machine)
```

</TabItem>
</Tabs>

**Hinweis:** Andere `geckodriver`-Versionen sind [hier](https://github.com/mozilla/geckodriver/releases) verfügbar. Nach dem Herunterladen können Sie den Treiber starten mit:

```sh
/path/to/binary/geckodriver --port 4444
```

### Edgedriver

Sie können den Treiber für Microsoft Edge auf der [Projektwebsite](https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/) oder als NPM-Paket herunterladen:

```sh
npm install -g edgedriver
edgedriver --version # gibt aus: Microsoft Edge WebDriver 115.0.1901.203 (a5a2b1779bcfe71f081bc9104cca968d420a89ac)
```

### Safaridriver

Der Safari Treiber ist auf Ihrem MacOS vorinstalliert und kann direkt gestartet werden mit:

```sh
safaridriver -p 4444
```
