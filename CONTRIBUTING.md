### We love pull requests. Here's a quick guide:

1. Fork the repo.

2. Run the tests. We only take pull requests with passing tests, and it's great
to know that you have a clean slate

3. Add a test for your change. Only refactoring and documentation changes
require no new tests. If you are adding functionality or fixing a bug, we need
a test!

4. Make the test pass.

5. Push to your fork and submit a pull request.

### How to run tests

1. Download the latest Selenium [standalone server](http://selenium-release.storage.googleapis.com/index.html)
   and run it via

   ```sh
   $ java -jar selenium-server-standalone-2.41.0.jar
   ```

2. Make sure you have all the dependencies installed

   ```sh
   $ npm install
   ```

   also all Bower packages required by our testpage

   ```sh
   $ cd test/site/www && bower install && cd ../../..
   ```

3. Start a local server that delivers our test page to the browser. We recommend to
   use [http-server](https://www.npmjs.org/package/http-server)

   ```sh
   $ http-server -p 8080
   ```

4. All local tests will be executed by [PhantomJS](http://phantomjs.org/download.html). Please
   also make sure that this is installed properly on your machine.

### Syntax rules

At this point you're waiting on us. We like to at least comment on, if not
accept, pull requests within three business days (and, typically, one business
day). We may suggest some changes or improvements or alternatives.

Please pay attention on the following syntax rules:

* Four spaces, no tabs.
* No trailing whitespace. Blank lines should not have any space.
* Prefer &&/|| over and/or.
* a = b and not a=b.
* Follow the conventions you see used in the source already.

And in case we didn't emphasize it enough: we love tests!