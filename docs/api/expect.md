---
id: expect
title: Expect
---

When you're writing tests, you often need to check that values meet certain conditions. `expect` gives you access to a number of "matchers" that let you validate different things on the `browser` or an `element` object.

### Matcher Options

Every matcher can take several options that allows you to modify the assertion:

##### Command Options

| Name | Type | Details |
| ---- | ---- | ------- |
| <code><var>wait</var></code> | number | time in ms to wait for expectation to succeed. Default: `3000` |
| <code><var>interval</var></code> | number | interval between attempts. Default: `100` |
| <code><var>message</var></code> | string | user message to prepend before assertion error |

##### String Options

This options can be applied in addition to the command options when strings are being asserted.

| Name | Type | Details |
| ---- | ---- | ------- |
| <code><var>ignoreCase</var></code> | boolean | apply `toLowerCase` to both actual and expected values |
| <code><var>trim</var></code> | boolean | apply `trim` to actual value` |
| <code><var>containing</var></code> | boolean | expect actual value to contain expected value, otherwise strict equal. |
| <code><var>asString</var></code> | boolean | might be helpful to force converting property value to string |

##### Number Options

This options can be applied in addition to the command options when numbers are being asserted.

| Name | Type | Details |
| ---- | ---- | ------- |
| <code><var>eq</var></code> | number | equals |
| <code><var>lte</var></code> | number | less then equals |
| <code><var>gte</var></code> | number | greater than or equals |

## Browser Matchers

### toHaveUrl

Checks if browser is on a specifc page.

##### Usage

```js
browser.url('https://webdriver.io/')
expect(browser).toHaveUrl('https://webdriver.io')
```

### toHaveTitle

Checks if website has a specific title.

##### Usage

```js
browser.url('https://webdriver.io/')
expect(browser).toHaveTitle('WebdriverIO · Next-gen WebDriver test framework for Node.js')
```

## Element Matchers

### toBeDisplayed

Calls [`isDisplayed`](/docs/api/element/isDisplayed.html) on given element.

##### Usage

```js
const elem = $('#someElem')
expect(elem).toBeDisplayed()
```

### toBeVisible

Same as `toBeDisplayed`.

##### Usage

```js
const elem = $('#someElem')
expect(elem).toBeVisible()
```

### toExist

Calls [`isExisting`](/docs/api/element/isExisting.html) on given element.

##### Usage

```js
const elem = $('#someElem')
expect(elem).toExist()
```

### toBePresent

Same as `toExist`.

##### Usage

```js
const elem = $('#someElem')
expect(elem).toBePresent()
```

### toBeExisting

Same as `toExist`.

##### Usage

```js
const elem = $('#someElem')
expect(elem).toBeExisting()
```

### toBeFocused

Checks if element has focus. This assertion only works in a web context.

##### Usage

```js
const elem = $('#someElem')
expect(elem).toBeFocused()
```

### toHaveAttribute

Checks if an element has a certain attribute with a specific value.

##### Usage

```js
const myInput = $('input')
expect(myInput).toHaveAttribute('class', 'form-control')
```

### toHaveAttr

Same as `toHaveAttribute`.

##### Usage

```js
const myInput = $('input')
expect(myInput).toHaveAttr('class', 'form-control')
```

### toHaveAttributeContaining

Checks if an element has a certain attribute that contains a value.

##### Usage

```js
const myInput = $('input')
expect(myInput).toHaveAttributeContaining('class', 'form')
```

### toHaveAttrContaining

Same as `toHaveAttributeContaining`.

##### Usage

```js
const myInput = $('input')
expect(myInput).toHaveAttrContaining('class', 'form')
```

### toHaveClass

Checks if an element has a certain class name.

##### Usage

```js
const myInput = $('input')
expect(myInput).toHaveClass('form-control', { message: 'Not a form control!', })
```

### toHaveClassContaining

Checks if an element has a certain class name that contains provided value.

##### Usage

```js
const myInput = $('input')
expect(myInput).toHaveClassContaining('form')
```

### toHaveProperty

Checks if an element has a certain property.

##### Usage

```js
const elem = $('#elem')
expect(elem).toHaveProperty('height', 23)
expect(elem).not.toHaveProperty('height', 0)
```

### toHaveValue

Checks if an input element has a certain value.

##### Usage

```js
const myInput = $('input')
expect(myInput).toHaveValue('user', { ignoreCase: true })
```

### toHaveValueContaining

Checks if an input element contains a certain value.

##### Usage

```js
const myInput = $('input')
expect(myInput).toHaveValue('us')
```

### toBeClickable

Checks if an element can be clicked by calling [`isClickable`](/docs/api/element/isClickable.html) on the element.

##### Usage

```js
const elem = $('#elem')
expect(elem).toBeClickable()
```

### toBeDisabled

Checks if an element is disabled by calling [`isEnabled`](/docs/api/element/isEnabled.html) on the element.

##### Usage

```js
const elem = $('#elem')
expect(elem).toBeDisabled()
// same as
expect(elem).not.toBeEnabled()
```

### toBeEnabled

Checks if an element is enabled by calling [`isEnabled`](/docs/api/element/isEnabled.html) on the element.

##### Usage

```js
const elem = $('#elem')
expect(elem).toBeEnabled()
// same as
expect(elem).not.toBeDisabled()
```

### toBeSelected

Checks if an element is enabled by calling [`isSelected`](/docs/api/element/isSelected.html) on the element.

##### Usage

```js
const elem = $('#elem')
expect(elem).toBeSelected()
```

### toBeChecked

Same as `toBeSelected`.

##### Usage

```js
const elem = $('#elem')
expect(elem).toBeChecked()
```

### toHaveHref

Checks if link element has a specifc link target.

##### Usage

```js
const link = $('a')
expect(link).toHaveHref('https://webdriver.io')
```

### toHaveLink

Same as `toHaveHref`.

##### Usage

```js
const link = $('a')
expect(link).toHaveLink('https://webdriver.io')
```

### toHaveHrefContaining

Checks if link element contains a specifc link target.

##### Usage

```js
const link = $('a')
expect(link).toHaveHrefContaining('webdriver.io')
```

### toHaveLinkContaining

Same as `toHaveHrefContaining`.

##### Usage

```js
const link = $('a')
expect(link).toHaveLinkContaining('webdriver.io')
```

### toHaveId

Checks if element has a specific `id` attribute.

##### Usage

```js
const elem = $('#elem')
expect(elem).toHaveId('elem')
```

### toHaveText

Checks if element has a specific text.

##### Usage

```js
browser.url('https://webdriver.io/')
const elem = $('.tagline')
expect(elem).toHaveText('Next-gen WebDriver test framework for Node.js')
```

### toHaveTextContaining

Checks if element contains a specific text.

##### Usage

```js
browser.url('https://webdriver.io/')
const elem = $('.tagline')
expect(elem).toHaveTextContaining('WebDriver test framework')
```

### toBeDisplayedInViewport

Checks if an element is within the viewport by calling [`isDisplayedInViewport`](/docs/api/element/isDisplayedInViewport.html) on the element.

##### Usage

```js
const elem = $('#elem')
expect(elem).toBeDisplayedInViewport()
```

### toBeVisibleInViewport

Same as `toBeDisplayedInViewport`.

##### Usage

```js
const elem = $('#elem')
expect(elem).toBeVisibleInViewport()
```

### toHaveChildren

Checks amount of fetched elements using [`$$`](/docs/api/browser/$$.html) command.

##### Usage

```js
const elems = $$('div')
expect(elems).toHaveChildren({ gte: 10 })
// same as
assert.ok(elems.length >= 10)
```

### toBeElementsArrayOfSize

Same as `toHaveChildren`.

##### Usage

```js
const elems = $$('div')
expect(elems).toBeElementsArrayOfSize({ gte: 10 })
// same as
assert.ok(elems.length >= 10)
```
