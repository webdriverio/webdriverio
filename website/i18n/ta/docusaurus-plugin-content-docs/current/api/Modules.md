---
id: modules
title: மாடூல்ஸ்
---

உங்கள் சொந்த ஆட்டோமேஷன் பிரேம்வர்க்கை உருவாக்க நீங்கள் பயன்படுத்தக்கூடிய NPM மற்றும் பிற பதிவுகளுக்குப் மாடூல்சுகளை WebdriverIO வெளியிடுகிறது. WebdriverIO அமைவு வகைகள்பற்றிய கூடுதல் ஆவணங்களை [here](/docs/setuptypes) பார்க்கவும்.

## `webdriver` மற்றும் `devtools`

நெறிமுறை தொகுப்புகள் ([`webdriver`](https://www.npmjs.com/package/webdriver) மற்றும் [`devtools`](https://www.npmjs.com/package/devtools)) அமர்வுகளைத் தொடங்க பின்வரும் ஸ்டாடிக் செயல்பாடுகளுடன் ஒரு கிளாசை வெளிப்படுத்துகிறது:

#### `newSession(options, modifier, userPrototype, customCommandWrapper)`

குறிப்பிட்ட கேப்பபிலிட்டிசுகளுடன் புதிய அமர்வைத் தொடங்கும். அமர்வின் அடிப்படையில் வெவ்வேறு நெறிமுறைகளிலிருந்து ரெஸ்பான்ஸ் கட்டளைகள் வழங்கப்படும்.

##### பாராமீட்டர்கள்

- `options`: [WebDriver options](/docs/configuration#webdriver-options)
- `modifier`: கிளையன்ட் நிகழ்வைத் திரும்பப் பெறுவதற்கு முன் அதை மாற்ற அனுமதிக்கும் செயல்பாடு
- `userPrototype`: நிகழ்வு முன்மாதிரியை நீட்டிக்க அனுமதிக்கும் ப்ராபர்ட்டி ஆப்ஜெக்ட்
- `customCommandWrapper`: செயல்பாடு அழைப்புகளைச் சுற்றி செயல்பாட்டை ராப் செய்ய உதவும் செயல்பாடு

##### Returns

- [பிரௌசர்](/docs/api/browser) ஆப்ஜெக்ட்

##### எடுத்துக்காட்டு

```js
const client = await WebDriver.newSession({
    capabilities: { browserName: 'chrome' }
})
```

#### `attachSession(attachInstance, modifier, userPrototype, customCommandWrapper)`

இயங்கும் WebDriver அல்லது DevTools அமர்வுடன் இணைக்கப்பட்டுள்ளது.

##### பாராமீட்டர்கள்

- `attachInstance`: `sessionId` (எ.கா. `{ sessionId: 'xxx' }`) உடன் ஒரு அமர்வை இணைப்பதற்கான நிகழ்வு அல்லது குறைந்தபட்சம் ஒரு ப்ராபர்ட்டியுடன் அமைந்த ஒரு ஆப்ஜெக்ட்
- `modifier`: கிளையன்ட் நிகழ்வைத் திரும்பப் பெறுவதற்கு முன் அதை மாற்ற அனுமதிக்கும் செயல்பாடு
- `userPrototype`: நிகழ்வு முன்மாதிரியை நீட்டிக்க அனுமதிக்கும் ப்ராபர்ட்டி ஆப்ஜெக்ட்
- `customCommandWrapper`: செயல்பாடு அழைப்புகளைச் சுற்றி செயல்பாட்டை ராப் செய்ய உதவும் செயல்பாடு

##### Returns

- [Browser](/docs/api/browser) object

##### எடுத்துக்காட்டு

```js
const client = await WebDriver.newSession({...})
const clonedClient = await WebDriver.attachSession(client)
```

#### `reloadSession(instance)`

அமர்வை வழங்கினால் நிகழ்வை மீண்டும் ரீலோடு செய்கிறது.

##### பாராமீட்டர்கள்

- `நிகழ்வு`: மீண்டும் ரீலோடு செய்வதற்கான தொகுப்பு நிகழ்வு

##### எடுத்துக்காட்டு

```js
const client = await WebDriver.newSession({...})
await WebDriver.reloadSession(client)
```

## `webdriverio`

நெறிமுறை தொகுப்புகளைப் போலவே (`webdriver` மற்றும் `devtools`) நீங்கள் அமர்வுகளை நிர்வகிக்க WebdriverIO தொகுப்பு API களையும் பயன்படுத்தலாம். `import { remote, attach, multiremote } from 'webdriverio` யைப் பயன்படுத்தி APIகளை இறக்குமதி செய்யலாம் மற்றும் பின்வரும் செயல்பாடுகள் உள்ளன:

#### `remote(options, modifier)`

WebdriverIO அமர்வைத் தொடங்குகிறது. இந்த நிகழ்வு அனைத்து கட்டளைகளையும் நெறிமுறை தொகுப்பாகக் கொண்டுள்ளது ஆனால் கூடுதல் உயர் வரிசை செயல்பாடுகளுடன், [API docs](/docs/api)பார்க்கவும்.

##### பாராமீட்டர்கள்

- `options`: [WebdriverIO Options](/docs/configuration#webdriverio)
- `modifier`: கிளையன்ட் நிகழ்வைத் திரும்பப் பெறுவதற்கு முன் அதை மாற்ற அனுமதிக்கும் செயல்பாடு

##### Returns

- [பிரௌசர்](/docs/api/browser) ஆப்ஜெக்ட்

##### எடுத்துக்காட்டு

```js
import { remote } from 'webdriverio'

const browser = await remote({
    capabilities: { browserName: 'chrome' }
})
```

#### `attach(attachOptions)`

இயங்கும் WebdriverIO அமர்வுடன் இணைக்கப்பட்டுள்ளது.

##### பாராமீட்டர்கள்

- `attachOptions`: `sessionId` (எ.கா. `{ sessionId: 'xxx' }`) உடன் ஒரு அமர்வை இணைப்பதற்கான நிகழ்வு அல்லது குறைந்தபட்சம் ஒரு ப்ராபர்ட்டியுடன் அமைந்த ஒரு ஆப்ஜெக்ட்

##### Returns

- [பிரௌசர்](/docs/api/browser) ஆப்ஜெக்ட்

##### எடுத்துக்காட்டு

```js
import { remote, attach } from 'webdriverio'

const browser = await remote({...})
const newBrowser = await attach(browser)
```

#### `multiremote(multiremoteOptions)`

ஒரே நிகழ்வில் பல அமர்வைக் கட்டுப்படுத்த உங்களை அனுமதிக்கும் மல்டிரிமோட் நிகழ்வைத் தொடங்குகிறது. உறுதியான பயன்பாட்டு நிகழ்வுகளுக்கு எங்கள் [multiremote examples](https://github.com/webdriverio/webdriverio/tree/main/examples/multiremote) ஐப் பார்க்கவும்.

##### பாராமீட்டர்கள்

- `multiremoteOptions`: பிரௌசரின் பெயர் மற்றும் அவற்றின் [WebdriverIO Options](/docs/configuration#webdriverio)ஆகியவற்றைக் குறிக்கும் கீஸ்களைக் கொண்ட ஒரு ஆப்ஜெக்ட்.

##### Returns

- [பிரௌசர்](/docs/api/browser) ஆப்ஜெக்ட்

##### எடுத்துக்காட்டு

```js
import { multiremote } from 'webdriverio'

const matrix = await multiremote({
    myChromeBrowser: {
        capabilities: { browserName: 'chrome' }
    },
    myFirefoxBrowser: {
        capabilities: { browserName: 'firefox' }
    }
})
await matrix.url('http://json.org')
await matrix.getInstance('browserA').url('https://google.com')

console.log(await matrix.getTitle())
// returns ['Google', 'JSON']
```

## `@wdio/cli`

`wdio` கட்டளையை அழைப்பதற்குப் பதிலாக, நீங்கள் டெஸ்ட் ரன்னரரை மாடூலாகச் சேர்த்து, தன்னிச்சையான என்விரான்மென்டில் அதை இயக்கலாம். அதற்கு, நீங்கள் `@wdio/cli` தொகுப்பைத் மாடூலாகத் தேவைபடும், இது போன்று:

<Tabs
  defaultValue="esm"
  values={[
    {label: 'EcmaScript Modules', value: 'esm'},
 {label: 'CommonJS', value: 'cjs'}
 ]
}>
<TabItem value="esm">

```js
import Launcher from '@wdio/cli'
```

</TabItem>
<TabItem value="cjs">

```js
const Launcher = require('@wdio/cli').default
```

</TabItem>
</Tabs>

அதன் பிறகு, துவக்கியின் நிகழ்வை உருவாக்கி, டெஸ்டை இயக்கவும்.

#### `Launcher(configPath, opts)`

`Launcher` கிளாஸ் கன்ஸ்ட்ரக்டர் URL ஐ config கோப்பில் எதிர்பார்க்கிறது, மேலும் `opts` ஆப்ஜெக்ட் அமைப்புகளுடன் configல் உள்ளவற்றை மேலெழுதும்.

##### பாராமீட்டர்கள்

- `configPath`: `wdio.conf.js` இயக்குவதற்கான பாதை
- `opts`: config பைலிலிருந்து வேல்யூக்களை மேலெழுத ஆர்குமென்டுகள் ([`<RunCommandArguments>`](https://github.com/webdriverio/webdriverio/blob/main/packages/wdio-cli/src/types.ts#L51-L77))

##### எடுத்துக்காட்டு

```js
const wdio = new Launcher(
    '/path/to/my/wdio.conf.js',
    { spec: '/path/to/a/single/spec.e2e.js' }
)

wdio.run().then((exitCode) => {
    process.exit(exitCode)
}, (error) => {
    console.error('Launcher failed to start the test', error.stacktrace)
    process.exit(1)
})
```

`run` கட்டளை [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) யை வழங்குகிறது. டெஸ்டுகள் வெற்றிகரமாக நடந்தாலோ அல்லது தோல்வியடைந்தாலோ அது தீர்க்கப்படும், மேலும் லாஞ்சரால் டெஸ்டுகளை இயக்க முடியவில்லை என்றால் அது நிராகரிக்கப்படும்.

## `@wdio/browser-runner`

WebdriverIO இன் [browser runner](/docs/runner#browser-runner) யைப் பயன்படுத்தி யூனிட் அல்லது காம்போனென்ட் டெஸ்டுகளை இயக்கும்போது, உங்கள் டெஸ்டுகளுக்கான மாக் செய்யும் பயன்பாடுகளை நீங்கள் இறக்குமதி செய்யலாம், எ.கா.:

```ts
import { fn, spyOn, mock, unmock } from '@wdio/browser-runner'
```

பின்வரும் பெயரிடப்பட்ட ஏற்றுமதிகள் கிடைக்கின்றன:

#### `fn`

மாக் செயல்பாடு, அதிகாரப்பூர்வ [Vitest docs](https://vitest.dev/api/mock.html#mock-functions)இல் மேலும் பார்க்கவும்.

#### `spyOn`

ஸ்பை செயல்பாடு, அதிகாரப்பூர்வ [Vitest docs](https://vitest.dev/api/mock.html#mock-functions)இல் மேலும் பார்க்கவும்.

#### `mock`

பைல் அல்லது சார்பு மாடூளை மாக்காக்கும் முறை.

##### பாராமீட்டர்கள்

- `moduleName`: மாக் செய்யப்பட வேண்டிய பைலிற்கான தொடர்புடைய பாதை அல்லது மாடூலின் பெயர்.
- `factory`: மாக் செய்யப்பட்ட வேல்யூவை வழங்கும் செயல்பாடு (optional)

##### எடுத்துக்காட்டு

```js
mock('../src/constants.ts', () => ({
    SOME_DEFAULT: 'mocked out'
}))

mock('lodash', (origModuleFactory) => {
    const origModule = await origModuleFactory()
    return {
        ...origModule,
        pick: fn()
    }
})
```

#### `unmock`

மேனுவல் மாக் (`__mocks__`) டைரக்டரியில் வரையறுக்கப்பட்ட அன்மாக் சார்பு.

##### பாராமீட்டர்கள்

- `moduleName`: அன்மாக் செய்ய வேண்டிய மாடூலின் பெயர்.

##### எடுத்துக்காட்டு

```js
unmock('lodash')
```
