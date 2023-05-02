---
id: repl
title: आरईपीएल इंटरफ़ेस
---

`v4.5.0`के साथ, WebdriverIO ने एक [REPL](https://en.wikipedia.org/wiki/Read%E2%80%93eval%E2%80%93print_loop) इंटरफ़ेस पेश किया जो आपको न केवल फ्रेमवर्क एपीआई सीखने में मदद करता है, बल्कि आपके परीक्षणों को डिबग और निरीक्षण करने में भी मदद करता है। इसे कई तरह से इस्तेमाल किया जा सकता है।

सबसे पहले आप इसे `npm install -g @wdio/cli` इंस्टॉल करके सीएलआई कमांड के रूप में उपयोग कर सकते हैं और कमांड लाइन से वेबड्राइवर सत्र उत्पन्न कर सकते हैं, उदाहरण के लिए

```sh
wdio repl chrome
```

यह एक क्रोम ब्राउज़र खोलेगा जिसे आप REPL इंटरफ़ेस से नियंत्रित कर सकते हैं। सत्र आरंभ करने के लिए सुनिश्चित करें कि आपके पास पोर्ट `4444` पर एक ब्राउज़र ड्राइवर चल रहा है। यदि आपके पास [सॉस लैब्स](https://saucelabs.com) (या अन्य क्लाउड विक्रेता) खाता है, तो आप क्लाउड में अपनी कमांड लाइन पर सीधे ब्राउज़र चला सकते हैं:

```sh
wdio repl chrome -u $SAUCE_USERNAME -k $SAUCE_ACCESS_KEY
```

यदि ड्राइवर अलग-अलग पोर्ट पर चल रहा है जैसे: 9515, यह कमांड लाइन तर्क --port या उपनाम -p के साथ पास हो सकता है

```sh
wdio repl chrome -u $SAUCE_USERNAME -k $SAUCE_ACCESS_KEY -p 9515
```

Repl को webdriverIO कॉन्फ़िगरेशन फ़ाइल की क्षमताओं का उपयोग करके भी चलाया जा सकता है। Wdio क्षमताओं का समर्थन करता है वस्तु; या ; मल्टीरिमोट क्षमता सूची या वस्तु।

यदि कॉन्फ़िगरेशन फ़ाइल क्षमताओं ऑब्जेक्ट का उपयोग करती है तो कॉन्फ़िगरेशन फ़ाइल के पथ को पास करें, अन्यथा यदि यह एक बहु-दूरस्थ क्षमता है, तो निर्दिष्ट करें कि स्थितित्मक तर्क का उपयोग करके सूची या बहु-दूरस्थ से किस क्षमता का उपयोग करना है। नोट: सूची के लिए हम शून्य आधारित सूचकांक पर विचार करते हैं।

### उदाहरण

क्षमता सरणी के साथ WebdriverIO:

```ts title="wdio.conf.ts example"
export const config = {
    // ...
    capabilities:[{
        browserName: 'chrome', // options: `firefox`, `chrome`, `opera`, `safari`
        browserVersion: '27.0', // browser version
        platformName: 'Windows 10' // OS platform
    }]
}
```

```sh
wdio repl "./path/to/wdio.config.js" 0 -p 9515
```

WebdriverIO [मल्टीरिमोट](https://webdriver.io/docs/multiremote/) क्षमता वस्तु के साथ:

```ts title="wdio.conf.ts example"
export const config = {
    // ...
    capabilities: {
        myChromeBrowser: {
            capabilities: {
                browserName: 'chrome'
            }
        },
        myFirefoxBrowser: {
            capabilities: {
                browserName: 'firefox'
            }
        }
    }
}
```

```sh
wdio repl "./path/to/wdio.config.js" "myChromeBrowser" -p 9515
```

या यदि आप एपियम का उपयोग करके स्थानीय मोबाइल परीक्षण चलाना चाहते हैं:

<Tabs
  defaultValue="android"
  values={[
    {label: 'Android', value: 'android'},
 {label: 'iOS', value: 'ios'}
 ]
}>
<TabItem value="android">

```sh
wdio repl android
```

</TabItem>
<TabItem value="ios">

```sh
wdio repl ios
```

</TabItem>
</Tabs>

यह कनेक्टेड डिवाइस/एमुलेटर/सिम्युलेटर पर क्रोम/सफारी सत्र खोलेगा। सत्र आरंभ करने के लिए सुनिश्चित करें कि Appium पोर्ट `4444` पर चल रहा है।

```sh
wdio repl './path/to/your_app.apk'
```

यह कनेक्टेड डिवाइस/एमुलेटर/सिम्युलेटर पर ऐप सेशन खोलेगा। सत्र आरंभ करने के लिए सुनिश्चित करें कि Appium पोर्ट `4444` पर चल रहा है।

आईओएस डिवाइस के लिए क्षमताओं को तर्कों के साथ पारित किया जा सकता है:

* `-v`      - `platformVersion`: Android/iOS प्लेटफ़ॉर्म का संस्करण
* `-d`      - `deviceName`: मोबाइल डिवाइस का नाम
* `-u`      - `udi`: वास्तविक उपकरणों के लिए udid

युसेज

<Tabs
  defaultValue="long"
  values={[
    {label: 'Long Parameter Names', value: 'long'},
 {label: 'Short Parameter Names', value: 'short'}
 ]
}>
<TabItem value="long">

```sh
wdio repl ios --platformVersion 11.3 --deviceName 'iPhone 7' --udid 123432abc
```

</TabItem>
<TabItem value="short">

```sh
wdio repl ios -v 11.3 -d 'iPhone 7' -u 123432abc
```

</TabItem>
</Tabs>

आप अपने आरईपीएल सत्र के लिए उपलब्ध कोई भी विकल्प लागू कर सकते हैं ( `wdio repl --help`देखें)।

![WebdriverIO REPL](https://webdriver.io/img/repl.gif)

आरईपीएल का उपयोग करने का दूसरा तरीका [`debug`](/docs/api/browser/debug) कमांड के माध्यम से आपके परीक्षणों के अंदर है। कॉल किए जाने पर यह ब्राउज़र को बंद कर देगा, और आपको एप्लिकेशन (जैसे देव उपकरण) में कूदने या कमांड लाइन से ब्राउज़र को नियंत्रित करने में सक्षम बनाता है। यह तब मददगार होता है जब कुछ कमांड अपेक्षित रूप से एक निश्चित क्रिया को ट्रिगर नहीं करते हैं। आरईपीएल के साथ, आप फिर यह देखने के लिए कमांड आज़मा सकते हैं कि कौन सबसे भरोसेमंद काम कर रहा है।
