# Session demos

Short `wdio session` demos for a browser, a phone page, a native Android app and an Electron window. The walkthrough, with every command, is [Session demos](https://webdriver.io/docs/session/demos) (`website/docs/session/demos.md`).

From the repository root:

```sh
node examples/session/serve.js browser
node examples/session/serve.js mobile
```

The native boarding pass is an Android app. Build it, with an emulator or a device already running, then open the apk:

```sh
cd examples/session/android
./gradlew assembleDebug
npx wdio session open android --app app/build/outputs/apk/debug/app-debug.apk
```

The launch console is an Electron app. Install and open it from its own directory:

```sh
cd examples/session/desktop
npm install
npx wdio session open electron ./main.js --app-arg=--no-sandbox
```
