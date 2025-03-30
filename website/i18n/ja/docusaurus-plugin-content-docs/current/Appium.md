---
id: appium
title: Appiumのセットアップ
---

WebdriverIOを使用すると、以下のようなWebアプリケーションだけでなく、他のプラットフォームもテストできます。

- 📱iOS、Android、Tizenのモバイルアプリケーション
- 🖥️ macOSまたはWindowsのデスクトップアプリケーション
- 📺 Roku, tvOS, Android TV, Samsung 用テレビアプリ

これらのテストを容易にするために、 [Appium](https://appium.io/) を使用することをお勧めします。 You can get an overview on Appium on their [official documentation page](https://appium.io/docs/en/2.0/intro/).

適切な環境を整えることは一筋縄ではいきません。 幸いなことにAppiumエコシステムには、これを支援する素晴らしいツールがあります。 上記の環境のいずれかを設定するには、以下を実行してください。

```sh
$ npx appium-installer
```

これにより、セットアッププロセスをガイドする [appium-installer](https://github.com/AppiumTestDistribution/appium-installer) ツールキットが開始されます。
