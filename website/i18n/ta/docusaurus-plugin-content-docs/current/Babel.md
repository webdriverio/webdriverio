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
                node: '14'
            }
        }]
    ]
}
```

இதை அமைத்தவுடன் WebdriverIO மீதமுள்ளவற்றை கவனித்துக் கொள்ளும்.

Alternatively you can configure how @babel/register is run through the environment variables for [@babel/register](https://babeljs.io/docs/babel-register#environment-variables) or using wdio config's [autoCompileOpts section](configurationfile#autoCompileOpts).
