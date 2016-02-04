# Multiremote

The multiremote examples demonstrate how you can use more than one browser to test a specific thing. This feature is not meant to run tests in parallel, it helps you test interactive features (e.g. a chat system) where you need more than one browser to test.

## webdriverio.multiremote.js

Run this test by executing the file using node. It opens up a WebRTC page with two Chrome browser. Both browser will connect to each other and will have a two seconds long call.

## webdriverio.multiremote.chat.js

This example demonstrates how you could test a chat system. Both browser will connet to a text based chat. One browser will input something whereas the other browser reads the message, interprets it and returns with a proper response message. You can execute the test using Mocha. Make sure you pass a high timeout as argument to make the test work properly.

```sh
./node_modules/.bin/mocha ./examples/multiremote/webdriverio.multiremote.chat.js --timeout 9999999
```
