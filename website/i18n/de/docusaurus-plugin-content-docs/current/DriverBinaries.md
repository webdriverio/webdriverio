---
id: driverbinaries
title: Browser Treiber
---

Um die Automatisierung basierend auf dem WebDriver-Protokoll auszuführen, müssen Sie Browsertreiber einrichten, die die Automatisierungsbefehle übersetzen und im Browser ausführen können. Im Folgenden wird beschrieben, wie Sie jeden Treiber einzeln einrichten können. Eine Liste mit allen Treibern finden Sie in der [`awesome-selenium`](https://github.com/christian-bromann/awesome-selenium#driver) README.

:::tip

Wenn Sie das Testen von mobilen und anderen UI-Plattformen einrichten möchten, werfen Sie einen Blick in unser [Appium Setup](appium) Guide.

:::

## Chromedriver

Um Chrome zu automatisieren, können Sie Chromedriver direkt auf der [-Projektwebsite](http://chromedriver.chromium.org/downloads) oder über das NPM-Paket herunterladen:

```bash npm2yarn
npm install -g chromedriver
```

Sie können dann den Treiber starten mit:

```sh
chromedriver --port=4444 --verbose
```

## Geckodriver

Um Firefox zu automatisieren, laden Sie die neueste Version von `geckodriver` für Ihre Umgebung herunter und entpacken Sie sie in Ihr Projektverzeichnis:

<Tabs
  defaultValue="curl"
  values={[
    {label: 'Curl', value: 'curl'},
 {label: 'Brew', value: 'brew'},
 {label: 'Windows (64 bit / Chocolatey)', value: 'chocolatey'},
 {label: 'Windows (64 bit / Powershell) DevTools', value: 'powershell'},
 ]
}>
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
# Run as privileged session. Right-click and set 'Run as Administrator'
# Use geckodriver-v0.24.0-win32.zip for 32 bit Windows
$url = "https://github.com/mozilla/geckodriver/releases/download/v0.24.0/geckodriver-v0.24.0-win64.zip"
$output = "geckodriver.zip" # will drop into current directory unless defined otherwise
$unzipped_file = "geckodriver" # will unzip to this folder name

# By default, Powershell uses TLS 1.0 the site security requires TLS 1.2
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# Downloads Geckodriver
Invoke-WebRequest -Uri $url -OutFile $output

# Unzip Geckodriver
Expand-Archive $output -DestinationPath $unzipped_file
cd $unzipped_file

# Globally Set Geckodriver to PATH
[System.Environment]::SetEnvironmentVariable("PATH", "$Env:Path;$pwd\geckodriver.exe", [System.EnvironmentVariableTarget]::Machine)
```

</TabItem>
</Tabs>

**Hinweis:** Weitere `Versionen von Geckodriver` sind verfügbar [hier](https://github.com/mozilla/geckodriver/releases). Nach dem Download können Sie den Treiber starten mit:

```sh
/path/to/binary/geckodriver --port 4444
```

## Edgedriver

Sie können den Treiber für Microsoft Edge auf der [Projektwebsite](https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/) herunterladen. Nach dem Download können Sie den Treiber starten mit:

```sh
./path/to/edgedriver --port=4444 --verbose
```

## Safaridriver

Der Safari Treiber ist auf Ihrem MacOS vorinstalliert und kann direkt gestartet werden mit:

```sh
safaridriver -p 4444
```
