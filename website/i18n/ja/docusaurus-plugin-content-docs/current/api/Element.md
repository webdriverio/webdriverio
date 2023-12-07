---
id: element
title: The Element Object
---

要素オブジェクトは、リモート ユーザー エージェント上の要素を表すオブジェクトです。ブラウザ内でセッションを実行する場合の DOM ノード、またはモバイルのモバイル要素。例えばブラウザ内でセッションを実行する場合の [DOM ノード](https://developer.mozilla.org/en-US/docs/Web/API/Element)、または [モバイル用のモバイル要素](https: //developer.apple.com/documentation/swift/sequence/element)。 これは、多数の要素クエリ コマンドの 1 つを使用して受信できます。たとえば[`$`](/docs/api/element/$), [`custom$`](/docs/api/element/custom$), [`react$`](/docs/api/element/react$) or [`shadow$`](/docs/api/element/shadow$).

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

要素オブジェクトは、例えば、 [WebDriver](/docs/api/webdriver) プロトコルや要素セクション内にリストされているコマンドなど、プロトコルセクションからすべてのメソッドを提供します。 利用可能なプロトコルコマンドはセッションの種類によって異なります。 自動ブラウザセッションを実行すると、Appium[commands](/docs/api/appium)はいずれも使用できなくなり、その逆も同様です。

これに加えて、次のコマンドも使用できます。

| Name               | Parameters                                                            | Details                                                                                                                                             |
| ------------------ | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `addCommand`       | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`) | 作成目的でブラウザオブジェクトから呼び出すことができるカスタムコマンドを定義できます。 詳細については、 [Custom Command](/docs/customcommands) ガイドを参照してください。                                           |
| `overwriteCommand` | - `commandName` (Type: `String`)<br />- `fn` (Type: `Function`) | ブラウザコマンドをカスタム機能で上書きできます。 他の開発者を混乱させる可能性があるため、慎重に使用してください。 詳細については、 [Custom Command](/docs/customcommands#overwriting-native-commands) ガイドを参照してください。 |

## Remarks

### Element Chain

要素を扱う場合、WebdriverIOはクエリを簡素化し、複雑なネストされた要素を探すための特別な構文を提供します。 要素オブジェクトを使用すると、一般的なクエリメソッドを使用してツリーブランチ内の要素を見つけることができます。ユーザーは以下のようにネストされた要素をフェッチすることができます。

```js
const header = await $('#header')
const headline = await header.$('#headline')
console.log(await headline.getText()) // outputs "I am a headline"
```

深いネストされた構造体で、ネストされた要素を配列に割り当てると、非常に冗長なことができます。 そのため、WebdriverIOには、ネストされた要素を以下のようにフェッチできるようにする要素クエリがチェーン化されています。

```js
console.log(await $('#header').$('#headline').getText())
```

これは要素の集合を取得するときにも機能します。例えば：

```js
// get the text of the 3rd headline within the 2nd header
console.log(await $$('#header')[1].$$('#headline')[2].getText())
```

一連の要素を扱う場合、これは特にそれらとやり取りしようとするときに役立ちますので、以下のようにします:

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

WebdriverIOは、内部で非同期反復処理をサポートするカスタム実装を使用するため、APIからのすべてのコマンドもこれらのユースケースでサポートされます。

### Custom Commands

ブラウザーのスコープにカスタム コマンドを設定して、一般的に使用されるワークフローを抽象化できます。 詳細については、 [ Custom Commands ](/docs/customcommands#adding-custom-commands) に関するガイドを参照してください。
