---
id: faq
title: FAQ
---

### Do I need to use a `save(Screen/Element/FullPageScreen)` methods when I want to run `check(Screen/Element/FullPageScreen)`?

No, you don't need to do this. The `check(Screen/Element/FullPageScreen)` will do this automatically for you

### Width and height cannot be negative

It could be that the error `Width and height cannot be negative` is thrown. 9 out of 10 times this is related to creating an image of an element that is not in the view. Please be sure you always make sure the element in is in the view before you try to make an image of the element.

### Installation of Canvas on Windows failed with Node-Gyp logs

Canvas uses Node-Gyp and might cause some issues on Windows that are not fully set up. Please check

-   the [Node Canvas](./getting-started#node-canvas) section in the [Getting Started](./getting-started) guide
-   [this post](https://spin.atomicobject.com/2019/03/27/node-gyp-windows/) for Fixing Node-Gyp Issues on Windows. (Thanks to [IgorSasovets](https://github.com/IgorSasovets))
