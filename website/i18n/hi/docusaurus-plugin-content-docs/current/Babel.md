---
id: babel
title: बेबेल सेटअप
---

अगली पीढ़ी की जावास्क्रिप्ट सुविधाओं का उपयोग करके टेस्ट लिखने के लिए, आप अपनी परीक्षण फ़ाइलों को संकलित करने के लिए [Babel](https://babeljs.io) का उपयोग कर सकते हैं।

ऐसा करने के लिए, पहले आवश्यक बाबेल निर्भरताओं को इंस्टाल करें:

```bash npm2yarn
npm install --save-dev @babel/core @babel/cli @babel/preset-env @babel/register
```

सुनिश्चित करें कि आपका [`babel.config.js`](https://babeljs.io/docs/en/config-files) ठीक से कॉन्फ़िगर किया गया है।

सबसे सरल सेटअप आप उपयोग कर सकते हैं है:

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

एक बार यह सेट हो जाने के बाद WebdriverIO बाकी का ध्यान रखेगा।

वैकल्पिक रूप से आप कॉन्फ़िगर कर सकते हैं कि कैसे @babel/register [@babel/register](babel) के लिए पर्यावरण वेरिएबल के माध्यम से चलाया जाता है या wdio कॉन्फ़िगरेशन के [autoCompileOpts section](configurationfile) का उपयोग कर रहा है।
