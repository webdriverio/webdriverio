---
id: autowait
title: Auto-waiting
---

When using a command that directly interacts with an element WebdriverIO will automatically wait for the element to be visible and interactable, no manual waits are needed when using the commands (think of click, setValue etc). An element is considered interactable when the conditions for [isClickable](https://webdriver.io/docs/api/element/isClickable) are met.

While WebdriverIO automatically waits for elements to become interactable, there are rare cases for which you might need to manually wait. For these rare cases we offer commands such as [`waitForDisplayed`](/docs/api/element/waitForDisplayed).


## Implicit timeouts (not recommended)

While we do not recommend using this but the WebDriver protocol offers [implicit timeouts](https://w3c.github.io/webdriver/#timeouts) that allow specify how long the driver is suppose to wait for an element to show up. By default this timeout is set to `0` and therefore makes the driver return with an `no such element` error immediately if an element could not be found on the page. Increasing this timeout using the [`setTimeout`](/docs/api/browser/setTimeout) would make the driver wait and increases the chances that the element shows up eventually.

:::note

Leia mais sobre o WebDriver e o tempo limite relacionado à framework no [guia de timeouts](/docs/timeouts)

:::
