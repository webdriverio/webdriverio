---
id: driverbinaries
title: Бінарні файли драйверів
---

Щоб запустити автоматизацію на основі протоколу WebDriver, вам потрібно налаштувати драйвери браузерів, які розуміють команди автоматизації та виконують їх у браузері. Нижче описано, як можна налаштувати кожен драйвер окремо. Ви можете знайти список усіх драйверів у [`awesome-selenium`](https://github.com/christian-bromann/awesome-selenium#driver).

:::tip

If you are looking to set up mobile and other UI platforms, have a look into our [Appium Setup](appium) guide.

:::

## Chromedriver

To automate Chrome you can download Chromedriver directly on the [project website](http://chromedriver.chromium.org/downloads) or through the NPM package:

```bash npm2yarn
npm install -g chromedriver
```

You can then start it via:

```sh
chromedriver --port=4444 --verbose
```

## Geckodriver

To automate Firefox download the latest version of `geckodriver` for your environment and unpack it in your project directory:

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

**Note:** Other `geckodriver` releases are available [here](https://github.com/mozilla/geckodriver/releases). After download you can start the driver via:

```sh
/path/to/binary/geckodriver --port 4444
```

## Edgedriver

You can download the driver for Microsoft Edge on the [project website](https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/). After download you can start Edgedriver as follows:

```sh
./path/to/edgedriver --port=4444 --verbose
```

## Safaridriver

Safaridriver comes pre-installed on your MacOS and can be started directly via:

```sh
safaridriver -p 4444
```
