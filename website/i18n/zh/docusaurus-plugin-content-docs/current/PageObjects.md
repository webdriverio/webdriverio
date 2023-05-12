---
id: pageobjects
title: Page Object Pattern
---

Version 5 of WebdriverIO was designed with Page Object Pattern support in mind. By introducing the "elements as first class citizens" principle, it is now possible to build up large test suites using this pattern.

There are no additional packages required to create page objects. It turns out that clean, modern classes provide all necessary features we need:

- inheritance between page objects
- lazy loading of elements
- encapsulation of methods and actions

The goal of using page objects is to abstract any page information away from the actual tests. Ideally, you should store all selectors or specific instructions that are unique for a certain page in a page object, so that you still can run your test after you've completely redesigned your page.

## Making A Page Object

First off, we need a main page object that we call `Page.js`. It will contain general selectors or methods which all page objects will inherit from.

```js
// Page.js
export default class Page {
    constructor() {
        this.title = 'My Page'
    }

    async open (path) {
        await browser.url(path)
    }
}
```

We will always `export` an instance of a page object, and never create that instance in the test. Since we are writing end-to-end tests, we always consider the page as a stateless construct&mdash;just as each HTTP request is a stateless construct.

Sure, the browser can carry session information and therefore can display different pages based on different sessions, but this shouldn't be reflected within a page object. These sorts of state changes should live in your actual tests.

Let's start testing the first page. For demo purposes, we use [The Internet](http://the-internet.herokuapp.com) website by [Elemental Selenium](http://elementalselenium.com) as guinea pig. Let's try to build a page object example for the [login page](http://the-internet.herokuapp.com/login).

## `Get` -ing Your Selectors

The first step is to write all important selectors that are required in our `login.page` object as getter functions:

```js
// login.page.js
import Page from './page'

class LoginPage extends Page {

    get username () { return $('#username') }
    get password () { return $('#password') }
    get submitBtn () { return $('form button[type="submit"]') }
    get flash () { return $('#flash') }
    get headerLinks () { return $$('#header a') }

    async open () {
        await super.open('login')
    }

    async submit () {
        await this.submitBtn.click()
    }

}

export default new LoginPage()
```

Defining selectors in getter functions might look a little weird, but it’s really useful. These functions are evaluated _when you access the property_, not when you generate the object. With that you always request the element before you do an action on it.

## Chaining Commands

WebdriverIO internally remembers the last result of a command. If you chain an element command with an action command, it finds the element from the previous command and uses the result to execute the action. With that you can remove the selector (first parameter) and the command looks as simple as:

```js
await LoginPage.username.setValue('Max Mustermann')
```

Which is basically the same thing as:

```js
let elem = await $('#username')
await elem.setValue('Max Mustermann')
```

or

```js
await $('#username').setValue('Max Mustermann')
```

## Using Page Objects In Your Tests

After you've defined the necessary elements and methods for the page, you can start to write the test for it. All you need to do to use the page object is to `import` (or `require`) it. That's it!

Since you exported an already-created instance of the page object, importing it lets you start using it right away.

If you use an assertion framework, your tests can be even more expressive:

```js
// login.spec.js
import LoginPage from '../pageobjects/login.page'

describe('login form', () => {
    it('should deny access with wrong creds', async () => {
        await LoginPage.open()
        await LoginPage.username.setValue('foo')
        await LoginPage.password.setValue('bar')
        await LoginPage.submit()

        await expect(LoginPage.flash).toHaveText('Your username is invalid!')
    })

    it('should allow access with correct creds', async () => {
        await LoginPage.open()
        await LoginPage.username.setValue('tomsmith')
        await LoginPage.password.setValue('SuperSecretPassword!')
        await LoginPage.submit()

        await expect(LoginPage.flash).toHaveText('You logged into a secure area!')
    })
})
```

From the structural side, it makes sense to separate spec files and page objects into different directories. Additionally you can give each page object the ending: `.page.js`. This makes it more clear that you import a page object.

## Going Further

This is the basic principle of how to write page objects with WebdriverIO. But you can build up way more complex page object structures than this! For example, you might have specific page objects for modals, or split up a huge page object into different classes (each representing a different part of the overall web page) that inherit from the main page object. The pattern really provides a lot of opportunities to separate page information from your tests, which is important to keep your test suite structured and clear in times where the project and number of tests grows.

You can find this example (and even more page object examples) in the [`example` folder](https://github.com/webdriverio/webdriverio/tree/main/examples/pageobject) on GitHub.
