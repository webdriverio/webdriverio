---
id: driverbinaries
title: Controladores binarios
---

Para ejecutar la automatización basada en el protocolo WebDriver usted necesita tener los controladores del navegador configurados que traduzcan los comandos de automatización y son capaces de ejecutarlos en el navegador. A continuación se describe cómo puede configurar cada controlador de forma individual. Puedes encontrar una lista con todos los conductores en [`asombro-selenium`](https://github.com/christian-bromann/awesome-selenium#driver) README.

## Chromedriver

Para automatizar Chrome puedes descargar Chromedriver directamente en el sitio web del proyecto [](http://chromedriver.chromium.org/downloads) o a través del paquete de NPM:

```bash npm2yarn
npm install -g chromedriver
```

A continuación, puede iniciarlo vía:

```sh
chromedriver --port=4444 --verbose
```

## Geckodriver

Para automatizar Firefox descarga la última versión de `geckodriver` para tu entorno y desempaquetarla en el directorio de tu proyecto:

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

**Nota:** Otros lanzamientos `geckodriver` están disponibles [aquí](https://github.com/mozilla/geckodriver/releases). Después de la descarga puede iniciar el controlador vía:

```sh
/path/to/binary/geckodriver --port 4444
```

## Edgedriver

Puede descargar el controlador para Microsoft Edge en la página web del proyecto [](https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/). Después de la descarga puede iniciar el controlador vía:

```sh
./path/to/edgedriver --port=4444 --verbose
```

## Safaridriver

Safaridriver viene preinstalado en tu MacOS y puede iniciarse directamente a través de:

```sh
safaridriver -p 4444
```
