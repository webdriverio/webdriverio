---
id: proxy
title: प्रॉक्सी सेटअप
---

आप प्रॉक्सी के माध्यम से दो अलग-अलग प्रकार के अनुरोधों को टनल कर सकते हैं:

- आपकी टेस्ट स्क्रिप्ट और ब्राउज़र ड्राइवर (या वेबड्राइवर एंडपॉइंट) के बीच कनेक्शन
- ब्राउज़र और इंटरनेट के बीच संबंध

## ब्राउज़र और इंटरनेट के बीच प्रॉक्सी

यदि आपकी कंपनी के पास सभी आउटगोइंग अनुरोधों के लिए कॉर्पोरेट प्रॉक्सी (उदाहरण के लिए `http://my.corp.proxy.com:9090`पर) है, तो [global-agent](https://github.com/gajus/global-agent)को स्थापित और कॉन्फ़िगर करने के लिए नीचे दिए गए चरणों का पालन करें।

### वैश्विक-एजेंट स्थापित करें

```bash npm2yarn
npm install global-agent --save-dev
```

### अपनी कॉन्फ़िगरेशन फ़ाइल में ग्लोबल-एजेंट बूटस्ट्रैप जोड़ें

अपनी कॉन्फ़िगरेशन फ़ाइल के शीर्ष पर निम्न आवश्यक कथन जोड़ें।

```js title="wdio.conf.js"
'ग्लोबल-एजेंट' से { bootstrap } आयात करें;
बूटस्ट्रैप ();

एक्सपोर्ट कॉन्स्ट कॉन्फ़िगरेशन = {
    // ...
}
```

### वैश्विक-एजेंट पर्यावरण चर सेट करें

परीक्षण शुरू करने से पहले, सुनिश्चित करें कि आपने चर को टर्मिनल में निर्यात कर दिया है, जैसे:

```sh
export GLOBAL_AGENT_HTTP_PROXY=http://my.corp.proxy.com:9090
wdio wdio.conf.js
```

आप चर को निर्यात करके URL को प्रॉक्सी से बाहर कर सकते हैं, जैसे:

```sh
export GLOBAL_AGENT_HTTP_PROXY=http://my.corp.proxy.com:9090
export GLOBAL_AGENT_NO_PROXY='.foo.com'
wdio wdio.conf.js
```

यदि आवश्यक हो, तो आप HTTP ट्रैफ़िक की तुलना में किसी भिन्न प्रॉक्सी के माध्यम से HTTPS ट्रैफ़िक को रूट करने के लिए `GLOBAL_AGENT_HTTPS_PROXY` निर्दिष्ट कर सकते हैं।

```sh
export GLOBAL_AGENT_HTTP_PROXY=http://my.corp.proxy.com:9090
export GLOBAL_AGENT_HTTPS_PROXY=http://my.corp.proxy.com:9091
wdio wdio.conf.js
```

`GLOBAL_AGENT_HTTP_PROXY` का उपयोग HTTP और HTTPS दोनों अनुरोधों के लिए किया जाता है यदि `GLOBAL_AGENT_HTTPS_PROXY` सेट नहीं है।

यदि आप [सॉस कनेक्ट प्रॉक्सी](https://wiki.saucelabs.com/display/DOCS/Sauce+Connect+Proxy)का उपयोग करते हैं, तो इसे इसके माध्यम से प्रारंभ करें:

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
