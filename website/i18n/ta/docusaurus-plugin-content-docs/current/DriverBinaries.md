---
id: driverbinaries
title: டிரைவர் பைனரிஸ்
---

WebDriver நெறிமுறையின் அடிப்படையில் ஆட்டோமேஷனை இயக்க, தானியங்கு கட்டளைகளை மொழிபெயர்க்கும் பிரௌசர் டிரைவர்களை நீங்கள் அமைக்க வேண்டும் மற்றும் அவற்றைப் பிரௌசரில் செயல்படுத்த வேண்டும். ஒவ்வொரு டிரைவரையும் தனித்தனியாக எவ்வாறு அமைக்கலாம் என்பதை பின்வருவது விவரிக்கிறது. [`awesome-selenium`](https://github.com/christian-bromann/awesome-selenium#driver) README இல் அனைத்து டிரைவர் பட்டியலைக் காணலாம்.

:::tip

நீங்கள் மொபைல் மற்றும் பிற UI இயங்குதளங்களை அமைக்க விரும்பினால், எங்கள் [Appium Setup](appium) வழிகாட்டியைப் பார்க்கவும்.

:::

## Chromedriver

Chrome ஐ தானியங்குபடுத்த, நீங்கள் Chromedriver ஐ நேரடியாக [project website](http://chromedriver.chromium.org/downloads) ல் அல்லது NPM தொகுப்புமூலம் பதிவிறக்கம் செய்யலாம்:

```bash npm2yarn
npm install -g chromedriver
```

பின்னர் நீங்கள் இதைத் தொடங்கலாம்:

```sh
chromedriver --port=4444 --verbose
```

## Geckodriver

Firefox ஐ தானியக்கமாக்க, உங்கள் என்விரான்மென்டிக்கு ஏற்ற `geckodriver` இன் சமீபத்திய பதிப்பைப் பதிவிறக்கி, அதை உங்கள் ப்ராஜெக்ட் டைரக்டரியில் திறக்கவும்:

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

**Note:** மற்ற `geckodriver` வெளியீடுகள் கிடைக்கின்றன [here](https://github.com/mozilla/geckodriver/releases). பதிவிறக்கிய பிறகு, நீங்கள் டிரைவரைத் தொடங்கலாம்:

```sh
/path/to/binary/geckodriver --port 4444
```

## Edgedriver

மைக்ரோசாஃப்ட் எட்ஜிற்கான டிரைவரை [project website](https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/)இல் பதிவிறக்கம் செய்யலாம். பதிவிறக்கிய பிறகு நீங்கள் Edgedriver ஐ பின்வருமாறு தொடங்கலாம்:

```sh
./path/to/edgedriver --port=4444 --verbose
```

## Safaridriver

Safaridriver உங்கள் MacOS இல் முன்பே நிறுவப்பட்டுள்ளது மற்றும் இதன் மூலம் நேரடியாகத் தொடங்கலாம்:

```sh
safaridriver -p 4444
```
