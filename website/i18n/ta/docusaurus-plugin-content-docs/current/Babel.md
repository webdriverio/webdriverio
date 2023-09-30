---
id: babel
title: பேபல் அமைப்பு
---

next-generation JavaScript அம்சங்களைப் பயன்படுத்தி டெஸ்டுகள் எழுத, உங்கள் டெஸ்ட் பைலுகளைத் தொகுக்க [Babel](https://babeljs.io) பயன்படுத்தலாம்.

அவ்வாறு செய்ய, முதலில் தேவையான Babel சார்புகளை நிறுவவும்:

```bash npm2yarn
npm install --save-dev @babel/core @babel/cli @babel/preset-env @babel/register
```

உங்கள் [`babel.config.js`](https://babeljs.io/docs/en/config-files) சரியாக உள்ளமைக்கப்பட்டுள்ளதா என்பதை உறுதிப்படுத்தவும்.

நீங்கள் பயன்படுத்தக்கூடிய எளிய அமைப்பு:

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
- You have to create a (root `babel.config.json`)[https://babeljs.io/docs/config-files#root-babelconfigjson-file]
- After you have done so and the project is correctly configured according to the documentation, you will have to make Babel look for the config by updating your wdio config files by adding the example found below.

```js
require("@babel/register")({
  rootMode: "upward",
});
```

This will make Babel look for the closest `babel.config.json` that it can find upwards.

இதை அமைத்தவுடன் WebdriverIO மீதமுள்ளவற்றை கவனித்துக் கொள்ளும்.

Alternatively you can configure how @babel/register is run through the environment variables for [@babel/register](https://babeljs.io/docs/babel-register#environment-variables).
