---
id: pageobjects
title: Page Object Pattern
---

The new version (v4) of WebdriverIO was designed with Page Object Pattern support in mind. By introducing the "elements as first class citizens" principle it is now possible to build up large test suites using this pattern. There are no additional packages required to create page objects. It turns out that `Object.create` provides all necessary features we need:

- inheritance between page objects
- lazy loading of elements
- encapsulation of methods and actions

The goal behind page objects is to abstract any page information away from the actual tests. Ideally you should store all selectors or specific instructions that are unique for a certain page in a page object, so that you still can run your test after you've completely redesigned your page.

First off we need a main page object that we call `Page`. It will contain general selectors or methods all page objects will inherit from. Apart from all child page objects `Page` is created using the prototype model:

```js
export default class Page {
    constructor() {
        this.title = 'My Page';
    }

    open(path) {
        browser.url(path);
    }
}
```

We will always export an instance of a page object and never create that instance in the test. Since we are writing end to end tests we always see the page as a stateless construct the same way as each http request is a stateless construct. Sure, the browser can carry session information and therefore can display different pages based on different sessions, but this shouldn't be reflected within a page object. These state changes should emerge from your actual tests.

Let's start testing the first page. For demo purposes we use [The Internet](http://the-internet.herokuapp.com) website by [Elemental Selenium](http://elementalselenium.com/) as guinea pig. Let's try to build a page object example for the [login page](http://the-internet.herokuapp.com/login). First step is to write all important selectors that are required in our `login.page` object as getter functions. As mentioned above we are using the `Object.create` method to inherit the prototype of our main page:

```js
// login.page.js
import Page from './page';

class LoginPage extends Page {

    get username() { return $('#username'); }
    get password() { return $('#password'); }
    get submitBtn() { return $('form button[type="submit"]'); }
    get flash() { return $('#flash'); }
    get headerLinks() { return $$('#header a'); }

    open() {
        super.open('login');
    }

    submit() {
        this.submitBtn.click();
    }

}

export default new LoginPage();
```

Defining selectors in getter functions might look a bit verbose but it is really useful. These functions get evaluated when you actually access the property and not when you generate the object. With that you always request the element before you do an action on it.

WebdriverIO internally remembers the last result of a command. If you chain an element command with an action command it finds the element from the previous command and uses the result to execute the action. With that you can remove the selector (first parameter) and the command looks as simple as:

```js
LoginPage.username.setValue('Max Mustermann');
```

which is basically the same thing as:

```js
var elem = $('#username');
elem.setValue('Max Mustermann');
```

or

```js
$('#username').setValue('Max Mustermann');
```

After we've defined all required elements and methods for the page we can start to write the test for it. All we need to do to use the page object is to require it and that's it. The `Object.create` method returns an instance of that page so we can start using it right away. By adding an additional assertion framework you can make your tests even more expressive:

```js
// login.spec.js
import { expect } 'chai';
import LoginPage '../pageobjects/login.page';

describe('login form', () => {
    it('should deny access with wrong creds', () => {
        LoginPage.open();
        LoginPage.username.setValue('foo');
        LoginPage.password.setValue('bar');
        LoginPage.submit();

        expect(LoginPage.flash.getText()).to.contain('Your username is invalid!');
    });

    it('should allow access with correct creds', () => {
        LoginPage.open();
        LoginPage.username.setValue('tomsmith');
        LoginPage.password.setValue('SuperSecretPassword!');
        LoginPage.submit();

        expect(LoginPage.flash.getText()).to.contain('You logged into a secure area!');
    });
});
```

From the structural side it makes sense to separate spec files and page objects and put them into different directories. Additionally you can give each page object the ending: `.page.js`. This way it is easy to figure out that you actually require a page object if you execute `var LoginPage = require('../pageobjects/form.page');`.

This is the basic principle of how to write page objects with WebdriverIO. Note that you can build up way more complex page object structures than this. For example have specific page objects for modals or split up a huge page object into different sections objects that inherit from the main page object. The pattern gives you really a lot of opportunities to encapsulate page information from your actual tests, which is important to keep your test suite structured and clear in times where the project and number of tests grows.

You can find this and some more page object examples in the [example folder](https://github.com/webdriverio/webdriverio/tree/master/examples/pageobject) on GitHub.
