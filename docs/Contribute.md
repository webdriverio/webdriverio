---
id: contribute
title: Contribute
---

You like WebdriverIO and want to help making it better? Awesome! We are working to make this process as easy and transparent as possible. We might be not quite there yet but this guide will help you to ramp you up as a contributor and give you everything you need to make your first contribution.

## Code of Conduct

Everyone who participates in this project, either as a user or a contributor, is obliged to follow the projects [Code of Conduct](https://github.com/webdriverio/webdriverio/blob/master/CODE_OF_CONDUCT.md). Every violation against it will be reviewed and investigated and will result in a response that is deemed necessary and appropriate to the circumstances. The project team is obligated to maintain confidentiality with regard to the reporter of an incident. Further details of specific enforcement policies may be posted separately.

## Requirements

We accept and appreciate any contribution, either big or small by anyone, with any title or any kind of experience.
In order to start contributing to the code we recommend to follow the [Set Up Project](https://github.com/webdriverio/webdriverio/blob/master/CONTRIBUTING.md#set-up-project) guide. Once all tests are passing you are ready to work on your first contribution.

__Note:__ If you struggle to follow the guide, join the WebdriverIO support channel on [Gitter](https://gitter.im/webdriverio/webdriverio) and reach out to the maintainer there. Don't be shy, they are there to help!

## Find A Way To Contribute

The project offers a variety of ways to contribute. You can participate by:

- contributing code
- improving documentation
- help out in the [Gitter](https://gitter.im/webdriverio/webdriverio) support channel
- create educational content (blog posts, tutorials, videos, etc.)
- spread the good word about the project (e.g. via Twitter)
- create bugs if you discover them while using WebdriverIO
- make feature requests if you are missing something in the project

The maintainers of the project try to organize all [issues](https://github.com/webdriverio/webdriverio/issues) in the way that should allow anyone to have enough context to start working on it. If this is not the case please mention it in the issue thread so that either the issue creator or a maintainer can provide more information.

If you want to contribute code, a general good first way to find a task to work on is to look into all tickets with the label [`help wanted`](https://github.com/webdriverio/webdriverio/labels/help%20wanted) and/or [`good first pick`](https://github.com/webdriverio/webdriverio/issues?q=is%3Aopen+label%3A%22good+first+pick%22+sort%3Aupdated-desc). All these tickets are up for grab if they haven't a user assigned to them. If you find something that interests you, ensure to let us know in the issue thread that you have the intend to work on it.

Often issues require some amount of context to the problem which makes it difficult to get an idea about what needs to be done. Depending on your expirience using / working with the project this context can be missing. Often it helps to start with tasks around missing documentation or just increase test coverage of some parts in the code. After some time you will get more familiar with the codebase which allows you to pick up more difficult tasks.

If you can't find something that suites you, look into the [project roadmap](https://github.com/webdriverio/webdriverio/blob/master/ROADMAP.md) to see if there is something interesting for you. At the end you can also _always_ reach out to the maintainer in the [Gitter](https://gitter.im/webdriverio/webdriverio) support channel. They are responsible to find a task for you.

## Proposing a Change

We are happy for every idea you have that improves the usability of the framework. If you have an idea about a new feature please raise a [feature request](https://github.com/webdriverio/webdriverio/issues/new?template=--feature-request.md) first to get feedback by the maintainer team on it. This lets us reach an agreement on your proposal before you put significant effort into it.

If you’re only fixing a bug, it’s fine to submit a pull request right away but we still recommend to file an issue detailing what you’re fixing. This is helpful in case we don’t accept that specific fix but want to keep track of the issue.

## Work With The Code

If you make any changes to the code you want to test it quickly to see if they do what you expect. There are a couple of ways to do that in WebdriverIO. For one, you can link single sub-packages into your own project to see if the changes you've made have the effect you expected. Find a guide on how to [link changes to your current project](https://github.com/webdriverio/webdriverio/blob/master/CONTRIBUTING.md#link-changes-to-your-current-project) in our contributing guide.

Another way to test changes in WebdriverIO is by using its [example directory](https://github.com/webdriverio/webdriverio/tree/master/examples) or by running its [smoke test suite](https://github.com/webdriverio/webdriverio/tree/master/tests). The example directory is a set of sample scripts that use WebdriverIO in various of ways. Here, you need to have a browser driver running to run the scripts. With the smoke test suite you can run various flavors of WebdriverIO within a predefined execution scenario. All of these scenarios are defined in our [WebDriver Mock Service](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-webdriver-mock-service) that mimics a browser driver by stubbing the endpoints with predefined responses. It is a great way to run WebdriverIO suites quickly without having to setup anything.

## Make a Pull Request

Once you have a fix implemented or finished a feature implementation you can make a pull request. Your changes needs to be pushed on your WebdriverIO fork. In the GitHub UI you should see a button popping up that allows you to raise a PR to the main repository.

We already provide a template for you to fill out. There are not many rules to follow here. just try to explain your change with as much detail as possible. Make sure that you have written enough unit tests for your changes otherwise the code coverage check will let the build fail.

Like in many Open Source projects we ask you to sign a __CLA__ which is a Contributor License Agreement that ensures that all contributions to the project are licensed under the project's respective open source license, which is MIT. It regulates the legal implications of you providing us (as the OpenJS Foundation) code changes.

The WebdriverIO maintainer will review your pull request as soon as possible. They will then either approve and merge your changes, request modifications or close with an explanation.
