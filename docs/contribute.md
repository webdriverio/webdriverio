layout: single
title: WebdriverIO - Contribute
--------------

Contribute
==========

### We love pull requests. Here's a quick guide:

1. Fork the repo.

2. Run the tests. We only take pull requests with passing tests, and it's great
to know that you have a clean state

3. Add a test for your change. Only refactoring and documentation changes
require no new tests. If you are adding functionality or fixing a bug, we need
a test!

4. Make the test pass.

5. Push to your fork and submit a pull request.

### How to run tests

Download the latest Selenium [standalone server](http://selenium-release.storage.googleapis.com/index.html)
and run it via

```sh
$ java -jar selenium-server-standalone-2.46.0.jar
```

Make sure you have all the dependencies installed

```sh
$ npm install
```

also all Bower packages required by our testpage

```sh
$ cd test/site/www && bower install && cd ../../..
```

Start a local server that delivers our test page to the browser. We recommend to
use [http-server](https://www.npmjs.org/package/http-server)

```sh
$ cd /root/dir/of/webdriverio
$ http-server -p 8080
```

Depending on your feature/fix/patch make sure it gets covered by a test.
To ensure that you can run one of the following commands:

```sh
# if your patch is browser specific
# (e.g. upload files)
npm run test-desktop

# if your patch is mobile specific
# (e.g. flick or swipe tests)
npm run test-mobile

# if your patch is functional and hasn't something to do with Selenium
# (e.g. library specific fixes like changes within EventHandler.js)
npm run test-functional
```

While developing you can run tests on specific specs by passing another
environment variable `_SPEC`, e.g.

```sh
$ _SPEC=test/spec/YOURSPEC.js npm run test-desktop
```

### Syntax rules

At this point you're waiting on us. We like to at least comment on, if not
accept, pull requests within three business days (and, typically, one business
day). We may suggest some changes or improvements or alternatives.

Please pay attention on the following syntax rules:

- Four spaces, no tabs.
- No trailing whitespace. Blank lines should not have any space.
- Prefer `&&` / `||` over `and` / `or`.
- `a = b` and not `a=b`.
- Follow the conventions you see used in the source already.

And in case we didn't emphasize it enough: we love tests!
