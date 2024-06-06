---
id: faq
title: FAQ
---

### Do I need to use a `save(Screen/Element/FullPageScreen)` methods when I want to run `check(Screen/Element/FullPageScreen)`?

No, you don't need to do this. The `check(Screen/Element/FullPageScreen)` will do this automatically for you.

### Width and height cannot be negative

It could be that the error `Width and height cannot be negative` is thrown. 9 out of 10 times this is related to creating an image of an element that is not in the view. Please be sure you always make sure the element in is in the view before you try to make an image of the element.

### Installation of Canvas on Windows failed with Node-Gyp logs

If you encounter issues with Canvas installation on Windows due to Node-Gyp errors, please note that this applies only to Version 4 and lower. To avoid these issues, consider updating to Version 5 or higher, which does not have these dependencies and uses [Jimp](https://github.com/jimp-dev/jimp) for image processing.

If you still need to resolve the issues with Version 4, please check:

-   the Node Canvas section in the [Getting Started](/docs/visual-testing#system-requirements) guide
-   [this post](https://spin.atomicobject.com/2019/03/27/node-gyp-windows/) for Fixing Node-Gyp Issues on Windows. (Thanks to [IgorSasovets](https://github.com/IgorSasovets))
