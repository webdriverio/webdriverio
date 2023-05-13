---
id: browser
title: பிரௌசர் ஆப்ஜெக்ட்
---

__ Extends:__ [EventEmitter](https://nodejs.org/api/events.html#class-eventemitter)

பிரௌசர் ஆப்ஜெக்ட் என்பது பிரௌசர் அல்லது மொபைல் சாதனத்தைக் கட்டுப்படுத்த நீங்கள் பயன்படுத்தும் செஷன் நிகழ்வாகும். நீங்கள் WDIO டெஸ்ட் ரன்னரைப் பயன்படுத்தினால், குளோபல் ` browser ` அல்லது ` driver ` ஆப்ஜெக்ட் மூலம் WebDriver நிகழ்வை அணுகலாம் அல்லது [`@wdio/globals`](/docs/api/globals)ஐப் பயன்படுத்தி இறக்குமதி செய்யலாம். நீங்கள் தனித்தனி முறையில் WebdriverIO ஐப் பயன்படுத்தினால், பிரௌசர் ஆப்ஜெக்ட் [` remote `](/docs/api/modules#remoteoptions-modifier) முறையில் திருப்பியளிக்கப்படும்.

டெஸ்ட் ரன்னெறால் செஷன் தொடங்கப்படுகிறது. செஷனை முடிப்பதற்கும் இதுவே செல்கிறது. இது டெஸ்ட் ரன்னர் செயல்முறையாலும் செய்யப்படுகிறது.

## Properties

பிரௌசர் ஆப்ஜெக்ட் பின்வரும் பண்புகளைக் கொண்டுள்ளது:

| பெயர்                   | வகை        | விவரங்கள்                                                                                                                                             |
| ----------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `capabilities`          | `Object`   | ரிமோட் சர்வரிலிருந்து ஒதுக்கப்பட்ட திறன்.<br /><b> Example:</b><pre>{<br />  acceptInsecureCerts: false,<br />  browserName: 'chrome',<br />  browserVersion: '105.0.5195.125',<br />  chrome: {<br />    chromedriverVersion: '105.0.5195.52 (412c95e518836d8a7d97250d62b29c2ae6a26a85-refs/branch-heads/5195@{#853})',<br />    userDataDir: '/var/folders/3_/pzc_f56j15vbd9z3r0j050sh0000gn/T/.com.google.Chrome.76HD3S'<br />  },<br />  'goog:chromeOptions': { debuggerAddress: 'localhost:64679' },<br />  networkConnectionEnabled: false,<br />  pageLoadStrategy: 'normal',<br />  platformName: 'mac os x',<br />  proxy: {},<br />  setWindowRect: true,<br />  strictFileInteractability: false,<br />  timeouts: { implicit: 0, pageLoad: 300000, script: 30000 },<br />  unhandledPromptBehavior: 'dismiss and notify',<br />  'webauthn:extension:credBlob': true,<br />  'webauthn:extension:largeBlob': true,<br />  'webauthn:virtualAuthenticators': true<br />}</pre>                                               |
| `requestedCapabilities` | `Object`   | ரிமோட் சர்வரிலிருந்து கேட்கப்பட்ட திறன்கள்.<br /><b> Example:</b><pre>{ browserName: 'chrome' }</pre>                                             |
| `sessionId`             | `String`   | Session id assigned from the remote server.                                                                                                           |
| `options`               | `Object`   | பிரௌசர் ஆப்ஜெக்ட் எவ்வாறு உருவாக்கப்பட்டது என்பதைப் பொறுத்து WebdriverIO [options](/docs/configuration). மேலும் [setup types](/docs/setuptypes)காண்க. |
| `commandList`           | `String[]` | பிரௌசர் நிகழ்வில் பதிவுசெய்யப்பட்ட கட்டளைகளின் பட்டியல்                                                                                               |
| `isMobile`              | `Boolean`  | மொபைல் அமர்வைக் குறிக்கிறது. [Mobile Flags](#mobile-flags)இன் கீழ் மேலும் பார்க்கவும்.                                                                |
| `isIOS`                 | `Boolean`  | மொபைல் அமர்வைக் குறிக்கிறது. [Mobile Flags](#mobile-flags)இன் கீழ் மேலும் பார்க்கவும்.                                                                |
| `isAndroid`             | `Boolean`  | Android அமர்வைக் குறிக்கிறது. [Mobile Flags](#mobile-flags)இன் கீழ் மேலும் பார்க்கவும்.                                                               |

## Methods

உங்கள் அமர்வுக்கு பயன்படுத்தப்படும் ஆட்டோமேஷன் பின்தளத்தின் அடிப்படையில், [browser object](/docs/api/browser)உடன் எந்த [Protocol Commands](/docs/api/protocols) இணைக்கப்படும் என்பதை WebdriverIO அடையாளம் காட்டுகிறது. எடுத்துக்காட்டாக, நீங்கள் Chrome இல் தானியங்கு அமர்வை இயக்கினால், [`elementHover`](/docs/api/chromium#elementhover) போன்ற Chromium குறிப்பிட்ட கட்டளைகளுக்கான அணுகலைப் பெறுவீர்கள், ஆனால் [Appium commands ](/docs/api/appium) க்கு அல்ல.

மேலும் WebdriverIO ஆனது, பக்கத்தில் உள்ள [ browser ](/docs/api/browser) அல்லது [ elements ](/docs/api/element) உடன் தொடர்பு கொள்ள, பயன்படுத்தப் பரிந்துரைக்கப்படும் வசதியான முறைகளின் தொகுப்பை வழங்குகிறது.

கூடுதலாக, பின்வரும் கட்டளைகள் கிடைக்கின்றன:

| பெயர்                | சுட்டீடுகள்(பாராமீட்டர்கள்)                                                                                            | விவரங்கள்                                                                                                                                                                                                                                                      |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `addCommand`         | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`)<br />- `attachToElement` (Type: `boolean`) | கலவை நோக்கங்களுக்காகப் பிரௌசர் ஆப்ஜெக்ட்டினிலிருந்து அழைக்கப்படும் தனிப்பயன் கட்டளைகளை வரையறுக்க அனுமதிக்கிறது. [Custom Command](/docs/customcommands) வழிகாட்டியில் மேலும் படிக்கவும்.                                                                        |
| `overwriteCommand`   | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`)<br />- `attachToElement` (Type: `boolean`) | தனிப்பயன் செயல்பாட்டுடன் எந்த பிரௌசர் கட்டளையையும் மேலெழுத அனுமதிக்கிறது. பிரமேஒர்க் பயன்படுத்துபவர்களைக் குழப்பக்கூடும் என்பதால் கவனமாகப் பயன்படுத்தவும். [Custom Command](/docs/customcommands#overwriting-native-commands) வழிகாட்டியில் மேலும் படிக்கவும். |
| `addLocatorStrategy` | - `strategyName` (Type: `String`)<br />- `fn` (Type: `Function`)                                                 | தனிப்பயன் செலெக்டர் உத்தியை வரையறுக்க அனுமதிக்கிறது, மேலும் [ Selectors ](/docs/selectors#custom-selector-strategies) வழிகாட்டியில் படிக்கவும்.                                                                                                                |

## குறிப்புகள்

### Mobile Flags

உங்கள் அமர்வு மொபைல் சாதனத்தில் இயங்குகிறதா இல்லையா என்பதன் அடிப்படையில் உங்கள் டெஸ்டை மாற்ற வேண்டும் என்றால், சரிபார்க்க மொபைல் flagsகளை அணுகலாம்.

எடுத்துக்காட்டாக, இந்தக் கட்டமைப்பு கொடுக்கப்பட்டுள்ளது:

```js
// wdio.conf.js
export const config = {
    // ...
    capabilities: {
        platformName: 'iOS',
        app: 'net.company.SafariLauncher',
        udid: '123123123123abc',
        deviceName: 'iPhone',
        // ...
    }
    // ...
}
```

உங்கள் டெஸ்டில் இந்தக் flagsகளை நீங்கள் அணுகலாம்:

```js
// Note: `driver` is the equivalent to the `browser` object but semantically more correct
// you can choose which global variable you want to use
console.log(driver.isMobile) // outputs: true
console.log(driver.isIOS) // outputs: true
console.log(driver.isAndroid) // outputs: false
```

எடுத்துக்காட்டாக, உங்கள் [page objects](../pageobjects) இல் உள்ள செலக்டர்ஸுகளை சாதன வகையின் அடிப்படையில் வரையறுக்க விரும்பினால், இது பயனுள்ளதாக இருக்கும்:

```js
// mypageobject.page.js
import Page from './page'

class LoginPage extends Page {
    // ...
    get username() {
        const selectorAndroid = 'new UiSelector().text("Cancel").className("android.widget.Button")'
        const selectorIOS = 'UIATarget.localTarget().frontMostApp().mainWindow().buttons()[0]'
        const selectorType = driver.isAndroid ? 'android' : 'ios'
        const selector = driver.isAndroid ? selectorAndroid : selectorIOS
        return $(`${selectorType}=${selector}`)
    }
    // ...
}
```

குறிப்பிட்ட சாதன வகைகளுக்கான குறிப்பிட்ட டெஸ்டுகளை மட்டும் இயக்க இந்தக் flagsகளைப் பயன்படுத்தலாம்:

```js
// mytest.e2e.js
describe('my test', () => {
    // ...
    // only run test with Android devices
    if (driver.isAndroid) {
        it('tests something only for Android', () => {
            // ...
        })
    }
    // ...
})
```

### Events
பிரவுசர் ஆப்ஜெக்ட் ஒரு EventEmitter மற்றும் உங்கள் பயன்பாட்டு நிகழ்வுகளுக்காக இரண்டு நிகழ்வுகள் வெளியிடப்படும்.

நிகழ்வுகளின் பட்டியல் இங்கே. இது இன்னும் கிடைக்கக்கூடிய நிகழ்வுகளின் முழு பட்டியல் அல்ல என்பதை நினைவில் கொள்ளவும். மேலும் நிகழ்வுகளின் விளக்கங்களை இங்கே சேர்ப்பதன் மூலம் ஆவணத்தைப் புதுப்பிக்கப் பங்களிக்க தயங்க வேண்டாம்.

#### `request.performance`
இது WebDriver நிலை செயல்பாடுகளை அளவிடும் நிகழ்வு. WebdriverIO WebDriver பின்தளத்திற்கு கோரிக்கையை அனுப்பும் போதெல்லாம், இந்த நிகழ்வு சில பயனுள்ள தகவல்களுடன் வெளியிடப்படும்:

- `durationMillisecond`: கோரிக்கையின் கால அளவு மில்லி வினாடியில்.
- `error`: கோரிக்கை தோல்வியுற்றால் Error object.
- ` request `: Request object. நீங்கள் url, method, headers போன்றவற்றைக் காணலாம்.
- `retryCount`: இது `0`எனில், கோரிக்கை முதல் முயற்சி. WebDriverIO தன்னிச்சையாக மீண்டும் முயற்சிக்கும்போது இது அதிகரிக்கும்.
- ` success `: Boolean கோரிக்கை வெற்றியடைந்ததா இல்லையா என்பதைப் பிரதிநிதித்துவப்படுத்தும். அது ` false `என்றால், ` error ` property வழங்கப்படும்.

உதாரண நிகழ்வு:
```js
Object {
  "durationMillisecond": 0.01770925521850586,
  "error": [Error: Timeout],
  "request": Object { ... },
  "retryCount": 0,
  "success": false,
},
```

### Custom Commands

பொதுவாகப் பயன்படுத்தப்படும் பணிப்பாய்வுகளைத் தவிர்க்க, பிரவுசர் ஸ்கோப்பில் தனிப்பயன் கட்டளைகளை அமைக்கலாம். மேலும் தகவலுக்கு [Custom Commands](/docs/customcommands#adding-custom-commands) இல் உள்ள எங்கள் வழிகாட்டியைப் பார்க்கவும்.
