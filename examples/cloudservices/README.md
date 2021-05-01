# Cloudservices

Shows you how to use WebdriverIO using Sauce Labs, Browserstack, Testingbot or Kobiton. To run those tests make sure you have your credentials stored in your environment. Then change directory to the example folder:

```sh
cd ./examples/cloudservices
```

and run the demos by calling:

## saucelabs.js

```sh
export SAUCE_USERNAME="username"
export SAUCE_ACCESS_KEY="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
npm run test:saucelabs
```

## browserstack.js

```sh
export BROWSERSTACK_USERNAME="username"
export BROWSERSTACK_ACCESS_KEY="XXXXXXXXXXXXXXXXXXXX"
npm run test:browserstack
```

## testingbot.js

```sh
export TESTINGBOT_KEY="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
export TESTINGBOT_SECRET="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
npm run test:testingbot
```

## kobiton.js
```sh
export KOBITON_USERNAME="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
export KOBITON_ACCESS_KEY="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
npm run test:kobiton
```

## crossbrowsertesting.js

```sh
export CBT_USERNAME="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
export CBT_AUTHKEY="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
npm run test:crossbrowsertesting
```
