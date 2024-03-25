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
                node: '20' // update with the target you are aiming for
            }
        }]
    ]
}
```

When using Babel in a monorepo things can get complicated if you do not follow the documentation steps, so make sure you read the [Babel documentation](https://babeljs.io/docs/config-files#monorepos) thoroughly.

To give you some guidance, here's some things to keep in mind:
- You have to create a [root babel.config.json](https://babeljs.io/docs/config-files#root-babelconfigjson-file).
- After you have done so and the project is correctly configured according to the documentation, you will have to make Babel look for the config by updating your wdio config files by adding the example found below.

```js
require("@babel/register")({
  rootMode: "upward",
});
```

This will make Babel look for the closest `babel.config.json` that it can find upwards.

एक बार यह सेट हो जाने के बाद WebdriverIO बाकी का ध्यान रखेगा।

Alternatively you can configure how @babel/register is run through the environment variables for [@babel/register](https://babeljs.io/docs/babel-register#environment-variables).
