---
id: browsingContext
title: The BrowsingContext Object
description: Hold a tab, a window or a frame as an object and run commands in it directly, without switching the session to it.
---

A browsing context is a tab, a window or a frame that you hold as an object. Commands you call on it run in that tab or frame, while the session and every other context stay where they are. Since v10 this is how WebdriverIO works with tabs, windows and frames in a WebDriver BiDi session, and it replaces `switchWindow()` and `switchFrame()` there.

```ts title="test/specs/tabs.e2e.ts"
import { browser, expect } from '@wdio/globals'

describe('browsing contexts', () => {
    it('works with two tabs and a frame at the same time', async () => {
        const page = await browser.url('https://the-internet.herokuapp.com/nested_frames')
        const docs = await browser.newWindow('https://webdriver.io/docs/api', { type: 'tab' })

        const top = await page.frame({ selector: 'frame[name="frame-top"]' })
        const middle = await top.frame({ selector: 'frame[name="frame-middle"]' })

        await expect(middle.$('#content')).toHaveText('MIDDLE')
        await expect(docs.$('h1')).toBeDisplayed()
        console.log(await page.getTitle(), await docs.getTitle())
    })
})
```

## Get a browsing context

| Call | Returns |
| --- | --- |
| [`browser.url(url)`](/docs/api/browser/url) | The session's first top-level context, after navigating it. `browser.url()` always navigates this one. |
| [`browser.newWindow(url, { type })`](/docs/api/browser/newWindow) | A new tab (`type: 'tab'`) or window, once its page has loaded. The session does not switch to it. |
| [`browser.browsingContexts()`](/docs/api/browser/browsingContexts) | Every open top-level context (tabs and windows, not frames), e.g. a tab the page opened itself. |
| [`context.frame(query)`](/docs/api/browsingContext/frame) | A frame of a context, also cross-origin and nested ones. |

Hold on to the object and call commands on it. There is no "current" tab or frame to switch between, so contexts can also be used in parallel:

```ts
const [titleA, titleB] = await Promise.all([pageA.getTitle(), pageB.getTitle()])
```

## WebDriver BiDi and Classic sessions

Browsing contexts need a WebDriver BiDi session, which is the default since v10 for Chrome, Edge and Firefox. In a WebDriver Classic session, e.g. with Appium or Safari, there is only the session's current context. There:

- `browser.url()` returns a stand-in for the browser. Commands like `$`, `execute` or `getTitle` run on the browser, `url`, `isFrame` and `parent` describe the current page, and `contextId` is `undefined`.
- `frame()`, `navigate()` and `activate()` reject and name the Classic command to use instead: [`browser.switchFrame()`](/docs/api/browser/switchFrame), [`browser.url()`](/docs/api/browser/url) or [`browser.switchWindow()`](/docs/api/browser/switchWindow).

Check `browser.isBidi` when the same code runs in both kinds of session.

## Properties

| Name | Type | Details |
| ---- | ---- | ------- |
| `contextId` | `String` | The WebDriver BiDi browsing context id. `undefined` in a Classic session. |
| `url` | `String` | The URL the context was last navigated to with `browser.url()`, `navigate()` or `newWindow()`. Navigations the page does itself (links, `location`, `history.pushState`) only show after [`getUrl()`](/docs/api/browsingContext/getUrl). |
| `isFrame` | `Boolean` | `true` for a frame, `false` for a tab or window. |
| `parent` | `BrowsingContext \| undefined` | For a frame, the context `frame()` was called on (or the frame in between, for a frame nested deeper). `undefined` for a tab or window. |
| `browser` | `Browser` | The [browser object](/docs/api/browser) of the session. |
| `request` | `Request \| undefined` | Load information of the last navigation through `browser.url()` or `navigate()`: URL, headers, response, redirects and the requests the page made. |
| `sessionId` | `String` | Session id, the same as `browser.sessionId`. |
| `capabilities` | `Object` | Session capabilities, the same as `browser.capabilities`. |
| `options` | `Object` | WebdriverIO options, the same as `browser.options`. |
| `isBidi` | `Boolean` | Whether the session uses WebDriver BiDi. |
| `isMobile` | `Boolean` | Whether the session automates a mobile device. |

## Methods

### Commands of a browsing context

These commands act on the context they are called on. Each has its own reference page.

| Command | Details |
| --- | --- |
| [`frame`](/docs/api/browsingContext/frame) | Get a frame of this context as a browsing context of its own. |
| [`navigate`](/docs/api/browsingContext/navigate) | Navigate this context, with the same options as `browser.url()`. |
| [`refresh`](/docs/api/browsingContext/refresh) | Reload this context. A frame reloads only its own document. |
| [`back`](/docs/api/browsingContext/back) / [`forward`](/docs/api/browsingContext/forward) | Move through the history of this tab or window. |
| [`activate`](/docs/api/browsingContext/activate) | Bring this tab or window to the front. |
| [`closeWindow`](/docs/api/browsingContext/closeWindow) | Close this tab or window. |
| [`getTitle`](/docs/api/browsingContext/getTitle) / [`getUrl`](/docs/api/browsingContext/getUrl) | Read the title or URL of the document shown in this context. |
| [`acceptAlert`](/docs/api/browsingContext/acceptAlert) / [`dismissAlert`](/docs/api/browsingContext/dismissAlert) / [`getAlertText`](/docs/api/browsingContext/getAlertText) | Answer or read the user prompt open in this context. |

