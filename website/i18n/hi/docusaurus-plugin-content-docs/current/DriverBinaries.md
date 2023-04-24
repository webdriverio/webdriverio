---
id: driverbinaries
title: Driver Binaries
---

वेबड्राइवर प्रोटोकॉल के आधार पर ऑटोमेशन चलाने के लिए आपको ब्राउज़र ड्राइवरों को सेट अप करने की आवश्यकता होती है जो ऑटोमेशन कमांड का अनुवाद करते हैं और उन्हें ब्राउज़र में निष्पादित करने में सक्षम होते हैं। निम्नलिखित वर्णन करता है कि आप प्रत्येक ड्राइवर को व्यक्तिगत रूप से कैसे सेट अप कर सकते हैं। आप [`awesome-selenium`](https://github.com/christian-bromann/awesome-selenium#driver) रीडमे में सभी ड्राइवरों के साथ एक सूची पा सकते हैं।

## क्रोमड्राइवर

क्रोम को स्वचालित करने के लिए आप Chromedriver को सीधे [प्रोजेक्ट वेबसाइट](http://chromedriver.chromium.org/downloads) या NPM पैकेज के माध्यम से डाउनलोड कर सकते हैं:

```bash npm2yarn
npm install -g chromedriver
```

इसके बाद आप इसे शुरू कर सकते हैं:

```sh
chromedriver --port=4444 --verbose
```

## गेकोड्राइवर

फ़ायरफ़ॉक्स को स्वचालित करने के लिए अपने पर्यावरण के लिए `geckodriver` का नवीनतम संस्करण डाउनलोड करें और इसे अपनी प्रोजेक्ट निर्देशिका में अनपैक करें:

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

**नोट:** अन्य `geckodriver` रिलीज उपलब्ध हैं [यहां](https://github.com/mozilla/geckodriver/releases)। डाउनलोड करने के बाद आप ड्राइवर को इसके माध्यम से शुरू कर सकते हैं:

```sh
/path/to/binary/geckodriver --port 4444
```

## Edgedriver

आप Microsoft Edge के लिए ड्राइवर को [प्रोजेक्ट वेबसाइट](https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/)पर डाउनलोड कर सकते हैं। डाउनलोड करने के बाद आप निम्नानुसार एडड्राइवर शुरू कर सकते हैं:

```sh
./path/to/edgedriver --port=4444 --verbose
```

## Safaridriver

सफ़ारीड्राइवर आपके MacOS पर पहले से इंस्टॉल आता है और इसके द्वारा सीधे शुरू किया जा सकता है:

```sh
सफारीड्राइवर -पी 4444
```
