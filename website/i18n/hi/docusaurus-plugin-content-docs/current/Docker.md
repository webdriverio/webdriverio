---
id: docker
title: Docker
---

डॉकर एक शक्तिशाली कंटेनरीकरण तकनीक है जो आपके टेस्ट सूट को एक ऐसे कंटेनर में समाहित करने की अनुमति देती है जो हर सिस्टम पर समान व्यवहार करता है। यह अलग-अलग ब्राउज़र या प्लेटफ़ॉर्म संस्करणों के कारण अस्थिरता से बच सकता है। एक कंटेनर के भीतर अपने परीक्षण चलाने के लिए, अपनी प्रोजेक्ट निर्देशिका में `Dockerfile` बनाएं, उदाहरण के लिए:

```Dockerfile
FROM ianwalter/puppeteer:latest
WORKDIR /app
ADD . /app

RUN npm install

CMD npx wdio
```

सुनिश्चित करें कि आपने अपनी डॉकर छवि में अपना `node_modules` शामिल नहीं किया है और छवि बनाते समय इन्हें स्थापित किया है। उसके लिए निम्नलिखित सामग्री के साथ `.dockerignore` फ़ाइल जोड़ें:

```
node_modules
```

:::info
हम यहां डॉकर छवि का उपयोग कर रहे हैं जो पहले से इंस्टॉल गूगल क्रोम के साथ आती है। वहाँ विभिन्न ब्राउज़र सेटअप के साथ विभिन्न चित्र उपलब्ध हैं। [डॉकर हब](https://hub.docker.com/u/selenium).पर सेलेनियम प्रोजेक्ट द्वारा बनाए गए चित्रों को देखें।
:::

जैसा कि हम अपने डॉकर कंटेनर में गूगल क्रोम को केवल हेडलेस मोड में चला सकते हैं, हमें यह सुनिश्चित करने के लिए अपने `wdio.conf.js` संशोधित करना होगा:

```js title="wdio.conf.js"
export const config = {
    // ...
    capabilities: [{
        maxInstances: 1,
        browserName: 'chrome',
        acceptInsecureCerts: true,
        'goog:chromeOptions': {
            args: [
                '--no-sandbox',
                '--disable-infobars',
                '--headless',
                '--disable-gpu',
                '--window-size=1440,735'
            ],
        }
    }],
    // ...
}
```

जैसा कि [ऑटोमेशन प्रोटोकॉल](/docs/automationProtocols) में बताया गया है, आप WebDriverIO को WebDriver प्रोटोकॉल या Chrome DevTools का उपयोग करके चला सकते हैं। यदि आप वेबड्राइवर का उपयोग करते हैं तो सुनिश्चित करें कि आपकी छवि पर स्थापित क्रोम संस्करण [क्रोमड्राइवर](https://www.npmjs.com/package/chromedriver) संस्करण से मेल खाता है जिसे आपने अपने `package.json`में परिभाषित किया है।

डॉकर कंटेनर बनाने के लिए आप चला सकते हैं:

```sh
docker build -t mytest -f Dockerfile .
```

फिर परीक्षण चलाने के लिए, निष्पादित करें:

```sh
docker run -it mytest
```

डॉकर छवि को कॉन्फ़िगर करने के बारे में अधिक जानकारी के लिए, [डॉकर दस्तावेज़](https://docs.docker.com/)देखें।
