name: webdrivercss
# category: plugins
tags: guide
title: WebdriverIO - WebdriverCSS
----

WebdriverCSS [![Version](http://img.shields.io/badge/version-v1.1.3-brightgreen.svg)](https://www.npmjs.org/package/webdrivercss) [![Build Status](https://travis-ci.org/webdriverio/webdrivercss.png?branch=master)](https://travis-ci.org/webdriverio/webdrivercss) [![Coverage Status](https://coveralls.io/repos/webdriverio/webdrivercss/badge.png?branch=master)](https://coveralls.io/r/webdriverio/webdrivercss?branch=master)
============

__CSS regression testing in WebdriverIO__. This plugin is an automatic visual regression-testing
tool for [WebdriverIO](http://webdriver.io). It was inspired by [James Cryer's](https://github.com/jamescryer)
awesome project called [PhantomCSS](https://github.com/Huddle/PhantomCSS). After
initialization it enhances a WebdriverIO instance with an additional command called
`webdrivercss` and enables the possibility to save screenshots of specific parts of
your application.

#### Never lose track of unwanted CSS changes:

![alt text](http://webdriver.io/images/webdrivercss/hero.png "Logo Title Text 1")


## How does it work?

1. Define areas within your application that should always look the same
2. Use WebdriverIO and WebdriverCSS to write some E2E tests and take screenshots of these areas
3. Continue working on your application or website
4. After a while rerun the tests
5. If desired areas differ from previous taken screenshots an image diff gets generated and you get notified in your tests


### Example

```js
var assert = require('assert');

// init WebdriverIO
var client = require('webdriverio').remote({desiredCapabilities:{browserName: 'chrome'}})
// init WebdriverCSS
require('webdrivercss').init(client);

client
    .init()
    .url('http://example.com')
    .webdrivercss('startpage',[
        {
            name: 'header',
            elem: '#header'
        }, {
            name: 'hero',
            elem: '//*[@id="hero"]/div[2]'
        }
    ], function(err, res) {
        assert.ifError(err);
        assert.ok(res.header[0].isWithinMisMatchTolerance);
        assert.ok(res.hero[0].isWithinMisMatchTolerance);
    })
    .end();
```

## Install

WebdriverCSS uses [GraphicsMagick](http://www.graphicsmagick.org/) for image processing. To install this
package you'll need to have it preinstalled on your system.

#### Mac OS X using [Homebrew](http://mxcl.github.io/homebrew/)
```sh
$ brew install graphicsmagick
```

#### Ubuntu using apt-get
```sh
$ sudo apt-get install graphicsmagick
```

#### Windows

Download and install executables for [GraphicsMagick](http://www.graphicsmagick.org/download.html).
Please make sure you install the right binaries desired for your system (32bit vs 64bit).

After these dependencies are installed you can install WebdriverCSS via NPM as usual:

```sh
$ npm install webdrivercss
$ npm install webdriverio # if not already installed
```

## Setup

To use this plugin just call the `init` function and pass the desired WebdriverIO instance
as parameter. Additionally you can define some options to configure the plugin. After that
the `webdrivercss` command will be available only for this instance.

* **screenshotRoot** `String` ( default: *./webdrivercss* )<br>
  path where all screenshots get saved.

* **failedComparisonsRoot** `String` ( default: *./webdrivercss/diff* )<br>
  path where all screenshot diffs get saved.

* **misMatchTolerance** `Number` ( default: *0.05* )<br>
  number between 0 and 100 that defines the degree of mismatch to consider two images as
  identical, increasing this value will decrease test coverage.

* **screenWidth** `Numbers[]` ( default: *[]* )<br>
  if set, all screenshots will be taken in different screen widths (e.g. for responsive design tests)

* **updateBaseline** `Boolean` ( default: *false* )<br>
  updates baseline images if comparison keeps failing.


### Example

```js
// create a WebdriverIO instance
var client = require('webdriverio').remote({
    desiredCapabilities: {
        browserName: 'phantomjs'
    }
}).init();

// initialise WebdriverCSS for `client` instance
require('webdrivercss').init(client, {
    // example options
    screenshotRoot: 'my-shots',
    failedComparisonsRoot: 'diffs',
    misMatchTolerance: 0.05,
    screenWidth: [320,480,640,1024]
});
```

## Usage

WebdriverCSS enhances an WebdriverIO instance with an command called `webdrivercss`

`client.webdrivercss('some_id', [{options}], callback);`

It provides options that will help you to define your areas exactly and exclude parts
that are unrelevant for design (e.g. content). Additionally it allows you to include
the responsive design in your regression tests easily. The following options are
available:

* **name** `String` (required)<br>
  name of the captured element

* **elem** `String`<br>
  only capture a specific DOM element, you can use all kinds of different [WebdriverIO selector strategies](http://webdriver.io/guide/usage/selectors.html) here

* **width** `Number`<br>
  define a fixed width for your screenshot

* **height** `Number`<br>
  define a fixed height for your screenshot

* **x** `Number`<br>
  take screenshot at an exact xy position (requires width/height option)

* **y** `Number`<br>
  take screenshot at an exact xy position (requires width/height option)

* **exclude** `String[]|Object[]`<br>
  exclude frequently changing parts of your screenshot, you can either pass all kinds of different [WebdriverIO selector strategies](http://webdriver.io/guide/usage/selectors.html)
  that queries one or multiple elements or you can define x and y values which stretch a rectangle or polygon

* **hide** `String[]`<br>
  hides all elements queried by all kinds of different [WebdriverIO selector strategies](http://webdriver.io/guide/usage/selectors.html) (via `visibility: hidden`)

* **remove** `String[]`<br>
  removes all elements queried by all kinds of different [WebdriverIO selector strategies](http://webdriver.io/guide/usage/selectors.html) (via `display: none`)

The following paragraphs will give you a more detailed insight how to use these options properly.

### Let your test fail when screenshots differ

When using this plugin you can decide how to handle design breaks. You can either just work
with the captured screenshots or you could even break your integration test at this position. The
following example shows how to handle design breaks within integration tests:

```js
var assert = require('assert');

describe('my website should always look the same',function() {

    it('header should look the same',function(done) {
        client
            .url('http://www.example.org')
            .webdrivercss('header', {
                name: 'header',
                elem: '#header'
            }, function(err,res) {
                assert.ifError(err);

                // this will break the test if screenshot is not within the mismatch tolerance
                assert.ok(res.isWithinMisMatchTolerance);
            })
            .call(done);
    });

    // ...
```

### [Applitools Eyes](http://applitools.com) Support

![Applitools Eyes](http://pravdam.biz/clientblogs/applitools2/applitools-new-logo.png)

Applitools Eyes is a comprehensive automated UI validation solution with really smart image matching algorithms
that are unique in this area. As a cloud service it makes your regression tests available everywhere and
accessible to everyone in your team, and its automated maintenance features simplify baseline maintenance.

In order to work with Applitools Eyes you need to sign up and obtain an API key. You can sign up for a
free account [here](http://applitools.com/signup/).

### Applitools Eyes Example

```js
var assert = require('assert');

// create a WebdriverIO instance
var client = require('webdriverio').remote({
    desiredCapabilities: {
        browserName: 'chrome'
    }
});

// initialise WebdriverCSS for `client` instance
require('webdrivercss').init(client, {
    key: '<your personal API key>'
});

client
    .init()
    .url('http://example.com')
    .webdrivercss('<app name>', {
        name: '<test name>',
        elem: '#someElement',
        // ...
    }, function(err, res) {
        assert.ifError(err);
        assert.equal(res.steps, res.strictMatches)
    })
    .end();
```

The following options might be interesting if you want to synchronize your taken images with
an external API. Checkout the [webdrivercss-adminpanel](https://github.com/webdriverio/webdrivercss-adminpanel)
for more information on that.

* **api** `String`
  URL to API interface
* **user** `String`
  user name (only necessary if API requires Basic Authentication or oAuth)
* **key** `String`
  assigned user key (only necessary if API requires Basic Authentication or oAuth)


### Define specific areas

The most powerful feature of WebdriverCSS is the possibility to define specific areas
for your regression tests. When calling the command, WebdriverCSS will always take a screenshot of
the whole website. After that it crops the image and creates a single copy for each element.
If you want to capture multiple images on one page make sure you pass an array of options to
the command. The screenshot capturing process can take a while depending on the document size
of the website. Once you interact with the page by clicking on links, open layers or navigating
to a new site you should call the `webdrivercss` command to take a new screenshot.

To query elements you want to capture you are able to choose all kinds of different [WebdriverIO selector strategies](http://webdriver.io/guide/usage/selectors.html) or you can
specify x/y coordinates to cover a more exact area.

```js
client
    .url('http://github.com')
    .webdrivercss('githubform', {
        name: 'github-signup',
        elem: '#site-container > div.marketing-section.marketing-section-signup > div.container > form'
    });
```

Will capture the following:

![alt text](http://webdriver.io/images/webdrivercss/githubform.png "Logo Title Text 1")

**Tip:** do right click on the desired element, then click on `Inspect Element`, then hover
over the desired element in DevTools, open the context menu and click on `Copy CSS Path` to
get the exact CSS selector

The following example uses xy coordinates to capture a more exact area. You should also
pass a screenWidth option to make sure that your xy parameters map perfect on the desired area.

```js
client
    .url('http://github.com')
    .webdrivercss('headerbar', {
        name: 'headerbar',
        x: 110,
        y: 15,
        width: 980,
        height: 34,
        screenWidth: [1200]
    });
```
![alt text](http://webdriver.io/images/webdrivercss/headerbar.png "Logo Title Text 1")


### Exclude specific areas

Sometimes it is unavoidable that content gets captured and from time to time this content
will change of course. This would break all tests. To prevent this you can
determine areas, which will get covered in black and will not be considered anymore. Here is
an example:

```js
client
    .url('http://tumblr.com/themes')
    .webdrivercss('tumblrpage', {
        name: 'startpage',
        exclude: ['#theme_garden > div > section.carousel > div.carousel_slides',
                 '//*[@id="theme_garden"]/div/section[3]',
                 '//*[@id="theme_garden"]/div/section[4]']
        screenWidth: [1200]
    });
```
![alt text](http://webdriver.io/images/webdrivercss/exclude.png "Logo Title Text 1")

Instead of using a selector strategy you can also exclude areas by specifying xy values
which form a rectangle.

```js
client
    .url('http://tumblr.com/themes')
    .webdrivercss('tumblrpage', {
        name: 'startpage',
        exclude: [{
            x0: 100, y0: 100,
            x1: 300, y1: 200
        }],
        screenWidth: [1200]
    });
```

If your exclude object has more then two xy variables, it will try to form a polygon. This may be
helpful if you like to exclude complex figures like:

```js
client
    .url('http://tumblr.com/themes')
    .webdrivercss('polygon', {
        name: 'startpage',
        exclude: [{
            x0: 120, y0: 725,
            x1: 120, y1: 600,
            x2: 290, y2: 490,
            x3: 290, y3: 255,
            x4: 925, y4: 255,
            x5: 925, y5: 490,
            x6: 1080,y6: 600,
            x7: 1080,y7: 725
        }],
        screenWidth: [1200]
    });
```
![alt text](http://webdriver.io/images/webdrivercss/exclude2.png "Logo Title Text 1")

### Keep an eye on mobile screen resolution

It is of course also important to check your design in multiple screen resolutions. By
using the `screenWidth` option WebdriverCSS automatically resizes the browser for you.
By adding the screen width to the file name WebdriverCSS makes sure that only shots
with same width will be compared.

```js
client
    .url('http://stephencaver.com/')
    .webdrivercss('startpage', {
        name: 'header',
        elem: '#masthead',
        screenWidth: [320,640,960]
    });
```

This will capture the following image at once:

![alt text](http://webdriver.io/images/webdrivercss/header.new.960px.png "Logo Title Text 1")

**file name:** header.960px.png

![alt text](http://webdriver.io/images/webdrivercss/header.new.640px.png "Logo Title Text 1")

**file name:** header.640px.png

![alt text](http://webdriver.io/images/webdrivercss/header.new.320px.png "Logo Title Text 1")

**file name:** header.320px.png

Note that if you have multiple tests running one after the other, it is important to change the first
argument passed to the `webdrivercss()` command to be unique, as WebdriverCSS saves time by remembering
the name of previously captured screenshots.

```js
// Example using Mocha
it('should check the first page',function(done) {
  client
    .init()
    .url('https://example.com')
    // Make this name unique.
    .webdrivercss('page1', [
      {
        name: 'test',
        screenWidth: [320,480,640,1024]
      }, {
        name: 'test_two',
        screenWidth: [444,666]
      }
    ])
    .end()
    .call(done);
});

it('should check the second page',function(done) {
  client
    // ...
    // Make this name unique.
    .webdrivercss('page2', [
      // ..
    ])
    // ...
);

```



### Synchronize your taken Images

If you want to have your image repository available regardless where you run your tests, you can
use an external API to store your shots. Therefor WebdriverCSS adds a `sync` function that downloads
the repository as tarball and unzips it. After running your tests you can call this function again
to zip the current state of your repository and upload it. Here is how this can look like:

```js
// create a WebdriverIO instance
var client = require('webdriverio').remote({
    desiredCapabilities: {
        browserName: 'phantomjs'
    }
});

// initialise WebdriverCSS for `client` instance
require('webdrivercss').init(client, {
    screenshotRoot: 'myRegressionTests',

    // Provide the API route
    api: 'http://example.com/api/webdrivercss'
});

client
    .init()
    .sync() // downloads last uploaded tarball from http://example.com/api/webdrivercss/myRegressionTests.tar.gz
    .url('http://example.com')

    // do your regression tests
    // ...

    .sync() // zips your screenshot root and uploads it to http://example.com/api/webdrivercss via POST method
    .end();
```

This allows you to run your regression tests with the same taken shots again and again, no matter where
your tests are executed. It also makes distributed testing possible. Regressions tests can be done not only
by you but everyone else who has access to the API.

#### API Requirements

To implement such API you have to provide two routes for synchronization:

* [GET] /some/route/:file
  Should response the uploaded tarball (for example: /some/root/myProject.tar.gz)
  Content-Type: `application/octet-stream`
* [POST] /some/route
  Request contains zipped tarball that needs to be stored on the filesystem

If you don't want to implement this by yourself, there is already such an application prepared, checkout
the [webdriverio/webdrivercss-adminpanel](https://github.com/webdriverio/webdrivercss-adminpanel) project.
It provides even a web interface for before/after comparison and stuff like this.

## Contributing
Please fork, add specs, and send pull requests! In lieu of a formal styleguide, take care to
maintain the existing coding style.

Default driver instance used for testing is [PhantomJS](https://github.com/ariya/phantomjs), so you need to either have
it installed, or change it to your preferred driver (e.g., Firefox) in the `desiredCapabilities` in the `bootstrap.js`
file under the `test` folder.

You also need a web server to serve the "site" files and have the root folder set to "webdrivercss". We use the
[http-server package](https://www.npmjs.org/package/http-server).
