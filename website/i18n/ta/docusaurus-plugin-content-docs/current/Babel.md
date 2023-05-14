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

மாற்றாக, [@babel/register](babel) க்கான என்விரான்மெண்ட் வேறியபல்ஸுகள் மூலம் @babel/register எப்படி இயக்கப்படுகிறது அல்லது wdio config இன் [autoCompileOpts section](configurationfile) ஐப் பயன்படுத்தி நீங்கள் கட்டமைக்கலாம்.
