---
title: "Introducing DOM and Visual Snapshot Testing for Component, End-to-End and Mobile Testing"
author: WebdriverIO Team
authorURL: https://twitter.com/webdriverio
authorImageURL: https://avatars.githubusercontent.com/u/6512473?s=400&u=69d781679fe5cda99067d8193890ad5cb7450e4a&v=4
---

We're excited to announce support for DOM and Visual snapshot tests using a common set of primitives supporting all testing environments WebdriverIO offers. Our vision has always been to provide a comprehensive, versatile testing tool that simplifies your workflow. This update is a step towards creating a 'Swiss Army Knife' for unit and visual testing, catering to diverse requirements across platforms and extending our support to native mobile applications, making your testing process more efficient and seamless.

<!-- truncate -->

Both, DOM and Visual Snapshot primitives will be available for you when running component and unit tests, end-to-end tests as well as mobile web tests. In addition to that the same visual snapshot primitives will be also available for native mobile application tests.

If you are more of a visual learner, we've also released a WebdriverIO tutorial on our [YouTube](https://youtube.com/@webdriverio) channel:

<LiteYouTubeEmbed
    id="wQRGpWX3fsk"
    title="WebdriverIO Tutorials: Snapshot Testing"
/>

Let's dive into each of these powerful capabilities.

## DOM or Object Snapshots

For evaluating the state of the DOM, a large object or the content of a UI element we often tend to copy the value into our test and manually update it if we change the behavior of our application or component.

With text-based snapshots, we can just have this handled by WebdriverIO. For example, let's say we want to verify the state of our React component in a browser, we can just do the following:

```tsx title="/src/component.test.tsx"
import { expect, $ } from '@wdio/globals'
import { render } from '@testing-library/react'

function App() {
    const [theme, setTheme] = useState('light')

    const toggleTheme = () => {
        const nextTheme = theme === 'light' ? 'dark' : 'light'
        setTheme(nextTheme)
    }

    return <button onClick={toggleTheme}>
        Current theme: {theme}
    </button>
}

describe('React Component Testing', () => {
    it('supports snapshot tests', async () => {
        const { container } = render(<App />)
        await expect(container).toMatchSnapshot()
        await $('button').click()
        await expect(container).toMatchSnapshot()
    })
})
```

WebdriverIO will automatically grab the DOM structure of the component and store a snapshot file called `component.test.tsx.snap` in `/src/__snapshots__` directory next to your test with the following content:

```
// Snapshot v1

exports[`React Component Testing > supports snapshot tests 1`] = `"<div><button>Current theme: light</button></div>"`;

exports[`React Component Testing > supports snapshot tests 2`] = `"<div><button>Current theme: dark</button></div>"`;
```

If you prefer to keep the snapshots as part of your tests you can use `toMatchInlineSnapshot` instead:

```tsx
await expect(container).toMatchInlineSnapshot()
```

After running the test for the first time, WebdriverIO will make a change to the test and fill in the snapshot inline:

```tsx
await expect(container).toMatchInlineSnapshot(`"<div><button>Current theme: light</button></div>"`)
```

Now, if you make changes to your component that will impact all snapshots you can update them all in a single run by calling:

```sh
npx wdio run wdio.conf.ts --updateSnapshots
# or
npx wdio run wdio.conf.ts -s
```

This makes maintaining your tests so much easier. The same works for all other types of objects, e.g. CSS Properties, or the text content of an element. They all can be converted into a snapshot to simplify the assertion and keep your tests lean. This can also speed up your tests by merging many single assertions into one, e.g.:

```ts
const elem = $('#alertBar')
await expect(elem).toHaveAttribute('data-alert')
await expect(elem).toHaveClassName('success')
await expect(elem).toHaveText('You logged into a secure area!')
```

now becomes a single:

```ts
await expect($('#alertBar')).toMatchSnapshot()
/**
 * stores the following into a snapshot file:
 *
 * <div data-alert="" id="flash" class="flash success">
 *   You logged into a secure area!
 *   <a href="#" class="close">×</a>
 * </div>
 */
```

While taking a snapshot of the DOM might be the most prominent use case, you can take snapshots of all types of serializable data structures, e.g.:

```ts
// the visible content of an element
await expect($('elem').getText()).toMatchSnapshot()
// or of an serializable object
await expect($('elem').getCSSProperty('color')).toMatchSnapshot()
```

You can find more information about DOM and object-based snapshots in our [Snapshot guide](/docs/snapshot).

## Visual Snapshots

While taking snapshots of an element structure and its attributes might be great and powerful, it comes with an important caveat: even though we are testing that the element has a class name called `success`, this doesn't guarantee that the alert is green!

For these reasons, visual testing has become a very popular tool as it includes how elements are rendered, in which color and can ensure that e.g. it is not overlaid by any other element. Taking visual snapshots works very similarly, as you can:

- take a visual snapshot of the whole screen:
  ```ts
  await expect(browser).toMatchScreenSnapshot('partialPage')
  ```
- take a visual snapshot of an element:
  ```ts
  await expect($('#element-id')).toMatchElementSnapshot('firstButtonElement')
  ```
- take a snapshot of the whole page:
  ```ts
  await expect(browser).toMatchFullPageSnapshot('fullPage')
  ```
- or take a page snapshot that includes [page tab-ability](https://vivrichards.co.uk/accessibility/automating-page-tab-flows-using-visual-testing-and-javascript):
  ```ts
  await expect(browser).toMatchTabbablePageSnapshot('check-tabbable')
  ```

WebdriverIO will store these visual snapshots conveniently next to your text-based snapshots within the `__snapshots__` directory next to your test.

While text-based snapshot testing is built into WebdriverIO, you have to install a [service](https://www.npmjs.com/package/@wdio/visual-service) to enable all visual snapshot capabilities via:

```sh
npm i --save-dev @wdio/visual-service
```

With the most recent release of the Visual Testing Module with have shipped further improvements for **Mobile Native App Snapshot Testing**.

### Mobile Native App Snapshot Testing

The module now supports the `toMatchElementSnapshot` and `toMatchScreenSnapshot` matchers for Mobile native apps. It automatically detects the testing context (web, webview, or native_app) to streamline your workflow.

### Key Features of the Visual Service

Some of the features that make visual testing with WebdriverIO unique are:

- save or compare __screens/elements/full-page__ screens against a baseline
- automatically __create a baseline__ when no baseline is there
- __block out custom regions__ and even __automatically exclude__ a status and or toolbars (mobile only) during a comparison
- increase the element dimensions screenshots
- __hide text__ during website comparison to:
  - __improve stability__ and prevent font rendering flakiness
  - only focus on the __layout__ of a website
- use __different comparison methods__ and a set of __additional matchers__ for better readable tests
- verify how your website will __support tabbing with your keyboard__, see also [Tabbing through a website](/docs/visual-testing#tabbing-through-a-website)
- and much more, see the [service](/docs/visual-testing/service-options) and [method](/docs/visual-testing/method-options) options

Learn everything about WebdriverIO's visual testing capabilities in our [Visual docs](/docs/visual-testing) and join our [👁️-visual-testing](https://discord.webdriver.io) channel on Discord.

### Special Thanks to [`@wswebcreation`](https://github.com/wswebcreation)

We owe a big thank you to our core maintainer [Wim Selles](https://github.com/wswebcreation) for his work in [`wdio-native-app-compare`](https://github.com/wswebcreation/wdio-native-app-compare), which inspired this enhancement. His contribution has been vital in advancing our module's capabilities.

Thank you for your continued support, and we look forward to your feedback on these new features.

Happy testing!

*The WebdriverIO Team*
