---
id: driverbinaries
title: Бінарні файли драйверів
---

To run automation based on the WebDriver protocol you need to have browser drivers set up that translate the automation commands and are able execute them in the browser.

:::warn

With WebdriverIO v8.14 and above there is no need to manually download and setup any browser drivers anymore as this is handled by WebdriverIO.

:::

Нижче описано, як можна налаштувати кожен драйвер окремо. Ви можете знайти список усіх драйверів у [`awesome-selenium`](https://github.com/christian-bromann/awesome-selenium#driver).

:::tip

Якщо ви хочете налаштувати мобільні платформи, ознайомтеся із нашою статтею [Налаштування Appium](appium).

:::

## Chromedriver

Щоб автоматизувати Chrome, ви можете завантажити Chromedriver безпосередньо на вебсайті [проекту](http://chromedriver.chromium.org/downloads) або через NPM пакунок:

```bash npm2yarn
npm install -g chromedriver
```

Потім ви можете запустити його за допомогою:

```sh
chromedriver --port=4444 --verbose
```

## Geckodriver

Щоб автоматизувати Firefox, завантажте останню версію `geckodriver` для свого середовища та розпакуйте її в каталозі проєкту:

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

**Примітка:** Інші версії `geckodriver` доступні [тут](https://github.com/mozilla/geckodriver/releases). Після завантаження ви можете запустити драйвер за допомогою:

```sh
/path/to/binary/geckodriver --port 4444
```

## Edgedriver

Ви можете завантажити драйвер для Microsoft Edge на вебсайті проєкту [](https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/). Після завантаження ви можете запустити драйвер за допомогою:

```sh
./path/to/edgedriver --port=4444 --verbose
```

## Safaridriver

Safaridriver попередньо встановлено на MacOS і його можна запустити без додаткових завантажень за допомогою:

```sh
safaridriver -p 4444
```
