---
title: File Upload Example in V5
author: Xu Cao
authorURL: https://twitter.com/xucao
authorImageURL: https://pbs.twimg.com/profile_images/1085903692673384448/McZrlD3Q_400x400.jpg
---

We got so many questions [our support channel on Gitter](https://gitter.im/webdriverio/webdriverio) regarding the file upload in V5. So this is my first attempt to 
address that. Sorry in advance that this solution only tested in Chrome browser with selenium-standalone service.
<br>
The markup is this:

```js
// Two hidden input elements, 1 for single file upload 1 for multiple.

  <input class="upload-data-file-input hidden" type="file">
  <input class="upload-data-file-input-multiple hidden" type="file">

```
Here is the code to 1. Make the hidden element visible first 2. Wait it displayed 3. setValue(filePath) on it.
That is essentially submit the form with the file path on local or a url:

```js

// normal Nodejs stuff to create a variable pointing to the file

  const path = require('path');
  const filePath = path.join(__dirname, 'path/to/your/file');

// The css class name "upload-data-file-input hidden" is just an example and you can replace with your app.
  browser.execute('document.getElementsByClassName("upload-data-file-input hidden")[0].style.display = "block"');
  $('.upload-data-file-input').waitForDisplayed();
  $('.upload-data-file-input').setValue(filePath);

```

If you want to upload file to a remote machine (e.g. SauceLab's VM) on which the browser is running you could use this Chrome only non official and undocumented Chromium command. Please note the file has to be Base64-encoded zip archive containing single file which to upload. Please refer [uploadFile](https://webdriver.io/docs/api/chromium.html#uploadfile)
I haven't tested it yet but you can let me know if this works for you.

```js

  const path = require('path');
  const filePath = path.join(__dirname, 'path/to/your/file');

  const remoteFilePath = browser.uploadFile(filePath);
  $('upload file input selector').setValue(remoteFilePath);

```
Here is another example which tests both with visible browse file and upload buttons
```js
const assert = require('assert');
const path = require('path');
const filePath = path.resolve(__dirname, 'cat-to-upload.gif')
describe('file upload test', () => {


  it('should upload file to a remote server and then to the site via UI markup', () => {

      browser.url('https://the-internet.herokuapp.com/upload');
      $('#file-upload').waitForDisplayed(6000);
      const fp = browser.uploadFile(filePath);
      $('#file-upload').setValue(fp);
      $('#file-submit').click();
      $('#uploaded-files').waitForDisplayed();
      assert.equal($('#uploaded-files').getText(), 'cat-to-upload.gif');
      
  });

});
```
That was it!!! Happy Uploading 😉🙌🏻 ❤️

<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
