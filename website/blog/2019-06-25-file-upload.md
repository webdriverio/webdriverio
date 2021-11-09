---
title: File Uploads with WebdriverIO
author: Christian Bromann
authorURL: https://twitter.com/bromann
authorImageURL: https://s.gravatar.com/avatar/d98b16d7c93d15865f34a225dd4b1254?s=80
---

Testing an upload scenario in the browser is a rare but not uncommon case in the automation testing space. It is always important to evaluate the importance of such a test because in many situations you end up testing the browser more than your application. So always keep in mind how much additional functionality your frontend application puts on top of the default upload behavior of the browser. If for example most of the magic happens in the backend it makes much more sense to mimik an upload using a simple Node.js `POST` request using packages like [`request`](https://www.npmjs.com/package/request) or [`axios`](https://www.npmjs.com/package/axios).

## Find and expose file inputs

Let's say our frontend app does a lot of things on top of just uploading a file (e.g. validation or some other frontend side manipulation of the file that is about to be uploaded). Now the first thing we should do is to find the input elements from type `file`. Be aware that apps build in React, Angular or other frameworks often hide these elements as there are hard to style using pure CSS. Therefore they hide the elements and mimic the input with a `div` or other more styleable HTML tags.

```js
// Two hidden input elements, 1 for single file upload 1 for multiple.
<input class="upload-data-file-input hidden" type="file">
<input class="upload-data-file-input-multiple hidden" type="file">
```

In order to become capable to modify the value of this element we need to make it visible. The [WebDriver spec](https://w3c.github.io/webdriver/#interactability) defines input elements to be interactable in order to [change their value](https://w3c.github.io/webdriver/#element-send-keys). So let's do that:

```js
/**
 * The css class name "upload-data-file-input hidden" is just an example
 * and you can replace with your app.
 */
const fileUpload = $('.upload-data-file-input');
browser.execute(
    // assign style to elem in the browser
    (el) => el.style.display = 'block',
    // pass in element so we don't need to query it again in the browser
    fileUpload
);
fileUpload.waitForDisplayed();
```

With the [`execute`](https://webdriver.io/docs/api/browser/execute.html) we can simply modify the element properties to either remove the `hidden` class or give the element displayedness.

## Uploading the file

Unfortunately the mechanism to upload a file with a browser highly depends on your test setup. At the end of the day the browser needs to be able to access the file that you want tp upload. For the local scenario it is super simple. Since you run the browser on your local machine and the file that you want to upload also exists on your local machine, all you need to do is to set the value of the file path to the input element:

```js
/**
 * it is recommended to always use the absolute path of the file as it ensures
 * that it can be found by the browser.
 */
const path = require('path');
const filePath = path.join(__dirname, 'path/to/your/file');
fileUpload.setValue(filePath);
```

If you automate a browser that is running on a remote machine this approach won't work anymore because the file that is located locally (or wherever the tests are running) does not exist on the remote machine where the browser is running. For these scenarios the Selenium project created a [`file`](https://webdriver.io/docs/api/chromium.html#file) that is currently only supported when running Chrome or using a Selenium Grid with the Selenium standalone server. The command expects the file payload to be passed in as base64 string. Since this is quite inconvenient to use WebdriverIO has implemented an `upload` command that allows you to pass in just the file name and the framework takes care of parsing it properly. The upload example will now look like:

```js
const path = require('path');
const filePath = path.join(__dirname, 'path/to/your/file');

const remoteFilePath = browser.uploadFile(filePath);
$('.upload-data-file-input').setValue(remoteFilePath);
```

Note that the remote file name is different from your local filename. Therefore you need to set the value based on the remote file name you get from the `uploadFile` command.

That was it!!! Happy Uploading 😉🙌🏻 ❤️
