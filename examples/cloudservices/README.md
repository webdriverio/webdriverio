# Cloudservices

Shows you how to use WebdriverIO using Sauce Labs, Browserstack or Testingbot. To run those tests make sure
you have your credentials stored in your enviroment. If so just execute the file using node:

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
