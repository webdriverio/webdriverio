---
id: element
title: The Element Object
---

An Element Object is an object representing an element on the remote user agent, e.g. a [DOM Node](https://developer.mozilla.org/en-US/docs/Web/API/Element) when running a session within a browser or [a mobile element](https://developer.apple.com/documentation/swift/sequence/element) for mobile. これは、多数の要素クエリ コマンドの 1 つを使用して受信できます。たとえば[`$`](/docs/api/element/$), [`custom$`](/docs/api/element/custom$), [`react$`](/docs/api/element/react$) or [`shadow$`](/docs/api/element/shadow$).

## Properties

ブラウザ オブジェクトには次のプロパティがあります。

| Name        | Type     | Details                                                                                                                                 |
| ----------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `sessionId` | `String` | リモートサーバーから割り当てられたセッションID。                                                                                                               |
| `elementId` | `String` | 関連する [プロトコルレベルの要素と相互作用するために使用できる](https://w3c.github.io/webdriver/#elements) ウェブ要素参照                                                    |
| `selector`  | `String` | [セレクタ](/docs/selectors) を使用して要素をクエリします。                                                                                                 |
| `parent`    | `Object` | 要素が it からフェッチされた場合の Browser オブジェクト (例: const elem = browser.$('selector'))、または要素スコープからフェッチされた場合の Element オブジェクト (例: elem.$('selector')) |
| `options`   | `Object` | WebdriverIO [option](/docs/configuration) は、ブラウザ オブジェクトの作成方法に応じて異なります。 もっと見る [セットアップ タイプ](/docs/setuptypes)。                            |

## Methods
An element object provides all methods from the protocol section, e.g. [WebDriver](/docs/api/webdriver) protocol as well as commands listed within the element section. 利用可能なプロトコルコマンドはセッションの種類によって異なります。 自動ブラウザセッションを実行すると、Appium[commands](/docs/api/appium)はいずれも使用できなくなり、その逆も同様です。

これに加えて、次のコマンドも使用できます。

| Name               | Parameters                                                            | Details                                                                                                                                             |
| ------------------ | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `addCommand`       | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`) | 作成目的でブラウザオブジェクトから呼び出すことができるカスタムコマンドを定義できます。 詳細については、 [Custom Command](/docs/customcommands) ガイドを参照してください。                                           |
| `overwriteCommand` | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`) | ブラウザコマンドをカスタム機能で上書きできます。 他の開発者を混乱させる可能性があるため、慎重に使用してください。 詳細については、 [Custom Command](/docs/customcommands#overwriting-native-commands) ガイドを参照してください。 |

## Remarks

### Element Chain

When working with elements WebdriverIO provides special syntax to simplify querying them and composite complex nested element lookups. 要素オブジェクトを使用すると、一般的なクエリメソッドを使用してツリーブランチ内の要素を見つけることができます。ユーザーは以下のようにネストされた要素をフェッチすることができます。

```js
const header = await $('#header')
const headline = await header.$('#headline')
console.log(await headline.getText()) // outputs "I am a headline"
```

深いネストされた構造体で、ネストされた要素を配列に割り当てると、非常に冗長なことができます。 Therefore WebdriverIO has the concept of chained element queries that allow fetching nested elements like this:

```js
console.log(await $('#header').$('#headline').getText())
```

これは要素の集合を取得するときにも機能します。例えば：

```js
// get the text of the 3rd headline within the 2nd header
console.log(await $$('#header')[1].$$('#headline')[2].getText())
```

When working with a set of elements this can be especially useful when trying to interact with them, so instead of doing:

```js
const elems = await $$('div')
const locations = await Promise.all(
    elems.map((el) => el.getLocation())
)
```

要素チェーン上で Array メソッドを直接呼び出すことができます。例えば：

```js
const location = await $$('div').map((el) => el.getLocation())
```

same as:

```js
const divs = await $$('div')
const location = await divs.map((el) => el.getLocation())
```

WebdriverIO uses a custom implementation that supports asynchronous iterators under the hood so all commands from their API are also supported for these use cases.

__Note:__ all async iterators return a promise even if your callback doesn't return one, e.g.:

```ts
const divs = await $$('div')
console.log(divs.map((div) => div.selector)) // ❌ returns "Promise<string>[]"
console.log(await divs.map((div) => div.selector)) // ✅ returns "string[]"
```

### Custom Commands

ブラウザーのスコープにカスタム コマンドを設定して、一般的に使用されるワークフローを抽象化できます。 詳細については、 [ Custom Commands ](/docs/customcommands#adding-custom-commands) に関するガイドを参照してください。
