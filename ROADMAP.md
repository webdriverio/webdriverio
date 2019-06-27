WebdriverIO Roadmap
===================

This document is designed to be a living record of the current and projected priorities for the WebdriverIO project. It is, of course, always subject to change and exists solely to give the community an idea of where we're going. The roadmap is set by the Technical Steering Committee (TSC) team. If you have feature suggestions for WebdriverIO or any of the `@wdio` packages, please submit a [GitHub issue](https://github.com/webdriverio/webdriverio/issues/new?template=--feature-request.md) and, if of sufficient size and approved by the team, it will be added here. If you have concerns about the roadmap, you can raise a GitHub issue. Note that bugfixes and miscellaneous features are not considered "roadmap projects", and will be addressed in the due course of normal project development. This page exists to outline large-scale future plans for WebdriverIO.

## Current Roadmap Projects

| Project | Description | ETD | PR / Issue |
|---------|-------------|-----|--------------------------|
|Cucumber Framework Support|A lot of people request support for Cucumber as it is their main framework choice. Initial work on this has already been done by the community. The code needs to get proper unit tests but would then be good to go.|Q2|https://github.com/webdriverio/webdriverio/pull/3667|

## Upcoming Projects (in no particular order)

| Project | Description |
|---------|-------------|
|[Jest Framework Support](https://github.com/webdriverio/webdriverio/projects/2)|Jest has become one of the most popular unit test framework in the JS ecosystem. Even though most of their features are not helpful in the e2e space there are some things (e.g. snapshot testing) that could help people writing better e2e tests. There has been some initial work done on this.|
|[Auto Driver Setup](https://github.com/webdriverio/webdriverio/projects/3)|One of the most challenging problems when working with WebDriver is the setup of the driver. Even though WebdriverIO provides services around this that help to get up and running easier, it is still difficult to set up for someone who has no idea about how everything is connected. To simplify this it would be desire-able if WebdriverIO handles downloading and running drivers for all environments.|
|[Better Debugging Capabilities](https://github.com/webdriverio/webdriverio/projects/4)|There are already a [handful options](https://webdriver.io/docs/debugging.html) to debug test code with WebdriverIO. However it is still not straight forward to use native Node.js debugging capabilities which requires special handling of workers and sub processes. Goal has to be that developers can use their IDEs to set breakpoints to debug.|
|[Integrating WebdriverIO is common use setup build tools](https://github.com/webdriverio/webdriverio/projects/5)|There are various of projects that help you to bootstrap a project from scratch (e.g. [create-react-app](https://github.com/facebook/create-react-app)). We should add WebdriverIO as e2e testing option in there which will help us to driver adoption.|
|[Parallelize tests on test block level vs. file level](https://github.com/webdriverio/webdriverio/projects/6)|We got numerous of requests to allow to parallelize test on a block level and not file level. A possible option would be to add [Ava](https://github.com/avajs/ava) as framework which comes with that kind of parallelization.|
|[Custom Assertion Library](https://github.com/webdriverio/webdriverio/projects/11)|To make assertion on elements or other objects simpler across all frameworks it would be nice if WebdriverIO would come with an native assertion library (similar how Jest or Jasmine provide one) embedded into the testrunner.|
|[Improve DevTools Service](https://github.com/webdriverio/webdriverio/projects/7)|The [@wdio/devtools-service](https://www.npmjs.com/package/@wdio/devtools-service) provides automation capabilities beyond WebDriver (e.g. get network logs, tracing, performance etc). There is a variety of things that can be added to help people test their applications (e.g. better mocking/stubbing of browser requests and responses). Also it would be desire-able if the service would work in Firefox and Edge in the same way.|
|[WebdriverIO Fiddle Platform](https://github.com/webdriverio/webdriverio/projects/8)|One of [community members](https://github.com/klamping) already started to build a fiddle ([try.webdriver.io](http://try.webdriver.io/)) for WebdriverIO. It is currently not working that well and needs more work. It would help tremendously to share test code snippets to identify issues in someones automation script. A Sauce Labs integration would also be possible here.|
|[More videos as documentation material](https://github.com/webdriverio/webdriverio/projects/9)|Add videos for setting up WebdriverIO, adding plugins and other use cases in the docs.|
|[Autogenerate Sample Files](https://github.com/webdriverio/webdriverio/projects/10)|Let's allow user to pre-setup an existing boilerplate so that they don't need to setup these files by themselves. The community has gathered a lot of useful boilerplate projects that we want to allow to act as baseline for the test setup using the configuration wizard or a new `wdio` command.|

## Completed Roadmap Projects

| Project | Description | Completed | WebdriverIO Release | Notes |
|---------|-------------|-----------|---------------------|-------|
|Make CLI tool more powerful|Adding simple add ons to the setup becomes difficult if the person is not familiar with the project or WebDriver in general. Adding some simple commands to the CLI interface that allows to add service and reporters and modifies the config would make the process of adding plugins much easier.|2019-06-06|[v5.10.0](https://github.com/webdriverio/webdriverio/blob/master/CHANGELOG.md#v5100-2019-06-06)|[#3915](https://github.com/webdriverio/webdriverio/issues/3915)|
