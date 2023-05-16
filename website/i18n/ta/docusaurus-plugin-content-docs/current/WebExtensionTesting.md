---
id: web-extension-testing
title: வெப் எக்ஸ்டென்ஷன் டெஸ்டிங்
---

WebdriverIO என்பது பிரௌசரைத் தானியக்கமாக்குவதற்கான சிறந்த கருவியாகும். வெப் எக்ஸ்ட்டென்ஷன் பிரௌசரின் ஒரு பகுதியாகும், அதே வழியில் தானியங்குபடுத்தப்படலாம். வலைத்தளங்களில் ஜாவாஸ்கிரிப்டை இயக்க உங்கள் வெப் எக்ஸ்ட்டென்ஷன் உள்ளடக்க ஸ்கிரிப்ட்களைப் பயன்படுத்தும்போதோ அல்லது பாப்அப் மாதிரியை வழங்கும்போதோ, WebdriverIO ஐப் பயன்படுத்தி நீங்கள் e2e சோதனையை இயக்கலாம்.

## பிரௌசரில் வெப் எக்ஸ்ட்டென்ஷனை ஏற்றுதல்

முதல் படியாக, எக்ஸ்ட்டென்ஷனை அமர்வின் ஒரு பகுதியாகப் பிரௌசரில் ஏற்ற வேண்டும். இது Chrome மற்றும் Firefox க்கு வித்தியாசமாக வேலை செய்கிறது.

:::info

இந்த ஆவணங்கள் சஃபாரி வெப் எக்ஸ்ட்டென்ஷனை விட்டுவிடுகின்றன, ஏனெனில் அவற்றின் ஆதரவு மிகவும் பின்தங்கியிருக்கிறது மற்றும் பயனர் தேவை அதிகமாக இல்லை. நீங்கள் Safari க்காக ஒரு வெப் எக்ஸ்ட்டென்ஷனை உருவாக்குகிறீர்கள் என்றால், தயவுசெய்து [raise an issue](https://github.com/webdriverio/webdriverio/issues/new?assignees=&labels=Docs+%F0%9F%93%96%2CNeeds+Triaging+%E2%8F%B3&template=documentation.yml&title=%5B%F0%9F%93%96+Docs%5D%3A+%3Ctitle%3E), அதையும் இங்கே சேர்ப்பதில் ஒத்துழைக்கவும்.

:::

### Chrome

Chrome இல் வெப் எக்ஸ்ட்டென்ஷனை ஏற்றுவது `crx` பைலின் `base64` குறியிடப்பட்ட ஸ்ட்ரிங்கை வழங்குவதன் மூலம் அல்லது வெப் எக்ஸ்ட்டென்ஷன் போல்டருக்கு ஒரு பாத்தை வழங்குவதன் மூலம் செய்யப்படலாம். உங்கள் Chrome கேப்பபிலிட்டிசுகளை பின்வருமாறு வரையறுப்பதன் மூலம் பிந்தையதைச் செய்வது மிகவும் எளிதானது:

```js wdio.conf.js
import path from 'node:path'
import url from 'node:url'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

export const config = {
    // ...
    capabilities: [{
        browserName,
        'goog:chromeOptions': {
            // given your wdio.conf.js is in the root directory and your compiled
            // web extension files are located in the `./dist` folder
            args: [`--load-extension=${path.join(__dirname, '..', '..', 'dist')}`]
        }
    }]
}
```

:::info

நீங்கள் Chrome ஐ விட வேறு பிரௌசரை தானியக்கமாக்கினால், எ.கா. பிரேவ், எட்ஜ் அல்லது ஓபரா, பிரௌசர் விருப்பம் மேலே உள்ள உதாரணத்துடன் பொருந்தக்கூடிய வாய்ப்புகள் உள்ளன, வேறு கேப்பபிலிட்டி பெயரைப் பயன்படுத்தினால், எ.கா. `ms:edgeOptions`.

:::

எ.கா. [crx](https://www.npmjs.com/package/crx) NPM தொகுப்பைப் பயன்படுத்தி உங்கள் எக்ஸ்டென்ஷனை `.crx` பைலாகத் தொகுத்தால், தொகுக்கப்பட்ட எக்ஸ்டென்ஷனை பின்வரும் வழிகளிலும் செலுத்தலாம்:

```js wdio.conf.js
import path from 'node:path'
import url from 'node:url'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
const extPath = path.join(__dirname, `web-extension-chrome.crx`)
const chromeExtension = (await fs.readFile(extPath)).toString('base64')

export const config = {
    // ...
    capabilities: [{
        browserName,
        'goog:chromeOptions': {
            extensions: [chromeExtension]
        }
    }]
}
```

### Firefox

எக்ஸ்டென்ஷன்களை உள்ளடக்கிய பயர்பாக்ஸ் ப்ரொபைலை உருவாக்க, அதற்கேற்ப உங்கள் அமர்வை அமைக்க [Firefox Profile Service](/docs/firefox-profile-service) யைப்பயன்படுத்தலாம். இருப்பினும், நுழைவு சிக்கல்கள் காரணமாக உங்கள் லோக்கல் டெவெலப்ட் எக்ஸ்ட்டென்ஷனை ஏற்ற முடியாத சிக்கல்களை நீங்கள் சந்திக்க நேரிடலாம். இதில், [`installAddOn`](/docs/api/gecko#installaddon) கட்டளை வழியாக</code>before``இல் எக்ஸ்டென்ஷனை ஏற்றலாம், எ.கா.:</p>

<pre><code class="js wdio.conf.js">import path from 'node:path'
import url from 'node:url'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
const extensionPath = path.resolve(__dirname, `web-extension.xpi`)

export const config = {
    // ...
    before: async (capabilities) => {
        const browserName = (capabilities as Capabilities.Capabilities).browserName
        if (browserName === 'firefox') {
            const extension = await fs.readFile(extensionPath)
            await browser.installAddOn(extension.toString('base64'), true)
        }
    }
}
``</pre>

`.xpi` பைலை உருவாக்க, [`web-ext`](https://www.npmjs.com/package/web-ext) NPM தொகுப்பைப் பயன்படுத்தப் பரிந்துரைக்கப்படுகிறது. பின்வரும் எடுத்துக்காட்டு கட்டளையைப் பயன்படுத்தி உங்கள் எக்ஸ்டென்ஷனை நீங்கள் தொகுக்கலாம்:

```sh
npx web-ext build -s dist/ -a . -n web-extension-firefox.xpi
```
