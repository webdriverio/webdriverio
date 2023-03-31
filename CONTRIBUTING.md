# Contributing

You like WebdriverIO and want to help making it better? Awesome! We are working to make this process as easy and transparent as possible. We might be not quite there yet but this guide will help you to ramp you up as a contributor and give you everything you need to make your first contribution. If there is any information missing that prevents you from sending in a pull request, please let us know. We treat these kind of issues like actual bugs.

## Code of Conduct

Everyone who participates in this project, either as a user or a contributor, is obliged to follow the projects [Code of Conduct](https://github.com/webdriverio/webdriverio/blob/main/CODE_OF_CONDUCT.md). Every violation against it will be reviewed and investigated and will result in a response that is deemed necessary and appropriate to the circumstances. The project team is obligated to maintain confidentiality with regard to the reporter of an incident. Further details of specific enforcement policies may be posted separately.

## Find A Way To Contribute

The project offers a variety of ways to contribute. If you struggle to find something suited for you, join the WebdriverIO [support channel](https://matrix.to/#/#webdriver.io:gitter.im) on Matrix and reach out to the maintainer there. Don't be shy, they are there to help!

You can participate by:

- contributing code
- improving documentation
- help out in the [Matrix](https://matrix.to/#/#webdriver.io:gitter.im) support channel
- create educational content (blog posts, tutorials, videos, etc.)
- spread the good word about the project (e.g. via Twitter)
- create bugs if you discover them while using WebdriverIO
- make feature requests if you are missing something in the project
- if you'd like to support us monetarily, consider [donating to the project](https://webdriver.io/community/donate)

The maintainers of the project try to organize all [issues](https://github.com/webdriverio/webdriverio/issues) in the way that should allow anyone to have enough context to start working on it. If this is not the case please mention it in the issue thread so that either the issue creator or a maintainer can provide more information.

If you want to contribute code, a general good first way to find a task to work on is to look into all tickets with the label [`help wanted`](https://github.com/webdriverio/webdriverio/labels/help%20wanted) and/or [`good first pick`](https://github.com/webdriverio/webdriverio/issues?q=is%3Aopen+label%3A%22good+first+pick%22+sort%3Aupdated-desc). All these tickets are up for grab if they haven't a user assigned to them. If you find something that interests you, ensure to let us know in the issue thread that you have the intend to work on it.

Often issues require some amount of context to the problem which makes it difficult to get an idea about what needs to be done. Depending on your experience using / working with the project this context can be missing. Often it helps to start with tasks around missing documentation or just increase test coverage of some parts in the code. After some time you will get more familiar with the codebase which allows you to pick up more difficult tasks.

If you can't find something that suits you, look into the [project roadmap](https://github.com/webdriverio/webdriverio/blob/main/ROADMAP.md) to see if there is something interesting for you. At the end you can also _always_ reach out to the maintainers in the [Matrix](https://matrix.to/#/#webdriver.io:gitter.im) support channel. They are responsible to find a task for you.

## Reporting New Issues

When [opening a new issue](https://github.com/webdriverio/webdriverio/issues/new/choose), always make sure to fill out the issue template. __This step is very important!__ Not doing so may result in your issue not managed in a timely fashion. Don't take this personally if this happens, and feel free to open a new issue once you've gathered all the information required by the template.

- __One issue, one bug:__ Please report a single bug per issue.
- __Provide reproduction steps:__ List all the steps necessary to reproduce the issue. The person reading your bug report should be able to follow these steps to reproduce your issue with minimal effort.

### Security Bugs

See [SECURITY.md](https://github.com/webdriverio/webdriverio/blob/main/.github/SECURITY.md).

## Proposing a Change

We are happy for every idea you have that improves the usability of the framework. If you have an idea about a new feature please raise a [feature request](https://github.com/webdriverio/webdriverio/issues/new?template=--feature-request.md) first to get feedback by the maintainer team on it. This lets us reach an agreement on your proposal before you put significant effort into it.

If you’re only fixing a bug, it’s fine to submit a pull request right away, but we still recommend to file an issue detailing what you’re fixing. This is helpful in case we don’t accept that specific fix but want to keep track of the issue.

### Work With The Code

If you make any changes to the code, you want to test it quickly to see if they do what you expect. There are a couple of ways to do that in WebdriverIO. For one, you can link single sub-packages into your own project to see if the changes you've made have the effect you expected.

Another way to test changes in WebdriverIO is by using its [example directory](https://github.com/webdriverio/webdriverio/tree/main/examples) or by running its [smoke test suite](https://github.com/webdriverio/webdriverio/tree/main/tests). The example directory is a set of sample scripts that use WebdriverIO in various of ways. Here, you need to have a browser driver running to run the scripts. With the smoke test suite you can run various flavors of WebdriverIO within a predefined execution scenario. All of these scenarios are defined in our [WebDriver Mock Service](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-webdriver-mock-service) that mimics a browser driver by stubbing the endpoints with predefined responses. It is a great way to run WebdriverIO suites quickly without having to setup anything.

### Make a Pull Request

Once you have a fix implemented or finished a feature implementation you can make a pull request. Your changes needs to be pushed on your WebdriverIO fork. In the GitHub UI you should see a button popping up that allows you to raise a PR to the main repository.

We already provide a template for you to fill out. There are not many rules to follow here. Just try to explain your change with as much detail as possible. Make sure that you have written enough unit tests for your changes otherwise the code coverage check will let the build fail.

Like in many Open Source projects we ask you to sign a __CLA__ which is a Contributor License Agreement that ensures that all contributions to the project are licensed under the project's respective open source license, which is MIT. It regulates the legal implications of you providing us (as the OpenJS Foundation) code changes.

The WebdriverIO maintainer will review your pull request as soon as possible. They will then either approve and merge your changes, request modifications or close with an explanation.

#### Set Up Project

You can immediately start working on the code using [a pre-setup Gitpod environment](https://gitpod.io/#https://github.com/webdriverio/webdriverio) (read more on this [here](https://bromann.dev/post/development-environment-for-webdriverio/)). If you like to develop on the project locally follow this step by step guide:

* Fork the project.
* Clone the project somewhere on your computer

    ```sh
    $ git clone git@github.com:<your-username>/webdriverio.git
    ```

* On Windows, you need to set git config `core.symlinks` to `true` as we currently have some symbolic links for type definition committed to our repo.
  - To set git config globally: `git config --global --add core.symlinks true`
  - To set git config locally when cloning the repo: `git -c core.symlinks=true clone git@github.com:<your-username>/webdriverio.git`.

  See [https://github.com/git-for-windows/git/wiki/Symbolic-Links](https://github.com/git-for-windows/git/wiki/Symbolic-Links) for more information

* If you need to update your fork you can do so following the steps [here](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/syncing-a-fork)

* Switch to the most recent Node LTS (you should be able to use older/newer versions of Node but we recommend to use v18 LTS so all developers are on the same side) or to the one denoted in `.nvmrc`. We recommend to use [`nvm`](https://github.com/nvm-sh/nvm) to switch between Node.js versions.

* Set up the project:
    First make sure you have the right Node.js version installed. You can find the current defined development version in `.nvmrc` within the root directory of the project. The easiest way to handle multiple Node.js versions is by using [NVM](https://github.com/nvm-sh/nvm). After it is installed you can run:
    ```sh
    $ nvm install
    ```

    This will install the defined Node.js version for you. You can then go ahead and set-up the project via:

    ```sh
    $ npm install
    $ npm run setup-full
    ```

    The second command does two things:

    * Cleans (possible) existing build artifacts via ```npm run clean```

        If you have compiled the code this command will remove them as well as all dependencies of the subpackages.

    * Bootstraps sub-projects via ```npm run bootstrap```

        Many packages depend on each other, in order to properly set up the dependency tree you need to run the [Lerna Bootstrap](https://github.com/lerna/lerna#bootstrap) command to create all necessary links. As this project also does some other house keeping tasks, it is recommended to use the package bootstrap command.

    * Builds all subpackages via ```npm run build```

        As the last step you need to build all sub-packages in order to resolve the internal dependencies. WebdriverIO uses [TypeScript](https://www.typescriptlang.org/) as a compiler.

* Run Tests to ensure that everything is set up correctly

    ```sh
    # run the complete unit test suite
    $ npm run test

    # run test for a specific sub project (e.g. webdriver)
    $ npx vitest ./packages/webdriver/tests
    ```

    It should give you a passing result. Now you can move on to set up your development environment and start working on some code. If tests do not pass please create an issue and provide logs to the error.

#### Work On Packages

If you start making changes to specific packages, make sure you listen to file changes and transpile the code every time you press save. To do that for all packages, run:

```sh
npm run watch
```

If you only work on a single package, you can watch only for that one by calling:

```sh
# e.g. `$ npm run watch wdio-runner`
$ npm run watch <package-name>
```

It is also a good idea to run vitest in watch mode while developing on a single package to see if changes affect any tests:

```sh
npx vitest ./packages/<package-name>/tests
```

#### TypeScript Definitions

WebdriverIO uses TypeScript to ensure that code is statically typed and common mistakes misusing them are avoided. If you are new to TypeScript have a look at [these awesome essential resources](https://github.com/dzharii/awesome-typescript#awesome-typescript-essential-resources) to get started with it.

WebdriverIO provides its own type definitions for projects that use TypeScript. Given the large amount of commands it would make it unmaintainable to __not__ automate the process of generating these. However there are certain edge cases where manual work is required.

All type definitions are generated by the TypeScript compiler. There are some essential packages for that:

- the `@wdio/types` package provides all general types that are used across the code based, e.g. Capabilities, Options etc. If you need a type definitions across multiple packages it is a good idea to define them in here
- the `@wdio/protocol` package defines all protocol commands, their function parameters and return types
- all other types should be defined in the package where they are used, here we tend to have general types defined in a `types.ts` file

You can find all files responsible for the generating the typings [here](https://github.com/webdriverio/webdriverio/tree/main/scripts/type-generation). You can trigger the process by calling:

```sh
npm run generate:typings
```

This will run the scripts in the directory shown above and generate the typings for all protocol commands. Whenever you change those [protocol commands](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-protocols/src/protocols), make sure you re-generate the types with the command shown above.

### Test Changes

For the development on the WebdriverIO code base you can use examples files that have been created by the maintainers in the [examples directory](https://github.com/webdriverio/webdriverio/tree/main/examples). They cover various use cases and are setup so that they a run with the code from the repository. Let's say you make changes to the WDIO testrunner and want to see if they are applied correctly you can just run the testrunner examples by calling:

```sh
cd ./examples/wdio
$ npm run test:mocha
```

This will run a simple test suite using the testrunner with Mochajs. There are similar examples for other frameworks, custom services and reporters as well as using the devtools protocol as the automation engine. Feel free to add examples if they help testing features you are working on.

#### Test Pipeline

When a PR gets submitted, WebdriverIO runs the following checks:

- *Dependency Checks*
  We automatically check if every sub-package has all the dependencies from its `package.json` installed.
  You can manually trigger this check by calling:
  ```sh
  $ npm run test:depcheck
  ```
- *ESLint*
  A common ESLint test to align code styles and detect syntax errors early.
  You can manually trigger this check by calling:
  ```sh
  $ npm run test:eslint
  ```
- *TypeScript Definition Tests*
  As we generate our type definitions, we want to be cautious that the generated definitions actually define the interface as expected. Read more
  on that at [Testing Type Definitions](#testing-type-definitions).
  You can manually trigger this check by calling:
  ```sh
  $ npm run test:typings
  ```
- *Unit Tests*
  Like every project we unit-test our code and ensure that new patches are properly tested. The coverage threshold is pretty high so ensure that
  your changes cover all necessary code paths. We are using [Vitest](https://vitest.dev/) as a unit test framework here.
  You can manually trigger this check by calling:
  ```sh
  $ npm run test:unit
  ```
- *Smoke Tests*
  While unit tests already cover a lot of cases, we run in addition to that smoke tests that simulate test scenarios which are difficult to test
  on a unit level as they include functionality of dependencies that are stubbed out in unit tests. Such scenarios are, for example, proper
  test retries or failure handling. Smoke tests run actual e2e tests where the driver is being stubbed (via [`@wdio/smoke-test-service`](https://github.com/webdriverio/webdriverio/blob/main/packages/wdio-smoke-test-service/package.json)) to return fake results.
  You can manually trigger this check by calling:
  ```sh
  $ npm run test:smoke
  ```
- *e2e Tests*
  Last but not least, we run actual e2e tests with a real browser to ensure that our WebDriver DevTools implementation is working as expected. These
  tests spin up headless Chrome and Firefox browsers to test the commands implemented in the `devtools` package. Given that the WebDriver functionality
  is already tested with [WPT](https://github.com/web-platform-tests/wpt), we don't need to do it there.
  In order to run these tests, an installation of [Firefox Nightly](https://www.mozilla.org/en-US/firefox/channel/desktop/#nightly) and [Google Chrome](https://www.google.com/chrome/) is required.
  You can manually trigger this check by calling:
  ```sh
  $ npm run test:e2e
  ```

#### Unit Tests

The project tries to keep a high test coverage to ensure that changes to code are intentional and well thought through. Therefore "normally" there is a unit test file for every code file, located in a test directory. For example the unit tests for:

```
packages/webdriverio/src/commands/element/getCSSProperty.ts
```

are located in

```
packages/webdriverio/tests/commands/element/getCSSProperty.test.ts
```

If that is not the case the functionality of that file might be tested through a different file. We recommend to write unit tests for every new function being written in the code base. We advise to mock out every dependency to either other packages or modules using [Vitests mock capabilities](https://vitest.dev/guide/mocking.html).

During development it makes sense to focus running unit tests for a single file rather the whole code base. For example if you work on the `getCSSProperty` command it makes sense to run only the unit test for that specific command by calling:

```sh
npx vitest packages/webdriverio/tests/commands/element/getCSSProperty.test.ts
```

With the `--watch` flag the unit tests will be re-run as soon as you change something within the file.

#### Run e2e Experience With Smoke Tests

WebdriverIO maintains a set of smoke test suites that allows to represent the full e2e experience of a user running the wdio testrunner. It is set up in a way so it doesn't require an actual browser driver since all requests are mocked using the [`@wdio/webdriver-mock-service`](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-webdriver-mock-service). This offers you an opportunity to run a wdio test suite without setting up a browser driver and a test page. You can run all smoke tests via:

```sh
npm run test:smoke
```

There is one [`smoke.runner.js`](https://github.com/webdriverio/webdriverio/blob/main/tests/smoke.runner.js) file that triggers all tests. It contains several [test suites](https://github.com/webdriverio/webdriverio/blob/main/tests/smoke.runner.js#L365-L384) defined that run in different environments, e.g. Mocha, Jasmine and Cucumber. You can run a specific test suite by calling, e.g.:

```sh
npm run test:smoke mochaTestrunner
```

Every of these test suites are functions that trigger the wdio testrunner programmatically using the [`launch`](https://github.com/webdriverio/webdriverio/blob/main/tests/helpers/launch.js) helper method. All you need to pass in is a path to your config file and with what you want to overwrite the config. Most of the smoke test use a [common config file](https://github.com/webdriverio/webdriverio/blob/main/tests/helpers/config.js) and overwrite properties specific for their use case.

If you test custom WebDriver commands, you can define your own scenario of mock responses in the [`@wdio/webdriver-mock-service`](https://github.com/webdriverio/webdriverio/blob/main/packages/wdio-webdriver-mock-service/src/index.js#L136-L147).

#### Testing Type Definitions

To make sure that we don't accidentally change the types and cause users' test to break, we run some simple TypeScript checks. You can run all the type definition tests by running:

```sh
npm run test:typings
```

This will run all the tests for all the type definitions WebdriverIO provides. These tests just check if TypeScript can compile them according to the generated type definitions. All the type checks are located in `/webdriverio/tests/typings`. If you extend a WebdriverIO command or interfaces for other type definitions, please ensure that you have used it in these files. The directory contains tests for the asynchronous usage of WebdriverIO.

For example, to test the `touchActions` properties, we have it tested in `/tests/typings/webdriverio/async.ts`:

```ts
// touchAction
const ele = await $('')
const touchAction: WebdriverIO.TouchAction = {
    action: "longPress",
    element: await $(''),
    ms: 0,
    x: 0,
    y: 0
}
await ele.touchAction(touchAction)
await browser.touchAction(touchAction)
```

as well as in `/tests/typings/sync/sync.ts`:

```ts
const ele = $('')
const touchAction: WebdriverIO.TouchAction = {
    action: "longPress",
    element: $(''),
    ms: 0,
    x: 0,
    y: 0
}
ele.touchAction(touchAction)
browser.touchAction(touchAction)
```

## Documentation

This repository contains everything to set up, build and deploy the WebdriverIO documentation pages. We are using [Docusaurus](https://docusaurus.io/) (v2) to generate the page. The content is generated based off:

- the guidelines pages from markdown files of the [docs directory](https://github.com/webdriverio/webdriverio/tree/main/website/docs)
- service and reporter docs from the readme files of those packages within this repository
- service and reporter docs from 3rd party plugins (defined in [these JSON files](https://github.com/webdriverio/webdriverio/tree/main/scripts/docs-generation/3rd-party)) that are downloaded from GitHub and parsed
- the protocol APIs from the [`@wdio/protocols`](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-protocols/src/protocols) package
- the WebdriverIO API that is parsed out of the JSDoc comments of individual commands (e.g., [`execute`](https://github.com/webdriverio/webdriverio/blob/main/packages/webdriverio/src/commands/browser/execute.ts#L3-L37) command)

Changes to the docs need to be done in one of these places. Please note that changes to e.g. the config file have to be updated in multiple places given that config files are wide spread (as examples or test files) within this repository. A good way to go about this is to look for all occurrences of a certain string of the config and update changes in all findings.

### Deploying the Documentation Locally

After you have [set up the project](https://github.com/webdriverio/webdriverio/blob/main/CONTRIBUTING.md#set-up-project) you can go into the `website` directory to set up the docs page and run it on your local machine. To do so, run:

```sh
cd website
$ npm install
$ npm start
```

This will set up everything needed to run the page on [`localhost:3000`](http://localhost:3000/). If you need to run on a different host or port, pass them as additional arguments to npm start, like `-- --host 0.0.0.0`.

You can now modify the content of the [`/website/docs`](https://github.com/webdriverio/webdriverio/tree/main/website/docs) files as well as change styles and templates. The page will be automatically updated. If you add documentation in other places, you have to rerun the `npm start` script to re-generate the docs.

### Deploying the Documentation in Production

Every time a new release is pushed to GitHub the WebdriverIO docs need to be build and re-deployed to the project's S3 bucket. The process is defined in a GitHub Actions [pipeline](https://github.com/webdriverio/webdriverio/blob/main/.github/workflows/deploy.yml). All you need to do (as maintainer) is to trigger the pipeline. The rest is handled by the workflow.

## Create New Package

All WebdriverIO sub packages require a certain structure to work within the wdio ecosystem. To simplify the process of creating a new sub package, we built an NPM script that does all the boilerplate work for you. Just run:

```sh
npm run create
```

It will ask you about the type and name of the new package and create all the files for you.

## Back-Porting Bug Fixes

Starting from v6 the WebdriverIO team tries to backport all features that would be still backwards compatible with older versions. The team tries to release a new major version every year (usually around December/January). With a new major version update (e.g. v7) we continue to maintain the last version (e.g. v6) and deprecate the previous maintained version (e.g. v5, v4 and lower). With that the team commits to always support 2 major versions.

### As a Triager

Everyone triaging or reviewing a PR should label it with `backport-requested` if the changes can be applied to the maintained (previous) version. Generally every PR that would not be a breaking change for the previous version should be considered to be ported back. If a change relies on features or code pieces that are only available in the current version, then a back port can still be considered if you feel comfortable making the necessary adjustments. That said, don't feel forced to back port code if the time investment and complexity is too high. Backporting functionality is a reasonable contribution that can be made by any contributor.

### As a Merger

Once a PR with a `backport-requested` label got merged, you are responsible for backporting the patch to the older version. To do so, pull the latest code from GitHub:

```sh
git pull
$ git fetch --all
$ git checkout v6
```

Before you can start, please export an `GITHUB_AUTH` token into your environment in order to allow the executing script to fetch data about pull requests and set proper labels. Go to your [personal access token](https://github.com/settings/tokens) settings page and generate such a token with only having the `public_repo` field enabled. Then export it into your environment and run the backport script. It fetches all commits connected with PRs that are labeled with `backport-requested` and cherry-picks them into the maintenance branch. Via an interactive console you can get the chance to review the PR again and whether you want to backport it or not. To start the process, just execute:

```sh
npm run backport
```

If during the process a cherry-pick fails, you can always abort and manually troubleshoot. If you are not able to resolve the problem, create an issue in the repo and include the author of that PR. A successful backport of two PRs will look like this:

```
$ npm run backport

> webdriverio-monorepo@ backport /path/to/webdriverio/webdriverio
> node ./scripts/backport.js

? You want to backport "Backporting Test PR" by christian-bromann?
(See PR https://github.com/webdriverio/webdriverio/pull/4890) Yes
Backporting sha 264b7bc49dfc3fe8f1ed8b58d681ce562aaf1544 from v6 to v5
[cb-backport-process e47c5527] Backporting Test PR (#4890)
 Author: Christian Bromann <mail@christian-bromann.com>
 Date: Mon Dec 16 14:54:02 2019 +0100
 1 file changed, 2 insertions(+)
? You want to backport "Second backport test" by christian-bromann?
(See PR https://github.com/webdriverio/webdriverio/pull/4891) Yes
Backporting sha 77dc52fdb86c51242b92f299998d2904004cb347 from v6 to v5
[cb-backport-process 35a3ad41] Second backport test (#4891)
 Author: Christian Bromann <mail@christian-bromann.com>
 Date: Mon Dec 16 16:01:46 2019 +0100
 1 file changed, 2 deletions(-)

Successfully backported 2 PRs 👏!
Please now push them to `v6` and make a new v6.x release!
```

You can always reach out to the `webdriverio/ProjectCommitters` channel on Matrix for questions.

## Release New Version

Package releases are made using Lerna's release capabilities as GitHub workflow and executed by the [technical steering committee](https://github.com/webdriverio/webdriverio/blob/main/GOVERNANCE.md#the-technical-committee) only. All you need to do is go to the [`Manual NPM Publish`](https://github.com/webdriverio/webdriverio/actions/workflows/publish.yml) workflow and trigger a new run. Choose the appropriate version upgrade based on the [Semantic Versioning](https://semver.org/). To help choose the right release type, here are some general guidelines:

- __Breaking Changes__: never do these by yourself! A major release is always a collaborative effort between all TSC members. It requires consensus from all of them.
- __Minor Release__: minor releases are always required if a new, user focused feature was added to one of the packages. For example, if a command was added to WebdriverIO or if a service provides a new form of integration, a minor version bump would be appropriate. However if an internal package like `@wdio/local-runner` exposes a new interface that is solely used internally, we can consider that as a patch release.
- __Patch Release__: every time a bug is fixed, documentation (this includes TypeScript definitions) gets updated or existing functionality is improved, we should do a patch release.

If you are unsure about which release type to pick, reach out in the `webdriverio/TSC` Matrix channel. By setting an NPM tag you can also release a current version with e.g. a `next` tag to test changes before we roll them out to all users.

## Workshop

As part of the [OpenJS World 2020](https://events.linuxfoundation.org/openjs-world/) [Collaborator Summit](https://openjscs2020.sched.com/event/cf2J/contributing-to-webdriverio-christian-bromann) the WebdriverIO team hosted a workshop on "Contributing to WebdriverIO" that can help you get familiar with the code base and the project. Have a watch:

<iframe width="100%" height="600" src="https://www.youtube.com/embed/QaA5C1Y4BH0" frameborder="0" allowFullScreen></iframe>

[This repository](https://github.com/webdriverio/webdriverio) contains all necessary packages of the WebdriverIO project (excluding plugins that were contributed by 3rd party developers). These packages have individual descriptions in their README files (`/packages/<package>/README.md`) providing information about their scope and responsibilities. Even though the build commands might differ from package to package the way to work with these is the same. This project uses [Lerna](https://lerna.js.org/) to manage all its subprojects in this monolith repository.
