---
title: Shadow DOM Support & reusable component objects
author: John Robinson
authorURL: https://www.github.com/jrobinson01
authorImageURL: https://avatars0.githubusercontent.com/u/1584296?s=460&v=4
---

Shadow DOM is one of the key browser features that make up web components. Web components are a really great way to build reusable elements, and are able to scale all the way up to complete web applications. Style encapsulation, the feature that gives shadow DOM it's power, has been a bit of a pain when it comes to E2E or UI testing. Things just got a little easier though, as WebdriverIO v5.5.0 introduced built-in support for shadow DOM via two new commands, [`shadow$`](https://webdriver.io/docs/api/element/shadow$.html) and [`shadow$$`](https://webdriver.io/docs/api/element/shadow$$.html). Let's dig into what they're all about.

## History

With v0 of the shadow DOM spec, came the `/deep/` selector. This special selector made it possible to query inside an element's `shadowRoot`. Here we're querying for a button that is inside the `my-element` custom element's `shadowRoot`:

```javascript
$('body my-element /deep/ button');
```
The /deep/ selector was [short lived](https://developers.google.com/web/updates/2017/10/remove-shadow-piercing), and is [rumored to be replaced](https://tabatkins.github.io/specs/css-shadow-parts/) some day.

With /deep/ being deprecated and subsequently removed, developers found other ways to get at their shadow elements. The typical approach was to use custom commands in WebdriverIO. These commands used the `execute` command to string together querySelector and shadowRoot.querySelector calls in order to find elements. This generally worked such that, instead of a basic string query, queries were put into arrays. Each string in the array represented a shadow boundary. Using these commands looked something like this:

```javascript
const myButton = browser.shadowDomElement(['body my-element', 'button']);
```

The downside of both the `/deep/` selector and the javascript approach was that in order to find an element, the query always needed to start at the document level. This made tests a little unwieldy and hard to maintain. Code like this was not uncommon:

```javascript
it('submits the form', ()=> {
  const myInput = browser.shadowDomElement(BASE_SELECTOR.concat(['my-deeply-nested-element', 'input']));
  const myButton = browser.shadowDomElement(BASE_SELECTOR.concat(['my-deeply-nested-element', 'button']));
  myInput.setValue('test');
  myButton.click();
});
```

## The `shadow$` and `shadow$$` Commands
These commands take advantage of the `$` command in WebdriverIO v5's ability to use a function selector. They work just like the existing [`$`](https://webdriver.io/docs/api/element/$.html) and [`$$`](https://webdriver.io/docs/api/element/$$.html) commands in that you call it on an element, but instead of querying an element's light DOM, they query an element's shadow DOM (they fall back to querying light dom if for whatever reason, you're not using any polyfills).

Since they're element commands, it's no longer required to start at the root document when building your queries. Once you have an element, calling `element.shadow$('selector')` queries inside that element's shadowRoot for the element that matches the given selector. From any element, you can chain `$` and `shadow$` commands as deeply as needed.

## Page Objects
Like their counterparts, `$` and `$$`, the shadow commands make page objects a breeze to write, read and maintain. Let's assume we're working with a page that looks something like this:

```html
<body>
  <my-app>
    <app-login></app-login>
  </my-app>
</body>
```
This uses two custom elements, `my-app` and `app-login`. We can see that `my-app` is in the `body`'s light DOM, and inside it's light DOM is an `app-login` element. An example of a page object to interact with this page might look like so:

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
    // app-login lives in my-app's light DOM
    return this.app.$('app-login');
  }

  get usernameInput() {
    // the username input is inside app-login's shadow DOM
    return this.login.shadow$('input #username');
  }

  get passwordInput() {
    // the password input is inside app-login's shadow DOM
    return this.login.shadow$('input[type=password]');
  }
  get submitButton() {
    // the submit button is inside app-login's shadow DOM
    return this.login.shadow$('button[type=submit]');
  }

  login(username, password) {
    this.login.setValue(username);
    this.username.setValue(password);
    this.submitButton.click();
  }
}
```

In the example above, you can see how it's easy to leverage the getter methods of your page object to drill further and further into different parts of your application. This keeps your selectors nice and focused. For example, should you decide to move the `app-login` element around, you only have to change one selector.


## Component Objects
Following the page object pattern is really powerful on its own. The big draw of web components is that you can create reusable elements. The downside with only using page objects though, is that you might end up repeating code and selectors in different page objects to be able to interact with the elements encapsulated in your web components.

 The component object pattern attempts to reduce that repetition and move the component's api into an object of its own. We know that in order to interact with an element's shadow DOM, we first need the host element. Using a base class for your component objects makes this pretty straightforward. Here's a bare-bones component base class that takes the `host` element in its constructor and unrolls that element's queries up to the browser object, so it can be reused in many page objects (or other component objects), without having to know anything about the page itself:

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

We can then write a subclass for our app-login component:

```javascript
const Component = require('./component');

class Login extends Component {

  get usernameInput() {
    return this.host.shadow$('input #username');
  }

  get passwordInput() {
    return this.host.shadow$('input[type=password]');
  }

  get submitButton() {
    return this.login.shadow$('button[type=submit]');
  }

  login(username, password) {
    this.usernameInput.setValue(username);
    this.passwordInput.setValue(password);
    this.submitButton.click();
  }
}

module.exports = Login;
```

Finally, we can use the component object inside our login page object:

```javascript
const Login = require('./components/login');

class LoginPage {

  open() {
    browser.url('/login');
  }

  get app() {
    return browser.$('my-app');
  }

  get loginComponent() {
    // return a new instance of our login component object
    return new Login(this.app.$('app-login'));
  }

}
```
This component object can now be used in tests for any page or section of your app that uses an app-login web component, without having to know about how that component is structured. If you later decide to change the internal structure of the web component, you only need to update the component object.


## Future
Currently the [WebDriver protocol](https://w3c.github.io/webdriver/) does not provide native support for shadow DOM, but there has been [progress](https://github.com/w3c/webdriver/pull/1320) made for it. Once the spec is finalized, WebdriverIO will implement the spec. There's a decent chance that the `shadow` commands will change under the hood, but I'm pretty confident that they're usage will be the same as it is today, and that test code that uses them will need little to no refactoring.

## Browser Support
IE11-Edge: Shadow DOM is not supported in IE or Edge, but can be polyfilled. The shadow commands work great with the polyfills.

Firefox: Calling `setValue(value)` on an input field in Firefox results in an error, complaining that the input is "not reachable by keyboard". A workaround for now is to use a custom command (or method on your component object) that sets the input field's value via `browser.execute(function)`.

Safari: WebdriverIO has some safety mechanisms to help mitigate issues with stale element references. This is a really nice feature but unfortunately Safari's webdriver does not provide the proper error response when attempting to interact with what in other browsers, is a stale element reference. This is unfortunate but at the same time, it's generally a bad practice to cache element references. Stale element references are typically completely mitigated by using the page and component object patterns outlined above.

Chrome: it just works. :tada:
