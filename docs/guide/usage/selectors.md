name: selectors
category: usage
tags: guide
index: 0
title: WebdriverIO - Selectors
---

Selectors
=========

The JsonWireProtocol provides several strategies to query an element. WebdriverIO simplifies these
to make it more familiar with the common existing selector libraries like [Sizzle](http://sizzlejs.com/).
The following selector types are supported:

## CSS Query Selector

```js
client.click('h2.subheading a', function(err,res) {...})
```

## Link Text

To get an anchor element with a specific text in it, query the text starting with an equal (=) sign.
For example:

```html
<a href="http://webdriver.io">WebdriverIO</a>
```

```js
client.getText('=WebdriverIO', function(err, text) {
    console.log(text); // outputs: "WebdriverIO"
});
```

## Partial Link Text
To find a anchor element whose visible text partially matches your search value, query it by using `*=`
in front of the query string (e.g. `*=driver`)

```html
<a href="http://webdriver.io">WebdriverIO</a>
```

```js
client.getText('*=driver', function(err, text) {
    console.log(text); // outputs: "WebdriverIO"
});
```

## Tag Name
To query an element with a specific tag name use `<tag>` or `<tag />`

## Name Attribute
For quering elements with a specific name attribute you can eather use a normal CSS3 selector or the
provided name strategy from the JsonWireProtocol by passing something like `[name="some-name"]` as
selector parameter

## xPath
It is also possible to query elements via a specific xPath. The selector has to have a format like
for example `//BODY/DIV[6]/DIV[1]/SPAN[1]`

In near future WebdriverIO will cover more selector features like form selector (e.g. `:password`,`:file` etc)
or positional selectors like `:first` or `:nth`.
