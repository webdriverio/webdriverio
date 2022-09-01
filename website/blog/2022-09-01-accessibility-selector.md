---
title: Keep Your Apps Accessible and Your e2e Tests Stable With WebdriverIOs New Accessibility Selector
author: Christian Bromann
authorURL: http://github.com/christian-bromann
authorImageURL: https://s.gravatar.com/avatar/d98b16d7c93d15865f34a225dd4b1254?s=80
---

Fetching elements within e2e tests can sometimes be very hard. Complex CSS paths or arbitrary test ids make them either less readable or prone to failures. The disappointment we experience when our test fail is by far not comparable to a the bad experience people have when they need to use assistent devices like screen readers on applications build without accessibility in mind.

With the accessibility selector introduced in version `v7.24.0` WebdriverIO now provides a powerful way to fetch various of elements containing a certain accessibility name. Rather than applying arbitrary `data-testId` properties to elements which won't be recognised by assistent devices, developers or QA engineers can now either apply a correct accessibility name to the element themselves or ask the development team to improve the accessibility so that writing tests becomes easier.

WebdriverIO internally uses a chain of xPath selector conditions to fetch the correct element. While the framework has no access to the accessibility tree of the browser, it can only guess the correct name here. As accessibility names are computed based on author supplied names and content names, WebdriverIO fetches an element based in a certain order:

1. First we try to find an element that has an `aria-labelledBy` or `aria-describedBy` property pointing to an element containing a valid id, e.g.:
   ```html
   <h2 id="social">Social Media</h2>
   <nav aria-labelledBy="social">...</nav>
   ```
   So we can fetch a certain link within our navigation via:
   ```ts
   await $('aria/Social Media').$('a=API').click()
   ```
2. Then we look for elements with a certain `aria-label`, e.g.:
   ```html
   <button aria-label="close button">X</button>
   ```
   Rather than using `X` to fetch the element or applying a test id property we can just do:
   ```ts
   await $('aria/close button').click()
   ```
3. Well defined HTML forms provide a label to every input element, e.g.:
   ```html
   <label for="username">Username</label>
   <input id="username" type="text" />
   ```
   Setting the value of the input can now be done via:
   ```ts
   await $('aria/Username').setValue('foobar')
   ```
4. Less ideal but still working are `placeholder` or `aria-placeholder` properties:
   ```html
   <input placeholder="Your Username" type="text" />
   ```
   Which can now be used to fetch elements as well:
   ```ts
   await $('aria/Your Username').setValue('foobar')
   ```
5. Furthermore if an image tag provides a certain alternative text, this can be used to query that element as well, e.g.:
   ```html
   <img alt="A warm sommer night" src="..." />
   ```
   Such an image can be now fetched via:
   ```ts
   await $('aria/A warm sommer night').getTagName() // outputs "img"
   ```
6. Lastly, if no proper accessibility name can be derived, it is computed by its accumulated text, e.g.:
   ```html
   <h1>Welcome!</h1>
   ```
   Such a heading tag can be now fetched via:
   ```ts
   await $('aria/Welcome!').getTagName() // outputs "h1"
   ```

As you can see, there are a variety of ways to define the accessibility name of an element. Many of the browser debugging tools provide handy accessibility features that help you to find the proper name of the element:

![Getting Accessibility Name in Chrome DevTools](/img/ally.png)

> For more information check out the [Chrome DevTools](https://developer.chrome.com/docs/devtools/accessibility/reference/#pane) or [Firefox Accessibility Inspector](https://firefox-source-docs.mozilla.org/devtools-user/accessibility_inspector/) docs.

Accessibility is not only a powerful tool to create an inclusive web, it can also help you write stable and readable tests. While you should __not__ go ahead and give every element an `aria-label`, this new selector can help you build web applications with accessibility in mind so that writing e2e tests for it later on will become much easier.

Thanks for reading!
