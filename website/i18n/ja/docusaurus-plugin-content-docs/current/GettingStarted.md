---
id: gettingstarted
title: はじめに
---

WebdriverIO ドキュメントへようこそ。 ここではまずWebdriverIOを始めるための紹介をします。 なにか問題や分からないことがあった場合は、 [Discord サポート ](https://discord.webdriver.io) に問い合わせることで、サポートを受けることができます。 またはWebdriverIOの [X](https://twitter.com/webdriverio) への問い合わせも可能です。

:::info
これらは、WebdriverIO の最新バージョン (__>=8.x__) のドキュメントです。 もしもまだ古いバージョンを使用している場合は、 対象バージョンの[ドキュメント Web サイト](/versions)にアクセスしてください。
:::

<LiteYouTubeEmbed id="rA4IFNyW54c" title="Getting Started with WebdriverIO" />

:::tip公式YouTubeチャンネル🎥

WebdriverIO に関する動画をお探しの場合は[公式チャンネル](https://youtube.com/@webdriverio)で見つけることができます。 チャンネル登録をお願いします！

:::

## WebdriverIOのセットアップを開始する

[WebdriverIO Starter Toolkit](https://www.npmjs.com/package/create-wdio)を使用して WebdriverIOのセットアップを既存または新しいプロジェクトに追加するには、次のコマンドを実行します。

既存のプロジェクトのルートディレクトリにいる場合は、下記のコマンドを実行します。

<Tabs
  defaultValue="npm"
  values={[
    {label: 'NPM', value: 'npm'},
 {label: 'Yarn', value: 'yarn'},
 {label: 'pnpm', value: 'pnpm'},
 ]
}>
<TabItem value="npm">

```sh
npm init wdio .
```

or if you want to create a new project:

```sh
npm init wdio ./path/to/new/project
```

</TabItem>
<TabItem value="yarn">

```sh
yarn create wdio .
```

or if you want to create a new project:

```sh
yarn create wdio ./path/to/new/project
```

</TabItem>
<TabItem value="pnpm">

```sh
pnpm create wdio .
```

or if you want to create a new project:

```sh
pnpm create wdio ./path/to/new/project
```

</TabItem>
</Tabs>

このコマンドひとつで、WebdriverIO CLI がダウンロードされ、設定ウィザードが実行されます。

<CreateProjectAnimation />

設定ウィザードは、セットアップをガイドする一連の質問を行います `--yes` パラメータを渡すと、 [Page Object](https://martinfowler.com/bliki/PageObject.html) パターンを使用して Chrome で Mocha を使用するデフォルトの設定を選択できます。

<Tabs
  defaultValue="npm"
  values={[
    {label: 'NPM', value: 'npm'},
 {label: 'Yarn', value: 'yarn'},
 {label: 'pnpm', value: 'pnpm'},
 ]
}>
<TabItem value="npm">

```sh
npm init wdio . -- --yes
```

</TabItem>
<TabItem value="yarn">

```sh
yarn create wdio . --yes
```

</TabItem>
<TabItem value="pnpm">

```sh
pnpm create wdio . --yes
```

</TabItem>
</Tabs>

## CLI を手動でインストールする

下記の方法で CLI パッケージをプロジェクトに手動で追加することもできます。

```sh
npm i --save-dev @wdio/cli
npx wdio --version # prints e.g. `8.13.10`

# run configuration wizard
npx wdio config
```

## 実行する

`run` コマンドを使用し、作成したばかりの WebdriverIO のconfig ファイルを指定することで、テスト スイートを開始できます。

```sh
npx wdio run ./wdio.conf.js
```

特定のテストファイルを実行したい場合は、 `--spec` パラメータをつけることで可能です。

```sh
npx wdio run ./wdio.conf.js --spec example.e2e.js
```

または、configファイルでテストスイートを定義し、テストスイート内で定義されたテストファイルのみを実行できます。

```sh
npx wdio run ./wdio.conf.js --suite exampleSuiteName
```

## スクリプトで実行する

WebdriverIOをNode.JSの[Standalone mode](/docs/setuptypes#standalone-mode)でオートメーション・エンジンとして使用したい場合は、WebdriverIOを直接インストールしてパッケージとして使用することもできます。例えば、例えばWeb サイトのスクリーンショットを生成するには

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/fc362f2f8dd823d294b9bb5f92bd5991339d4591/getting-started/run-in-script.js#L2-L19
```

__注意:__ すべての WebdriverIO コマンドは非同期であり、 [`async/await`](https://javascript.info/async-await)を使用して適切に処理する必要があります。

## テスト内容を記録する

WebdriverIO は、画面上でテスト アクションを記録し、WebdriverIO テスト スクリプトを自動的に生成することで開始を支援するツールを提供します。 詳細については、 [Chrome DevTools Recorder を使用したRecorder テスト](/docs/record)を参照してください。

## システム要件

[Node.js](http://nodejs.org) がインストールされている必要があります。

- すくなくとも現在一番古いLTS であるv16.x 以降をインストールしてください
- LTS リリースもしくはLTS リリースとなるリリースのみが正式にサポートされます。

現在のシステムに Node がインストールされていない場合は、 [NVM](https://github.com/creationix/nvm) または [Volta](https://volta.sh/) などのバージョン管理ツールを利用して、複数のアクティブな Node.js バージョンの管理を支援することをお勧めします。 NVM は一般的な選択肢ですが、Volta も優れた代替手段です。
