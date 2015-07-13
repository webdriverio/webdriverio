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

## Element with certain text

Link the link text examples above you can also apply that to elements, e.g. query a level 1 heading
with the text "Welcome to my Page":

```html
<h1>Welcome to my Page</h1>
```

```js
client.getText('h1=Welcome to my Page', function(err, text) {
    console.log(text); // outputs: "Welcome to my Page"
});
```

or using query partial text

```js
client.getText('h1*=Welcome', function(err, text) {
    console.log(text); // outputs: "Welcome to my Page"
});
```

The same works for ids and class names:

```html
<div class="someElem" id="elem">WebdriverIO is the best</a>
```

```js
client.getText('.someElem=WebdriverIO is the best', function(err, text) {
    console.log(text); // outputs: "WebdriverIO is the best"
});

client.getText('#elem=WebdriverIO is the best', function(err, text) {
    console.log(text); // outputs: "WebdriverIO is the best"
});

client.getText('.someElem*=WebdriverIO', function(err, text) {
    console.log(text); // outputs: "WebdriverIO is the best"
});

client.getText('#elem*=WebdriverIO', function(err, text) {
    console.log(text); // outputs: "WebdriverIO is the best"
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

## Chain Selectors

If you want to be more specific in your query, you can chain your selector until you've found the right
element. If you call element before your actual command, WebdriverIO starts query from that element. For example
if you have a DOM structure like:

```html
<div class="row">
  <div class="entry">
    <label>Product A</label>
    <button>Add to cart</button>
    <button>More Information</button>
  </div>
  <div class="entry">
    <label>Product B</label>
    <button>Add to cart</button>
    <button>More Information</button>
  </div>
  <div class="entry">
    <label>Product C</label>
    <button>Add to cart</button>
    <button>More Information</button>
  </div>
</div>
```

And you want to add product B to the cart it would be difficult to do that just by using the CSS selector.
With selector chaining it gets way easier as you can narrow down the desired element step by step:

```js
client.element('.row .entry:nth-Child(1)').click('button*=Add');
```
