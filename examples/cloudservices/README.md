# Cloudservices

Shows you how to use WebdriverIO using Sauce Labs, Browserstack, Testingbot or Kobiton. To run those tests make sure you have your credentials stored in your environment. If so just execute the file using node:

## webdriverio.saucelabs.js

```sh
export SAUCE_USERNAME="username"
export SAUCE_ACCESS_KEY="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
node ./examples/cloudservices/webdriverio.saucelabs.js
```

## webdriverio.browserstack.js

```sh
export BROWSERSTACK_USERNAME="username"
export BROWSERSTACK_ACCESS_KEY="XXXXXXXXXXXXXXXXXXXX"
node ./examples/cloudservices/webdriverio.browserstack.js
```

## webdriverio.testingbot.js

```sh
export TESTINGBOT_KEY="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
export TESTINGBOT_SECRET="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
node ./examples/cloudservices/webdriverio.testingbot.js
```

## webdriverio.kobiton.js
```sh
export KOBITON_USERNAME="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
export KOBITON_ACCESS_KEY="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
node ./examples/cloudservices/webdriverio.kobiton.js
```
