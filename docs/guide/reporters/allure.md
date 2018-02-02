name: allure
category: reporters
tags: guide
index: 3
title: WebdriverIO - Allure Reporter
---

Allure Reporter
===============

The Allure Reporter creates [Allure](http://allure.qatools.ru/) test reports which is an HTML generated website with all necessary information to debug your test results and take a look on error screenshots. To use it just install it from NPM:

```js
$ npm install wdio-allure-reporter --save-dev
```

Then add `allure` to the `reporters` array in your wdio.conf.js and define the output directory of the allure reports:

```js
// wdio.conf.js
exports.config = {
    // ...
    reporters: ['dot', 'allure'],
    reporterOptions: {
        allure: {
            outputDir: 'allure-results'
        }
    },
    // ...
}
```

`outputDir` defaults to `./allure-results`. After a test run is complete, you will find that this directory has been populated with an `.xml` file for each spec, plus a number of `.txt` and `.png` files and other attachments.

## Displaying the report

The results can be consumed by any of the [reporting tools](http://wiki.qatools.ru/display/AL/Reporting) offered by Allure. For example:

### Jenkins

Install the [Allure Jenkins plugin](http://wiki.qatools.ru/display/AL/Allure+Jenkins+Plugin), and configure it to read from the correct directory:

![Configure Allure Reporter with Jenkins](https://github.com/webdriverio/wdio-allure-reporter/raw/master/docs/images/jenkins-config.png "Configure Allure Reporter with Jenkins")

Jenkins will then offer a link to the results from the build status page:

![Allure Link](https://github.com/webdriverio/wdio-allure-reporter/raw/master/docs/images/jenkins-results.png "Allure Link")

If you open a report at the first time you probably will notice that Jenkins won't serve the assets due to security restrictions. If that is the case go to Jenkins script console (`http://<your_jenkins_instance>/script`) and put in these security settings:

```
System.setProperty("hudson.model.DirectoryBrowserSupport.CSP", "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';")
System.setProperty("jenkins.model.DirectoryBrowserSupport.CSP", "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';")
```

Apply and restart the Jenkins server. All assets should now be served correctly.

### Command-line

Install the [Allure command-line tool](https://www.npmjs.com/package/allure-commandline), and process the results directory:

```sh
$ allure generate [allure_output_dir] && allure open
```

This will generate a report (by default in `./allure-report`), and open it in your browser:

![Allure Website](https://github.com/webdriverio/wdio-allure-reporter/raw/master/docs/images/browser.png "Allure Website")
