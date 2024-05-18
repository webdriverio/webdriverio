---
id: driverbinaries
title: Driver Binaries
---

To run automation based on the WebDriver protocol you need to have browser drivers set up that translate the automation commands and are able to execute them in the browser.

## Automated setup

With WebdriverIO `v8.14` and above there is no need to manually download and setup any browser drivers anymore as this is handled by WebdriverIO. All you have to do is specify the browser you want to test and WebdriverIO will do the rest.

### Customizing the level of automation

WebdriverIO's have three levels of automation:

**1. Download and install the browser using [@puppeteer/browsers](https://www.npmjs.com/package/@puppeteer/browsers).**

If you specify a `browserName`/`browserVersion` combination in the [capabilities](configuration#capabilities-1) configuration, WebdriverIO will download and install the requested combination, regardless of whether there's an existing installation on the machine. If you omit `browserVersion`, WebdriverIO will first try to locate and use an existing installation with [locate-app](https://www.npmjs.com/package/locate-app), otherwise it will download and install the current stable browser release. For more details on `browserVersion`, see [here](capabilities#automate-different-browser-channels).

:::caution

Automated browser setup does not support Microsoft Edge. Currently, only Chrome, Chromium and Firefox are supported.

:::

If you have a browser installation on a location that cannot be auto-detected by WebdriverIO, you can specify the browser binary which will disable the automated download and installation.

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

**2. Download and install the driver using [Chromedriver](https://www.npmjs.com/package/chromedriver), [Edgedriver](https://www.npmjs.com/package/edgedriver) or [Geckodriver](https://www.npmjs.com/package/geckodriver).**

WebdriverIO will always do this, unless driver [binary](capabilities#binary) is specified in the configuration:

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

WebdriverIO won't automatically download Safari driver as it is already installed on macOS.

:::

:::caution

Avoid specifying a `binary` for the browser and omitting the corresponding driver `binary` or vice-versa. If only one of the `binary` values is specified, WebdriverIO will try to use or download a browser/driver compatible with it. However, in some scenarios it may result in an incompatible combination. Therefore, it's recommended that you always specify both to avoid any problems caused by version incompatibilities.

:::

**3. Start/stop the driver.**

By default, WebdriverIO will automatically start and stop the driver using an arbitrary unused port. Specifying any of the following configuration will disable this feature which means you'll need to manually start and stop the driver:

- Any value for [port](configuration#port).
- Any value different from the default for [protocol](configuration#protocol), [hostname](configuration#hostname), [path](configuration#path).
- Any value for both [user](configuration#user) and [key](configuration#key).

## Manual setup

The following describes how you can still set up each driver individually. You can find a list with all drivers in the [`awesome-selenium`](https://github.com/christian-bromann/awesome-selenium#driver) README.

:::tip

If you are looking to set up mobile and other UI platforms, have a look into our [Appium Setup](appium) guide.

:::

### Chromedriver

To automate Chrome you can download Chromedriver directly on the [project website](http://chromedriver.chromium.org/downloads) or through the NPM package:

```bash npm2yarn
npm install -g chromedriver
```

You can then start it via:

```sh
chromedriver --port=4444 --verbose
```

### Geckodriver

To automate Firefox download the latest version of `geckodriver` for your environment and unpack it in your project directory:

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

### Edgedriver

You can download the driver for Microsoft Edge on the [project website](https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/) or as NPM package via:

```sh
npm install -g edgedriver
edgedriver --version # prints: Microsoft Edge WebDriver 115.0.1901.203 (a5a2b1779bcfe71f081bc9104cca968d420a89ac)
```

### Safaridriver

Safaridriver comes pre-installed on your MacOS and can be started directly via:

```sh
safaridriver -p 4444
```
