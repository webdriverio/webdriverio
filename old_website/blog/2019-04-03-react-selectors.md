---
title: React Selectors
author: Baruch Velez
authorURL: http://github.com/baruchvlz
authorImageURL: https://avatars1.githubusercontent.com/u/14321495?s=460&v=4
---

[ReactJS](https://github.com/facebook/react) is one of the most widely use Front-End libraries in the web. Along side React, many developers use styling tools that will minify or re-write the class attribute values attached to the HTML elements via `className` props in JSX. These minifications and overwrites make it difficult to select the generated HTML using the WebDriver's query commands like `findElement` or `findElements` since it's not guaranteed that the class name will remain the same.

Today we introduce two new commands, `browser.react$` and `browser.react$$`, to WebdriverIO's browser object that allows you to query for a single or multiple React component instances in the page with an easy to use API. These new commands will return the WebdriverIO element(s) for the query in where you will have access to the complete element commands API.

## Usage

Internally, WebdriverIO uses a library called [resq](https://github.com/baruchvlz/resq) to query React's VirtualDOM in order to retrieve the nodes. This library allows WebdriverIO to find any component in the VirtualDOM by the component's name and also filter this selection by state and/or props.

WebdriverIO's provided API, `browser.react$` and `browser.react$$`, methods have three parameters. The first parameter is the selector to query, this parameter is required. The second and third parameters are optional filters, `props` and `state` respectively.

```js
const selector = 'MyComponent'
const propFilter = { someProp: true }
const stateFilter = 'this is my state'

browser.react$(selector, {
    props: propFilter,
    state: stateFilter
})
```

In the examples we will cover basic usages for all three parameters.

## Examples

In the following examples, we will base our queries against this example React application.

```jsx
// mycomponent.jsx
import React from 'react'
import ReactDOM from 'react-dom'

const MyComponent = (props) => {
    const { name } = props;
    const [state] = React.useState(name === 'there' ? ', how are you?' : '')

    return (
        <div>
            Hello {name || 'World'}{state}
        </div>
    )
}

ReactDOM.render(
    <div>
        <MyComponent />
        <MyComponent name="Barry"/>
        <MyComponent name="WebdriverIO"/>
        <MyComponent name="there"/>
    </div>,
    document.getElementById('#root'),
)
```

In this app, we have one component that renders some text depending on the property `name` passed to it.

#### Selecting and filtering

Now, let's say we want to test that the first instance of `MyComponent` is correctly displayed in the browser. Well, with the `browser.react$` command, we can select this first instance and then query against it.

```javascript
// spec/mycomponent.test.js

test('it should be displayed', () => {
    const myComponent = browser.react$('MyComponent')

    expect(myComponent.isDisplayed()).toBe(true) // pass
})
```
Simple, no? But what if we want to select the component that says `Hello WebdriverIO` and verify that the text is correct? Well, we can filter our queries!

```javascript
// spec/mycomponent.test.js

test('it should correctly display "Hello WebdriverIO"', () => {
    const myComponent = browser.react$('MyComponent', {
        props: { name: 'WebdriverIO' }
    })

    expect(myComponent.getText()).toBe('Hello WebdriverIO') // pass
})
```
In React, the props will always be an object so for this filter parameter we can only pass an object to be used to filter our results.

You might've noticed that in our component we have a state that adds extra text if the name matches `there`. We can select this component by filtering the components by their current state.

```javascript
// spec/mycomponent.test.js

test('it should correctly display "Hello WebdriverIO"', () => {
    const myComponent = browser.react$('MyComponent', {
        state: ', how are you?'
    })

    expect(myComponent.getText()).toBe('Hello there, how are you?') // pass
})
```
As you can see, for the state filter we pass the string that equals to the current state of the component, this last parameter in the function can be any of the following: string, number, boolean, array, or object. This is because all these types are valid state types for React.

#### What about `browser.react$$`?

By now you might be wondering why we are using `browser.react$` in all the examples. Well, both commands have the same parameters and work almost the same with the **only difference** being that `browser.react$$` will return an array of all the WebdriverIO elements corresponding to the selector and/or filter match.

## Final Words

We are very pleased with this addition and we hope you can take full advantage of it. We suggest you use [React Dev Tools](https://github.com/facebook/react-devtools), using this tool will help you see how the components in the application are called, which props they have, and which state they are currently in. Once you know this information, using WebdriverIO's React API will be a lot easier.

> __Note:__ This blog post was updated after the v6 release to reflect changes to the command interface.
