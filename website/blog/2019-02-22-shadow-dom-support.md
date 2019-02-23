---
title: Shadow DOM Support & reusable component objects
author: John Robinson
authorURL: https://www.github.com/jrobinson01
authorImageURL: https://avatars0.githubusercontent.com/u/1584296?s=460&v=4
---

Shadow DOM is one of the key browser features that make up web components. Web components are a really great way to build reusable elements, and are able to scale all the way up to complete web applications. Style encapsulation, the feature that gives shadow DOM it's power, has been a thorn when it comes to E2E or UI testing. Things just got a little brighter, as WebdriverIO v5.5.0 introduces built-in support for shadow DOM via the new [`shadow$`](https://webdriver.io/docs/api/element/shadow$.html) and [`shadow$$`](https://webdriver.io/docs/api/element/shadow$$.html) commands.

<br>

## History
Prior to the 5.5.0 release of WebdriverIO, finding elements inside a shadowRoot has involved some weird query magic. For a while, we had the /deep/ selector that allowed queries such as:

```javascript
$('body my-element /deep/ button');
```
The /deep/ selector was [short lived](https://developers.google.com/web/updates/2017/10/remove-shadow-piercing), and is [rumored to be replaced](https://tabatkins.github.io/specs/css-shadow-parts/) some day.

While /deep/ was being killed off, developers found other ways to get at their shadow elements. The typical approach was to use custom commands in WebdriverIO. These commands used the `execute` command to string together querySelector and shadowRoot.querySelector calls in order to find elements. This generally worked such that instead of a basic string query, queries were put into arrays. Each string in the array represented a shadow boundary. Using these commands looked something like this:

```javascript
const myButton = browser.shadowDomElement(['body my-element', 'button']);
```

This was not much different than the /deep/ approach but it got us by. The downside though, is that in order to find an element, the query always needed to start at the document level. This made tests a little unwieldy and hard to maintain. Code like this was not uncommon:
```javascript
it('submits the form', ()=> {
  const myButton = browser.shadowDomElement(BASE_SELECTOR.concat(['my-deeply-nested-element', 'button']));
  const myInput = browser.shadowDomElement(BASE_SELECTOR.concat(['my-deeply-nested-element', 'button']));
  myInput.setValue('tester');
  myButton.click();
});
```

## The `shadow$` and `shadow$$` Commands
These commands work just like the existing [`$`](https://webdriver.io/docs/api/element/$.html) and [`$$`](https://webdriver.io/docs/api/element/$$.html) commands, but instead of querying an element's light DOM, they query an element's shadow DOM using the function selector modes of `$` and `$$`. Note that these are `element` commands only, and not available on the `browser` object. This is because the document doesn't have a `shadowRoot` property.

Since they're element commands, it's no longer required to start at the root document when building your queries. Once you have an element, calling `element.shadow$('selector')` queries inside that element's shadowRoot for the element that matches the given selector. The `element.shadow$$(selector)` command does something similar. It queries for ALL elements that match the given selector. An element returned by these commands is just like any other element you'd interact with using WebdriverIO.

## Page Objects
Like their counterparts, `$` and `$$`, the shadow commands make page objects a breeze to write, read and maintain. Here's an example:

``` javascript
class LoginPage {

  open() {
    browser.url('/login');
  }

  get app() {
    // my-app lives in the document's light DOM
    return browser.$('my-app');
  }
  get login() {
    // app-login lives in my-app's shadow DOM
    return this.app.shadow$('app-login');
  }

  get usernameInput() {
    // the username input is inside app-login's shadow DOM
    return this.login.shadow$('input #username');
  }
  get submitButton() {
    // also inside app-login's shadow DOM
    return this.login.shadow$('button[type=submit]');
  }

  login(username) {
    this.login.setValue(username);
    this.submitButton.click();
  }
}
```

In the example above, instead of managing the selectors, you can leverage the existing getter methods of your page object to drill into different parts of your application.


## Component Object Pattern
Since web components are meant to be reusable, it makes sense to have a reusable interface to them in your tests. Since we know that in order to query inside a web component's shadowRoot, we need access to the element representing the component, we can extend a base class like the one below:

```javascript
class Component {

  constructor(host) {
    const selectors = [];
    // Crawl back to the browser object, and cache all selectors
    while (host.elementId && host.parent) {
      selectors.push(host.selector);
      host = host.parent;
    }
    selectors.reverse();
    this.selectors_ = selectors;
  }

  get host() {
    // Beginning with the browser object, reselect each element
    return this.selectors_.reduce((element, selector) => element.$(selector), browser);
  }
}

module.exports = Component;
```

We can then write a component object class for the login form we used in the page object example:

```javascript
const Component = require('./component');

class Login extends Component {

  get usernameInput() {
    return this.host.shadow$('input #username');
  }

  get submitButton() {
    return this.login.shadow$('button[type=submit]');
  }

  login(username) {
    this.usernameInput.setValue(username);
    this.submitButton.click();
  }
}

module.exports = Login;
```

Finally, we can clean up our page object a little bit:

```javascript
const Login = require('./components/login');

class LoginPage {

  open() {
    browser.url('/login');
  }

  get app() {
    // my-app lives in the document's light DOM
    return browser.$('my-app');
  }

  get loginComponent() {
    // pass the login component object the instance of the element it should use as it's host,
    // and return the instance of the Login component object.
    return new Login(this.app.shadow$('app-login'));
  }

  login(username) {
    return this.loginComponent.login(username);
  }
}
```

TODO:
* maybe some more explanation here?


## Future
TODO:
* current state of webdriver spec re: shadow DOM
* WDIO will implement spec once it's ready

TODO: things that would make life even easier...
* `element.setProperty(key, value)` would probably be useful when working with web components.

## Limitations
TODO: Firefox inputs and workaround
Safari: refetch stale elements doesn't work (mitigated by page object pattern)
