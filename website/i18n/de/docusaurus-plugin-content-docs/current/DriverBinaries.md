---
id: driverbinaries
title: Browser Treiber
---

To run automation based on the WebDriver protocol you need to have browser drivers set up that translate the automation commands and are able execute them in the browser. With WebdriverIO `v8.14` and above there is no need to manually download and setup any browser drivers anymore as this is handled by WebdriverIO. You only need to have a browser installed, that's it!

The following describes how you can still set up each driver individually. Eine Liste mit allen Treibern finden Sie in der [`awesome-selenium`](https://github.com/christian-bromann/awesome-selenium#driver) README.

:::tip

Wenn Sie das Testen von mobilen und anderen UI-Plattformen einrichten möchten, werfen Sie einen Blick in unser [Appium Setup](appium) -Guide.

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
  defaultValue="npm"
  values={[
    {label: 'NPM', value: 'npm'},
 {label: 'Curl', value: 'curl'},
 {label: 'Brew', value: 'brew'},
 {label: 'Windows (64 bit / Chocolatey)', value: 'chocolatey'},
 {label: 'Windows (64 bit / Powershell) DevTools', value: 'powershell'},
 ]
}>
<TabItem value="curl">
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

**Note:** Other `geckodriver` releases are available [here](https://github.com/mozilla/geckodriver/releases). After download you can start the driver via:

```sh
/path/to/binary/geckodriver --port 4444
```

## Edgedriver

You can download the driver for Microsoft Edge on the [project website](https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/) or as NPM package via:

```sh
npm install -g edgedriver
edgedriver --version # prints: Microsoft Edge WebDriver 115.0.1901.203 (a5a2b1779bcfe71f081bc9104cca968d420a89ac)
```

## Safaridriver

Der Safari Treiber ist auf Ihrem MacOS vorinstalliert und kann direkt gestartet werden mit:

```sh
safaridriver -p 4444
```
