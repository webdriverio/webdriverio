---
id: modules
title: Modules
---

WebdriverIOは、独自の自動化フレームワークを構築するために使用できるさまざまなモジュールをNPMやその他のレジストリに公開します。 WebdriverIO セットアップ タイプの詳細については、[こちら](/docs/setuptypes)をご覧ください。

## `webdriver` and `devtools`

プロトコルパッケージ ([`webdriver`](https://www.npmjs.com/package/webdriver) と [`devtools`](https://www.npmjs.com/package/devtools)) は、セッションを開始することを可能にする以下の静的関数が付いているクラスを公開します。

#### `newSession(options, modifier, userPrototype, customCommandWrapper)`

新しいセッションを特定の機能で開始します。 異なるプロトコルからのセッション応答コマンドに基づいて提供されます。

##### Paramaters

- ` options `: [WebDriver オプション](/docs/configuration#webdriver-options)
- ` modifier`: クライアントインスタンスを返す前に変更できる関数。
- `userPrototype`: インスタンスのプロトタイプを拡張できるプロパティオブジェクト
- `customCommandWrapper`: 関数呼び出しの周りの機能をラップできる関数

##### Returns

- [Browser](/docs/api/browser) object

##### Example

```js
const client = await WebDriver.newSession({
    capabilities: { browserName: 'chrome' }
})
```

#### `attachToSession(attachInstance, modifier, userPrototype, customCommandWrapper)`

実行中の WebDriver または DevTools セッションにアタッチします。

##### Paramaters

- `attachInstance`: セッションをアタッチするインスタンス、または少なくともプロパティ `sessionId` を持つオブジェクト (例: `{ sessionId: 'xxx' }`)
- ` modifier`: クライアントインスタンスを返す前に変更できる関数。
- `userPrototype`: インスタンスのプロトタイプを拡張できるプロパティオブジェクト
- `customCommandWrapper`: 関数呼び出しの周りの機能をラップできる関数

##### Returns

- [Browser](/docs/api/browser) object

##### Example

```js
const client = await WebDriver.newSession({...})
const clonedClient = await WebDriver.attachToSession(client)
```

#### `reloadSession(instance)`

指定されたインスタンスを再読み込みします。

##### Paramaters

- `instance`: package instance to reload

##### Example

```js
const client = await WebDriver.newSession({...})
await WebDriver.reloadSession(client)
```

## `webdriverio`

プロトコルパッケージ(`webdriver` と `devtools`) と同様に、WebdriverIO パッケージ API をセッション管理に使用することもできます。 API は、 `import { remote, attach, multiremote } from 'webdriverio` を使用してインポートし、次の機能を含めることができます。

#### `remote(options, modifier)`

WebdriverIO セッションを開始します。 インスタンスはプロトコルパッケージとしてすべてのコマンドを含んでいますが、追加の高次関数を含んでいます。 [API ドキュメント](/docs/api) を参照してください。

##### Paramaters

- ` options `: [WebdriverIO オプション](/docs/configuration#webdriverio)
- ` modifier`: クライアントインスタンスを返す前に変更できる関数。

##### Returns

- [Browser](/docs/api/browser) object

##### Example

```js
import { remote } from 'webdriverio'

const browser = await remote({
    capabilities: { browserName: 'chrome' }
})
```

#### `attach(attachOptions)`

実行中の WebdriverIO セッションにアタッチします。

##### Paramaters

- `attachInstance`: セッションをアタッチするインスタンス、または少なくともプロパティ `sessionId` を持つオブジェクト (例: `{ sessionId: 'xxx' }`)

##### Returns

- [Browser](/docs/api/browser) object

##### Example

```js
import { remote, attach } from 'webdriverio'

const browser = await remote({...})
const newBrowser = await attach(browser)
```

#### `multiremote(multiremoteOptions)`

1つのインスタンス内で複数のセッションを制御できるマルチリモートインスタンスを開始します。 具体的なユースケースについては、 [マルチリモート例](https://github.com/webdriverio/webdriverio/tree/main/examples/multiremote) をご覧ください。

##### Paramaters

- `multiremoteOptions`: ブラウザー名と [WebdriverIO Options](/docs/configuration#webdriverio) を表すキーを持つオブジェクト。

##### Returns

- [Browser](/docs/api/browser) object

##### Example

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

`wdio` コマンドを呼び出す代わりに、テストランナーをモジュールとして含めて任意の環境で実行することもできます。 そのためには、以下のように、 `@wdio/cli` パッケージをモジュールにする必要があります。

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

その後、ランチャーのインスタンスを作成し、テストを実行します。

#### `Launcher(configPath, opts)`

`Launcher` クラス コンストラクターは、構成ファイルへの URL、および構成内の設定を上書きする設定を持つ `opts` オブジェクトを期待します。

##### Paramaters

- `configPath`: 実行する `wdio.conf.js` へのパス
- `opts`: 構成ファイルの値を上書きする引数 [`<RunCommandArguments>`](https://github.com/webdriverio/webdriverio/blob/main/packages/wdio-cli/src/types.ts#L51-L77)

##### Example

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

`run` コマンドは、 [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) を返します。 テストが正常に実行されたか失敗した場合は解決され、ランチャーがテストを開始できなかった場合は拒否されます。

## `@wdio/browser-runner`

WebdriverIOの [browser runner](/docs/runner#browser-runner) を使用してユニットまたはコンポーネントテストを実行する場合、テスト用のモックユーティリティをインポートすることができます。例えば：

```ts
import { fn, spyOn, mock, unmock } from '@wdio/browser-runner'
```

次の名前付きエクスポートを使用できます。

#### `fn`

モック機能は、公式の [Vitest docs](https://vitest.dev/api/mock.html#mock-functions)を参照してください。

#### `spyOn`

スパイ機能は、公式の [Vitest docs](https://vitest.dev/api/mock.html#mock-functions)を参照してください。

#### `mock`

ファイルまたは依存関係モジュールをモックする方法。

##### Paramaters

- `moduleName`: either a relative path to the file to be mocked or a module name.
- `factory`: function to return the mocked value (optional)

##### Example

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

マニュアルモック(`__mocks__`) ディレクトリ内で定義されているモック依存性を解除します。

##### Paramaters

- `moduleName`: アンモックするモジュールの名前。

##### Example

```js
unmock('lodash')
```
