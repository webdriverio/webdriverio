---
id: browser
title: The Browser Object
---

__Extends:__ [EventEmitter](https://nodejs.org/api/events.html#class-eventemitter)

Browser Objectは、ブラウザまたはモバイル デバイスを制御するために使用するsession instanceです。 WDIO テストランナーを使用する場合は、グローバル `browser` または `driver` オブジェクトを通じてWebDriver インスタンスにアクセスするか、 [`@wdio/globals`](/docs/api/globals)を使用してインポートできます。 WebdriverIO を standalone mode で使用する場合、ブラウザ オブジェクトは [`remote`](/docs/api/modules#remoteoptions-modifier) メソッドによって返されます。

セッションはテストランナーによって初期化されます。 同じようにセッションを終了する場合もテストランナーによって行われます これはテストランナープロセスによって行われます。

## プロパティ

ブラウザ オブジェクトには次のプロパティがあります。

| Name                    | Type       | Details                                                                                                      |
| ----------------------- | ---------- | ------------------------------------------------------------------------------------------------------------ |
| `capabilities`          | `Object`   | リモートサーバーから割り当てられた機能。<br /><b>例:</b><pre>{<br />  acceptInsecureCerts: false,<br />  browserName: 'chrome',<br />  browserVersion: '105.0.5195.125',<br />  chrome: {<br />    chromedriverVersion: '105.0.5195.52 (412c95e518836d8a7d97250d62b29c2ae6a26a85-refs/branch-heads/5195@{#853})',<br />    userDataDir: '/var/folders/3_/pzc_f56j15vbd9z3r0j050sh0000gn/T/.com.google.Chrome.76HD3S'<br />  },<br />  'goog:chromeOptions': { debuggerAddress: 'localhost:64679' },<br />  networkConnectionEnabled: false,<br />  pageLoadStrategy: 'normal',<br />  platformName: 'mac os x',<br />  proxy: {},<br />  setWindowRect: true,<br />  strictFileInteractability: false,<br />  timeouts: { implicit: 0, pageLoad: 300000, script: 30000 },<br />  unhandledPromptBehavior: 'dismiss and notify',<br />  'webauthn:extension:credBlob': true,<br />  'webauthn:extension:largeBlob': true,<br />  'webauthn:virtualAuthenticators': true<br />}</pre>                           |
| `requestedCapabilities` | `Object`   | リモートサーバーから割り当てられた機能。<br /><b>例:</b><pre>{ browserName: 'chrome' }</pre>                           |
| `sessionId`             | `String`   | リモートサーバーから割り当てられたセッションID。                                                                                    |
| `options`               | `Object`   | WebdriverIO [option](/docs/configuration) は、ブラウザ オブジェクトの作成方法に応じて異なります。 もっと見る [セットアップ タイプ](/docs/setuptypes)。 |
| `commandList`           | `String[]` | ブラウザインスタンスに登録されているコマンドのリスト                                                                                   |
| `isMobile`              | `Boolean`  | mobile sessionの有無 [Mobile Flags](#mobile-flags)で詳細を参照してください。                                                 |
| `isIOS`                 | `Boolean`  | iOS sessionの有無 [Mobile Flags](#mobile-flags)で詳細を参照してください。                                                    |
| `isAndroid`             | `Boolean`  | Android sessionの有無 [Mobile Flags](#mobile-flags)で詳細を参照してください。                                                |

## Methods

セッションに使用されるオートメーション バックエンドに基づいて、WebdriverIO の [Protocol Commands](/docs/api/protocols) はどの[browser object](/docs/api/browser)にアタッチされるかを識別します。 例えば、Chrome で自動セッションを実行する場合など [`elementHover`](/docs/api/chromium#elementhover) のような Chromium 固有のコマンドにアクセスできますが、 [Appium コマンド](/docs/api/appium) のいずれにもアクセスできません。

さらに、WebdriverIO は、ページ上の [ browser ](/docs/api/browser) または [ elements ](/docs/api/element) と対話するために使用することが推奨される一連の便利なメソッドを提供します。

これに加えて、次のコマンドも使用できます。

| Name                 | Parameters                                                                                                             | Details                                                                                                                                             |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `addCommand`         | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`)<br />- `attachToElement` (Type: `boolean`) | 作成目的でブラウザオブジェクトから呼び出すことができるカスタムコマンドを定義できます。 詳細については、 [Custom Command](/docs/customcommands) ガイドを参照してください。                                           |
| `overwriteCommand`   | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`)<br />- `attachToElement` (Type: `boolean`) | ブラウザコマンドをカスタム機能で上書きできます。 他の開発者を混乱させる可能性があるため、慎重に使用してください。 詳細については、 [Custom Command](/docs/customcommands#overwriting-native-commands) ガイドを参照してください。 |
| `addLocatorStrategy` | - `strategyName` (Type: `String`)<br />- `fn` (Type: `Function`)                                                 | カスタム セレクター戦略を定義できます。詳細については、 [ Selectors ](/docs/selectors#custom-selector-strategies) ガイドを参照してください。                                                |

## 備考

### Mobile Flags

セッションがモバイル デバイスで実行されるかどうかに基づいてテストを変更する必要がある場合は、モバイル フラグにアクセスして確認できます。

たとえば、次の構成の場合:

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

次のようにテストでこれらのフラグにアクセスできます。

```js
// Note: `driver` is the equivalent to the `browser` object but semantically more correct
// you can choose which global variable you want to use
console.log(driver.isMobile) // outputs: true
console.log(driver.isIOS) // outputs: true
console.log(driver.isAndroid) // outputs: false
```

これは、たとえば、次のようにデバイス タイプに基づいて [page objects](../pageobjects) にセレクターを定義する場合に便利です。

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

これらのフラグを使用して、特定のデバイス タイプに対して特定のテストのみを実行することもできます。

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
ブラウザー オブジェクトは EventEmitter であり、ユースケースに応じていくつかのイベントが発行されます。

イベントの一覧はこちらです。 これらは利用可能なイベントのすべてのリストではないことに注意してください。 ここにさらにイベントの説明を追加して、ドキュメントの更新に自由に貢献してください。

#### `request.performance`
WebDriverレベルの動作を計測するイベントです。 WebdriverIO が WebDriver バックエンドにリクエストを送信するたびに、イベントがいくつかの下記のような有用な情報とともに発行されます。

- `durationMillisecond`: Time duration of the request in millisecond.
- ` error `: リクエストが失敗した場合のエラー オブジェクト。
- ` request `: リクエストオブジェクト。 URL、メソッド、ヘッダーなどを確認することができます。
- `retryCount`: `0`の場合、リクエストは最初の実行 WebDriverIO が内部で再試行するたびに増加していきます
- `success`: リクエストが成功したかどうかを表すBoolean `false`、 `error` の場合はプロパティも提供されます。

イベントの例:
```js
Object {
  "durationMillisecond": 0.01770925521850586,
  "error": [Error: Timeout],
  "request": Object { ... },
  "retryCount": 0,
  "success": false,
},
```

### カスタムコマンド

ブラウザーのスコープにカスタム コマンドを設定して、一般的に使用されるワークフローを抽象化できます。 詳細については、 [ Custom Commands ](/docs/customcommands#adding-custom-commands) に関するガイドを参照してください。
