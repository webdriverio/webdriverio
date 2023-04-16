---
id: babel
title: बेबेल सेटअप
---

अगली पीढ़ी की जावास्क्रिप्ट सुविधाओं का उपयोग करके टेस्ट लिखने के लिए, आप अपनी परीक्षण फ़ाइलों को संकलित करने के लिए [Babel](https://babeljs.io) का उपयोग कर सकते हैं।

ऐसा करने के लिए, पहले आवश्यक बाबेल निर्भरताओं को इंस्टाल करें:

```bash npm2yarn
npm install --save-dev @babel/core @babel/cli @babel/preset-env @babel/register
```

Make sure your [`babel.config.js`](https://babeljs.io/docs/en/config-files) is configured properly.

The simplest setup you can use is:

```js title="babel.config.js"
module.exports = {
    presets: [
        ['@babel/preset-env', {
            targets: {
                node: '14'
            }
        }]
    ]
}
```

Once this is set up WebdriverIO will take care of the rest.

Alternatively you can configure how @babel/register is run through the environment variables for [@babel/register](Babel.md) or using wdio config's [autoCompileOpts section](ConfigurationFile.md).
