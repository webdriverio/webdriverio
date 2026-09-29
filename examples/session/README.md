# Native demo app

The [Session targets](https://webdriver.io/docs/session/targets) players drive the [WebdriverIO native demo app](https://github.com/webdriverio/native-demo-app) (Expo, package `com.wdiodemoapp`, activity `com.wdiodemoapp.MainActivity`). This directory does not vendor that app. The notes below are how the recordings were produced from tag `v2.2.0`.

Chrome and Electron share one local Expo web server. Android uses the release apk. The login that succeeds is `alice@webdriver.io` / `supersecret` (the email has to match the app's pattern, and the password has to be at least 8 characters). The success dialog says `Success` / `You are logged in!`. The fingerprint dialog says `You are logged in through Fingerprint!`.

## Web and Electron

Clone the app and start Expo on port 8081. `CI` must be unset or Metro does not reload. `--host lan` is what serves `http://127.0.0.1:8081/` (`--host` only accepts `lan`, `tunnel` or `localhost`).

```sh
git clone --branch v2.2.0 --depth 1 https://github.com/webdriverio/native-demo-app.git
cd native-demo-app
npm install
unset CI
npx expo start --web --port 8081 --host lan
```

Stock `v2.2.0` does not complete this demo on web. Four local edits were applied in that checkout and were not committed back to WebdriverIO:

- `react-native-webview` is a stub on web. The WebView component was changed to render an iframe for `source.uri` (`flex: 1`, `minHeight: 640`) so the Webview tab shows `https://webdriver.io/`.
- `react-native-web`'s `Alert.alert` does nothing. It was pointed at `window.alert` so `wdio session dialog` can see `Success` / `You are logged in!`.
- Dropping a puzzle piece calls `setNativeProps`, which throws on web after the piece is already over the right zone, so the counter never moves. The opacity update now uses `setNativeProps` only when that function exists, and otherwise sets `opacity` on the element whose `aria-label` is the piece id. The drop zone id is the piece id with `drag-` replaced by `drop-`. `updateCounter` has to be `setCounter((value) => value + 1)`. A stale `counter + 1` closes over the first render and stops at one piece.
- A real pointer swipe does not page `react-native-reanimated-carousel` on web: the gesture handler reports velocity 0 and springs back. `src/screens/Swipe.tsx` listens for `pointerup` on `[data-testid=Carousel]` and, when the horizontal travel is at least 48px, calls `ref.current.next()` or `prev()` inside `setTimeout(..., 60)`. Calling `next()` in the `pointerup` handler itself updates the index and then the gesture resets the card.

`swipe` is mobile-only, so Chrome and Electron run this file as `npx wdio session exec swipe-left.js`:

```js
const carousel = await $('[data-testid=Carousel]')
await browser.action('pointer')
    .move({ origin: carousel, x: 150, y: 10 })
    .down()
    .move({ origin: 'pointer', x: -240, y: 0, duration: 400 })
    .up()
    .perform()
await browser.pause(650)
console.log('Swiped the carousel left')
```

`exec` prints that `console.log` line and does not print a `→` code line. Run it twice, then `npx wdio session scroll down --px 1400`. There are two elements labelled `WebdriverIO logo`, so scrolling to that selector fails strict mode. The puzzle commands are `npx wdio session drag "aria/drag-l2" "aria/drop-l2"` and the same shape for `r3`, `r1`, `c1`, `c3`, `r2`, `c2`, `l1`, `l3`.

Chrome:

```sh
npx wdio session open chrome http://127.0.0.1:8081 --headed --viewport 430x900
```

Electron is a separate session so it can stay open beside Chrome. From a directory that depends on `electron` and `@wdio/electron-service`:

```js
import { app, BrowserWindow } from 'electron'

app.commandLine.appendSwitch('no-sandbox')

app.whenReady().then(() => {
    const win = new BrowserWindow({
        width: 480,
        height: 960,
        autoHideMenuBar: true,
        webPreferences: {
            contextIsolation: true
        }
    })
    win.loadURL('http://127.0.0.1:8081/')
})
```

```sh
npx wdio session -s electron open electron ./main.js --app-arg=--no-sandbox
```

The native alert is centered on the screen, not in the page. The recording keeps the Electron window in the middle of the display so the alert is inside the crop. `dialog accept` has to run while that alert is still up (about two seconds). Later, Chromedriver has already closed it and the command prints `No dialog open.`

## Android

The player uses the v2.2.0 release apk (`com.wdiodemoapp` / `com.wdiodemoapp.MainActivity`), not the web shims. The carousel and the puzzle work with `swipe` and `drag`. Enroll one fingerprint on the emulator before opening the session, or the login form does not show the fingerprint button. A pin is required before Android will enroll a fingerprint. While the enrollment UI is waiting for a touch:

```sh
adb -s emulator-5554 emu finger touch 1
```

Install and open, with `--no-reset` so the fingerprint stays enrolled:

```sh
adb install -r android.wdio.native.app.v2.2.0.apk
npx wdio session -s android open android \
    --package com.wdiodemoapp \
    --activity com.wdiodemoapp.MainActivity \
    --no-reset
```

Then: `tap "~Webview"`, `tap "~Login"`, `fill "~input-email" "alice@webdriver.io"`, `fill "~input-password" "supersecret"`, `tap "~button-LOGIN"`, `dialog accept`, `tap "~button-biometric"`, `exec -e "await browser.fingerPrint(1)"`, `dialog accept`, `tap "~Swipe"`, `swipe left`, `swipe left`, `swipe up`, `tap "~Drag"`, and `drag "~drag-…" "~drop-…"` for the nine pieces in tray order.

`browser.fingerPrint(1)` is the Android command behind that `exec`. It calls Appium `mobile: fingerprint`. The id has to be the one enrolled above. iOS would use `browser.touchId` instead.