### Browser commands that run in a context

These are the [browser commands](/docs/api/browser) of the same name, applied to this context instead of the session's first one. They take the same arguments.

| Command | In a browsing context |
| --- | --- |
| [`$`](/docs/api/browser/$), [`$$`](/docs/api/browser/$$), [`custom$`](/docs/api/browser/custom$), [`custom$$`](/docs/api/browser/custom$$), [`react$`](/docs/api/browser/react$), [`react$$`](/docs/api/browser/react$$) | Find elements in this context's document. |
| [`execute`](/docs/api/browser/execute) | Run a script in this context's document. |
| [`action`](/docs/api/browser/action), [`actions`](/docs/api/browser/actions), [`keys`](/docs/api/browser/keys), [`scroll`](/docs/api/browser/scroll) | Send input to this context, also when it is a background tab. |
| [`saveScreenshot`](/docs/api/browser/saveScreenshot), [`savePDF`](/docs/api/browser/savePDF) | Capture this context. |
| [`getCookies`](/docs/api/browser/getCookies), [`setCookies`](/docs/api/browser/setCookies), [`deleteCookies`](/docs/api/browser/deleteCookies) | Read and change the cookies of this context's storage partition. |
| [`setViewport`](/docs/api/browser/setViewport) | Resize the viewport of this tab or window. |
| [`addInitScript`](/docs/api/browser/addInitScript) | Run a script before the page scripts, in this tab or window only. |
| [`mock`](/docs/api/browser/mock), [`mockClearAll`](/docs/api/browser/mockClearAll), [`mockRestoreAll`](/docs/api/browser/mockRestoreAll) | Mock the requests of this tab or window only. A mock ends when its tab closes. |
| [`emulate`](/docs/api/browser/emulate) | Emulate a device property, e.g. geolocation or the clock, in this tab or window only. |
| [`restore`](/docs/api/browser/restore) | Restore emulations, the same as `browser.restore()`. |
| [`waitUntil`](/docs/api/browser/waitUntil), [`pause`](/docs/api/browser/pause) | The same as on the browser. |

```ts title="test/specs/mock.e2e.ts"
import { browser, expect } from '@wdio/globals'

it('mocks the requests of one tab only', async () => {
    const page = await browser.url('https://webdriver.io')
    const tab = await browser.newWindow('https://webdriver.io', { type: 'tab' })

    const mock = await tab.mock('**/api/users')
    mock.respond([{ name: 'Mocked user' }])

    // requests of `tab` get the mocked response, requests of `page` reach the server
})
```

### Top-level only

A frame shares its tab's history, viewport, network and emulation, so these commands reject on a frame with `` `<command>` is only available on a top-level browsing context ``. Call them on the tab: `frame.parent` until `parent` is `undefined`, or the context you called `frame()` on.

`back`, `forward`, `activate`, `closeWindow`, `setViewport`, `addInitScript`, `mock`, `mockClearAll`, `mockRestoreAll`, `emulate`, `restore`

### Not available on a browsing context

Session commands, such as `deleteSession`, `newWindow` or `browsingContexts`, are only on the [browser object](/docs/api/browser). Custom commands are too: [`addCommand`](/docs/customcommands) and `overwriteCommand` reject on a context, register them on `browser`.

### Events

`on`, `once`, `off`, `emit`, `removeListener` and `removeAllListeners` register listeners on the browser, so the events are those of the whole session. For example, a [`dialog`](/docs/api/dialog) event fires for a prompt in any tab or frame.

## Elements of a browsing context

An element you get through a context belongs to that context. Element commands such as `click`, `setValue` or `getText` run in that context's document, also when it is a background tab or a frame. They follow the WebDriver spec like the drivers do, so they return the same results and the same errors (e.g. `element click intercepted`) as for an element of the page in front. `getComputedRole` and `getComputedLabel` reject for an element of a context other than the session's first one.

```ts
const page = await browser.url('https://the-internet.herokuapp.com/nested_frames')
const bottom = await page.frame({ selector: 'frame[name="frame-bottom"]' })
const body = await bottom.$('body')
console.log(await body.getText()) // outputs: "BOTTOM"
```

## Troubleshooting

| Error | Cause and fix |
| --- | --- |
| `` `switchFrame` was removed for WebDriver BiDi sessions in WebdriverIO v10. `` | Call [`frame()`](/docs/api/browsingContext/frame) on the context returned by `browser.url()` or `browser.newWindow()`. |
| `` `switchWindow` was removed for WebDriver BiDi sessions in WebdriverIO v10. `` | Hold the context returned by `browser.url()` or `browser.newWindow()`, or find one with `browser.browsingContexts()`. |
| `` `frame()` needs a WebDriver BiDi session, but this session uses WebDriver Classic `` | The session is a Classic session (e.g. Appium or Safari). Use the Classic command the message names. |
| `` `<command>` is only available on a top-level browsing context `` | The command was called on a frame. Call it on the frame's tab, see [Top-level only](#top-level-only). |
| `` `addCommand` is only available on the browser, not on a browsing context `` | Register custom commands on `browser`. |
| `no such frame: the frame "…" was discarded because the page it belongs to navigated away` | The page that contained the frame navigated. Get the frame again with `frame()` on the new page. |

## Related

- [The Browser Object](/docs/api/browser)
- [Migrate to v10: `switchToFrame`](/docs/v10-migration#switchtoframe)
- [Dialogs](/docs/api/dialog)
