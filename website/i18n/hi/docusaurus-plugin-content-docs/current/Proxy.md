---
id: proxy
title: प्रॉक्सी सेटअप
---

आप प्रॉक्सी के माध्यम से दो अलग-अलग प्रकार के अनुरोधों को टनल कर सकते हैं:

- आपकी टेस्ट स्क्रिप्ट और ब्राउज़र ड्राइवर (या वेबड्राइवर एंडपॉइंट) के बीच कनेक्शन
- ब्राउज़र और इंटरनेट के बीच संबंध

## ब्राउज़र और इंटरनेट के बीच प्रॉक्सी

If your company has a corporate proxy (e.g. on `http://my.corp.proxy.com:9090`) for all outgoing requests, follow the below steps to install and configure [undici](https://github.com/nodejs/undici).

### Install undici

```bash npm2yarn
npm install undici --save-dev
```

### Add undici setGlobalDispatcher to your config file

अपनी कॉन्फ़िगरेशन फ़ाइल के शीर्ष पर निम्न आवश्यक कथन जोड़ें।

```js title="wdio.conf.js"
import { setGlobalDispatcher, ProxyAgent } from 'undici';

const dispatcher = new ProxyAgent({ uri: new URL(process.env.https_proxy).toString() });
setGlobalDispatcher(dispatcher);

export const config = {
    // ...
}
```
Additional information about configuring the proxy can be located [here](https://github.com/nodejs/undici/blob/main/docs/docs/api/ProxyAgent.md).

यदि आप [सॉस कनेक्ट प्रॉक्सी](https://docs.saucelabs.com/secure-connections/#sauce-connect-proxy)का उपयोग करते हैं, तो इसे इसके माध्यम से प्रारंभ करें:

```sh
sc -u $SAUCE_USERNAME -k $SAUCE_ACCESS_KEY --no-autodetect -p http://my.corp.proxy.com:9090
```

## ब्राउज़र और इंटरनेट के बीच प्रॉक्सी

ब्राउज़र और इंटरनेट के बीच कनेक्शन को टनल करने के लिए, आप एक प्रॉक्सी सेट कर सकते हैं जो (उदाहरण के लिए) [BrowserMob Proxy](https://github.com/lightbody/browsermob-proxy)जैसे टूल के साथ नेटवर्क जानकारी और अन्य डेटा कैप्चर करने के लिए उपयोगी हो सकता है।

`proxy` पैरामीटर को मानक क्षमताओं के माध्यम से निम्न तरीके से लागू किया जा सकता है:

```js title="wdio.conf.js"
निर्यात स्थिरांक विन्यास = {
    // ...
    capabilities: [{
        browserName: 'chrome',
        // ...
        proxy: {
            proxyType: "manual",
            httpProxy: "corporate.proxy:8080",
            socksUsername: "codeceptjs",
            socksPassword: "secret",
            noProxy: "127.0.0.1,localhost"
        },
        // ...
    }],
    // ...
}
```

अधिक जानकारी के लिए, [वेबड्राइवर विनिर्देश](https://w3c.github.io/webdriver/#proxy)देखें।
