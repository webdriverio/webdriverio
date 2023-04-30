---
id: driverbinaries
title: Driver Binaries
---

Чтобы запустить автоматизацию на основе протокола WebDriver, необходимо иметь настроенные драйверы браузера, которые переведут команды автоматизации и смогут выполнять их в браузере. Ниже приведено описание, как можно настроить каждый драйвер по отдельности. Вы можете найти список со всеми драйверами [`здесь`](https://github.com/christian-bromann/awesome-selenium#driver) .

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

**Note:** Other `geckodriver` releases are available [here](https://github.com/mozilla/geckodriver/releases). После загрузки вы можете запустить драйвер, используя:

```sh
/path/to/binary/geckodriver --port 4444
```

## Edgedriver

Вы можете скачать драйвер для Microsoft Edge на [сайте проекта](https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/). После загрузки вы можете запустить Edgedriver следующим образом:

```sh
./path/to/edgedriver --port=4444 --verbose
```

## Safaridriver

Драйвер Safari предустановлен на вашей MacOS и может быть запущен напрямую через:

```sh
safaridriver -p 4444
```
