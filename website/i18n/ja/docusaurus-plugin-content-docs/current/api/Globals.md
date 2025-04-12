---
id: globals
title: Globals
---

テストファイルでは、WebdriverIOはそれぞれのメソッドとオブジェクトをグローバル環境に配置します。 それらを使用するために何もインポートする必要はありません。 ただし、WDIO 構成で明示的なインポートを希望する場合は、`import { browser, $, $$, Expect } from '@wdio/globals'` を実行し、`injectGlobals: false` を設定します。

以下のグローバルオブジェクトが設定されていない場合に設定されます。

- ` browser `: WebdriverIO [ブラウザーオブジェクト](https://webdriver.io/docs/api/browser)
- `driver`: alias to `browser` (used when running mobile tests)
- `multiremotebrowser`: alias to `browser` or `driver` ただし、[Multiremote](/docs/multiremote) セッションに対してのみ設定されます
- `$`: 要素を取得するためのコマンド ( [API ドキュメント](/docs/api/browser/$) の詳細を参照)
- `$$`: 要素をフェッチするためのコマンド ( [API ドキュメント](/docs/api/browser/$$) の詳細を参照)
- `expect`: WebdriverIO のアサーションフレームワーク ( [API ドキュメント](/docs/api/expect-webdriverio) を参照)

__注意:__ WebdriverIO は使用済みフレームワーク (Mocha や Jasmineなど) が環境の起動時にグローバル変数を設定することはできません。
