---
id: demos
title: Session demos
description: Run three short wdio session demos — a browser postcard, a phone boarding pass and an Electron launch console.
---

Three short sessions, one for each kind of target. Each demo is a small page in this repository. You drive it with a handful of commands, watch one thing change per command, and export the steps as a test.

Run the commands from a checkout of the WebdriverIO repository. The pages live in [`examples/session`](https://github.com/webdriverio/webdriverio/tree/main/examples/session).

## Postcard

The page is a blank card on a desk. The city, the clock and the weather are not buttons. `geolocation`, `emulate` and `mock` change them. You click to stamp the card, to look outside and to send it.

Start the page and leave it running:

```sh
node examples/session/serve.js browser
```

In a second terminal:

```sh
npx wdio session open chrome http://127.0.0.1:4173 --headed --viewport 1100x740
npx wdio session geolocation 35.6762 139.6503
npx wdio session emulate color-scheme dark
npx wdio session reload
npx wdio session wait --text "The lamps are off."
npx wdio session snapshot --interactive
npx wdio session click "aria/Stamp the card"
npx wdio session wait --text "Stamped in Tokyo."
npx wdio session emulate clock 2026-12-31T15:00:00Z
npx wdio session wait --text "Tokyo 00:00"
npx wdio session mock "**/api/weather" --body '{"condition":"snow"}'
npx wdio session click "aria/Look outside"
npx wdio session wait --text "Snow over Tokyo."
npx wdio session fill "aria/Message" "Wish you were here"
npx wdio session click "aria/Send the card"
npx wdio session wait --text "Sent."
npx wdio session diff
npx wdio session export --out test/specs/postcard.e2e.ts
npx wdio session close
```

Drop `--headed` to run the same steps without a window. `geolocation` and `emulate color-scheme` apply on the next load, which is why `reload` comes before the stamp. `2026-12-31T15:00:00Z` is midnight in Tokyo. The page asks `GET /api/weather`. The server answers `{"condition":"clear"}` until the mock replaces it.

`snapshot --interactive` prints a ref for each control, such as `button "Stamp the card" [ref=e1]`. The `aria/…` selectors above are those same controls, so the commands paste without copying refs. After a snapshot, `click e1` is the same click.

| After | What you see |
| --- | --- |
| `reload` | The desk lamps go out. The line above the card reads "The lamps are off." |
| Stamp the card | A red stamp lands on the card: TOKYO. |
| `emulate clock` | The sky turns to night. The clock reads Tokyo 00:00. |
| Look outside | Snow falls across the card. |
| Send the card | The message is written on the card and a wax seal closes it. |
| `diff` | The lines that appeared since the snapshot. |
| `export` | `test/specs/postcard.e2e.ts`, a Mocha spec of these steps. |

To make it an aurora instead of snow, mock `{"condition":"aurora"}` and click Look outside again.

## Boarding pass

The page is one boarding pass. You board, flip it over, turn it sideways, then open a different flight. On a laptop the "phone" is Chrome emulating a Pixel 7. On a device it is Chrome through Appium. Both are browser sessions, so the command is `click`. `tap`, `swipe` and `rotate` are for a native app (`open android --app`). Those targets are on the [targets](/docs/session/targets) page.

The card also follows a finger: a sideways swipe flips it. From the shell you press the button, which is the same result.

### On your laptop

```sh
node examples/session/serve.js mobile
```

```sh
npx wdio session open chrome http://127.0.0.1:4174 --headed --viewport 412x839
npx wdio session emulate device "Pixel 7"
npx wdio session reload
npx wdio session snapshot --interactive
npx wdio session click "aria/Board"
npx wdio session wait --text "Now boarding WD 10."
npx wdio session click "aria/Flip the pass"
npx wdio session wait --text "The pass is flipped."
npx wdio session emulate viewport 863x360
npx wdio session wait --text "The pass is a stub."
npx wdio session navigate "http://127.0.0.1:4174/?flight=aurora"
npx wdio session wait --text "Flight WD 01 to Aurora."
npx wdio session export --out test/specs/boarding-pass.e2e.ts
npx wdio session close
```

`emulate device` applies on the next load. `emulate viewport` changes the size immediately, so the boarded pass is still there when it becomes a stub. `863x360` is the landscape size of a Pixel 7. The aurora URL is a fresh page: the route changes to Reykjavík → Aurora and the background becomes northern lights.

### On a phone

`127.0.0.1` on the phone is the phone itself. Serve on the machine's addresses, then open the URL the server prints:

```sh
node examples/session/serve.js mobile --host 0.0.0.0
npx wdio session doctor android
npx wdio session open android --browser chrome http://192.168.1.10:4174
npx wdio session snapshot --interactive
npx wdio session click "aria/Board"
npx wdio session click "aria/Flip the pass"
npx wdio session exec -e "await browser.setOrientation('LANDSCAPE')"
npx wdio session navigate "http://192.168.1.10:4174/?flight=aurora"
npx wdio session close
```

Replace `192.168.1.10` with an address from the server output. iOS uses `open ios --browser safari` and the same clicks. `doctor android` prints the install command when Appium or the driver is missing.

`rotate` does not apply to a browser session, including Chrome on a device. `setOrientation` is the Appium call that turns the phone. If it is not a function, turn the device by hand: the pass uses the viewport's orientation and becomes a stub either way.

| After | What you see |
| --- | --- |
| `emulate device` and `reload` | The pass fills a phone screen. Tokyo → Reykjavík, flight WD 10. |
| Board | The gate appears and the status reads "Now boarding WD 10." |
| Flip the pass | The card turns over and shows a barcode. |
| `emulate viewport 863x360` | The same card becomes a wide stub. |
| `?flight=aurora` | Reykjavík → Aurora, flight WD 01, on a green sky. |

## Launch console

An Electron window with a lamp. Arm it, press Space, and a second window opens with the altitude. `press` and `windows` are the desktop part. The rest is the same snapshot and click loop.

```sh
cd examples/session/desktop
npm install
npx wdio session open electron ./main.js --app-arg=--no-sandbox
npx wdio session snapshot --interactive
npx wdio session click "aria/Arm"
npx wdio session wait --text "Armed."
npx wdio session press Space
npx wdio session wait --text "Launched."
npx wdio session windows
npx wdio session windows switch 1
npx wdio session wait --text "Altitude"
npx wdio session export --out test/specs/launch.e2e.ts
npx wdio session close
```

Run the commands from `examples/session/desktop`, which is where `npm install` puts Electron. `--app-arg=--no-sandbox` is required on Linux. On macOS and Windows the session also starts without it.

`windows` lists the open windows. Launch console is index 0. Telemetry, the window Space just opened, is index 1. `windows switch 1` moves the session there. The altitude counts up in that window.

| After | What you see |
| --- | --- |
| `open` | An amber lamp and the word HOLD. Launch is disabled. |
| Arm | The lamp turns green. The status reads "Armed. Press Space to launch." |
| `press Space` | A short countdown, then a second window. |
| `windows switch 1` | A green readout: Altitude, counting up in meters. |
| `export` | `test/specs/launch.e2e.ts`, a Mocha spec of these steps. |

Electron sessions use the classic WebDriver protocol. `emulate` and `mock` belong to the postcard, not to this window.

## Troubleshooting

| Message | What to do |
| --- | --- |
| `The browser did not share a location.` | Run `geolocation` and `reload` before Stamp the card. |
| `The sky did not answer.` | Open the postcard through `serve.js`. A `file://` URL has no `/api/weather`. |
| `Text "…" did not appear` | The page status is the quoted line. `snapshot` shows the text that is actually there. |
| `MISSING_DEPENDENCY` | Install the package named in the error. For the launch console, `npm install` in `examples/session/desktop`. |
| `Launched. The telemetry window was blocked.` | Open the console with `wdio session open electron`, not as a tab in Chrome. |
| `setOrientation is not a function` | You are not in an Appium session. On the laptop, use `emulate viewport 863x360`. |

## Next steps

- [wdio session](/docs/session) — the command loop these demos use
- [Targets](/docs/session/targets) — native Android, iOS, macOS and Windows
- [Export a test](/docs/session/export) — what `export` writes, including page objects
