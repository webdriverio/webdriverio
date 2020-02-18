---
title: WebdriverIO v6 Released
author: Christian Bromann
authorURL: http://twitter.com/bromann
authorImageURL: https://s.gravatar.com/avatar/d98b16d7c93d15865f34a225dd4b1254?s=80
---

If you read this and are already about to freak out because you just spend a lot of time migrating to v5? Don't worry! This major update is far less "breaking" than the one last year.

> For everyone who started using WebdriverIO with v5 this might be a bit unclear. Due to a lot of changes from v4 to v5 in which we literally have rewritten the whole project, a lot people had issue upgrading their framework. While we unfortunately had no choice we also didn't want to cause that much trouble again this time.

This major update is much more reasonable and contains subtle changes that will help the project to further grow while running performant at the same time. This blog post will go into details about all major changes and will explain what you need to do to transition from your current version to the latest.

## Drop Node v8 Support ([`#4542`](https://github.com/webdriverio/webdriverio/pull/4542))

We dropped support for Node v8 which has been depcrecated by the Node.js team in the beginning of 2020. It is not recommend to run any systems using that version anymore. We strongly recommend to switch to Node v12 which will be supported until April 2022.

### How to Update?

To update Node.js it is important to know how it was installed in the first place. If you are in a Docker environment you can just upgrade the base image like:

```git
- FROM mhart/alpine-node:8
+ FROM mhart/alpine-node:12
```

We recommend to use [NVM](https://github.com/nvm-sh/nvm) (Node Version Manager) to install and manage Node.js versions. You can find a detailed description on how to install NVM and update Node in their [project readme](https://github.com/nvm-sh/nvm#installing-and-updating).

## `devtools` Automation Protocol is now Default

Because of the great success of automation tools like [Puppeteer](https://pptr.dev/) and [Cypress.io](https://www.cypress.io/) it became obvious that the [WebDriver](https://w3c.github.io/webdriver/) protocol in its current shape and form doesn't meet the requirements of todays developer and automation engineers. Members of the WebdriverIO project are part of the [W3C Working Group](https://www.w3.org/testing/browser/) that defines the WebDriver specification and they work together with browser vendors on solutions to improve the current state of the art. Thanks to folks from Microsoft there already proposals about a new [bidirectional connection](https://github.com/MicrosoftEdge/MSEdgeExplainers/tree/master/WebDriverRPC) similar to other automation protocols like [Chrome Devtools](https://chromedevtools.github.io/devtools-protocol/).

Until we have reached consenus between all browser vendors the project wants to offer alternative solutions which is why as off the release of v6, WebdriverIO will support Puppeteer natively using the same APIs. We already announced support for Puppeteer [last year](https://webdriver.io/blog/2019/09/16/devtools.html) and have now fully embedded it into the project. This means that to run a local test script you won't need to download a browser driver anymore. WebdriverIO checks if a driver is running and uses Puppeteer under the hood if not. If you use the WebdriverIO API the expirience using WebDriver vs Puppeteer should be the same, running commands on Puppeteer might even be a little faster.

> __Note:__ using Puppeteer as automation protocol is only supported if running tests locally and if the browser is located on the same machine where the tests are running.

The WebdriverIO team wants to emphasize that it supports all efforts on a true cross browser automation protocol that involves all parties to be part of the development. We have seen in the recent past that tools pushed forward their own agenda without communicating with other vendors in the industry.

### How to Update?

If you are running your tests on WebDriver already, nothing needs to be changed. WebdriverIO will only fallback to Puppeteer if it can't find a browser driver running.

## Performance Improvements



- TypeScript changes
- change default WebDriver path to `/`
