# Contributing

This repository contains all necessary packages of the WebdriverIO project (excluding plugins that were contributed by 3rd party developers). These packages have individual descriptions in their README files (`/packages/<package>/README.md`) providing information about their scope and responsibilities. Even though the build commands might differ from package to package the way to work with these is the same. This project uses [Lerna](https://lerna.js.org/) to manage all its subprojects in this monolith repository.

We are trying to make contributing to this project as easy and transparent as possible. If there is any information missing that prevents you from sending in a pull request, please let us know. We treat these kind of issues like actual bugs.

Also if there is anything that needs to get simplified, also please let us know.

## Set Up Project

In order to set up this project and start contributing follow this step by step guide:

* Fork the project.
* Clone the project somewhere on your computer

    ```sh
    $ git clone git@github.com:<your-username>/webdriverio.git
    ```

* Switch to Node v8 (you should be able to use older/newer versions of Node but we recommend to use v8 so all developers are on the same side)

* Setup project:

    ```sh
    $ npm install
    $ npm run setup
    ```

    * Bootstraps sub-projects via ```npm run bootstrap```

        Many packages depend on each other, in order to properly set up the dependency tree you need to run the [Lerna Bootstrap](https://github.com/lerna/lerna#bootstrap) command to create all necessary links. As this project also does some other house keeping tasks it is recommend to use the package bootstrap command:

    * Builds all subpackages via ```npm run build```

        As the last step you need to build all sub-packages in order to resolve the internal dependencies. We also have a NPM command for that:

* Run Tests to ensure that everything is set up correctly

    ```sh
    $ npm run test

    # run test for a specific sub project (e.g. webdriver)
    $ ./node_modules/.bin/jest ./packages/webdriver/tests
    ```

    It should give you a passing result. Now you can move on to setup your development environment and start working on some code.

## Create New Package

All WebdriverIO sub packages require a certain structure to work within the wdio ecosystem. To simplify the process of creating a new sub package we build a NPM script that does all the boilerplate work for you. Just run:

```sh
$ npm run create
```

It will ask you about the type and name of the new package and creates all the files for you.

## Work On Packages

If you start making changes to specific packages, make sure you listen on file changes and transpile the code everytime you press save. To do that for all packages, run:

```sh
$ npm run watch
```

If you only work on a single package you can watch only for that one by calling:

```sh
# e.g. `$ npm run watch:pkg @wdio/runner`
$ npm run watch:pkg <package-name>
```

It is also a good idea to run jest in watch mode while developing on a single package to see if changes affect any tests:

```sh
$ ./node_modules/.bin/jest ./packages/<package-name>/tests --watch
```

## Link changes to your current project

When modifying core WebdriverIO packages you can link those changes to your current project to test the changes that you made.

If you are working on a package, lets say the @wdio/cli package, you can link this in the following way from the WebdriverIO repositority.

```
cd packages/wdio-cli
npm link
```

Then in your current project you can link your changes from the the @wdio/cli package to your current project.

```
cd your-main-test-code
npm link @wdio/cli
```

## Test Your Changes

In order to test certain scenarios this project has a test directory that allows you to run predefined test. It allows you to check your code changes while you are working on it. You find all these files in `/examples`. You find all necessary information [in there](https://github.com/webdriverio/webdriverio/tree/master/examples/README.md).

## Commit Messages Convention

In order to better identify which changes have been made to which package please add the package name in front of every commit, e.g.:

```sh
# e.g. `$ git commit -m "wdio-runner: some changes"`
git commit -m "<package-name>: some changes"
```

Commits that affect all packages or are not related to any (e.g. changes to NPM scripts or docs) don't need to follow this convention.

## Release New Version

Package releases are made using Lerna's release capabilities and executed by [the technical committee](https://github.com/webdriverio/webdriverio/blob/master/GOVERNANCE.md#the-technical-committee) only. Before you can start please export an `GITHUB_AUTH` token into your environment in order to allow [`lerna-changelog`](https://www.npmjs.com/package/lerna-changelog#github-token) to gather data about the upcoming release and autogenerate the [CHANGELOG.md](/CHANGELOG.md). Go to your [personal access token](https://github.com/settings/tokens) settings page and generate such token with only having the `public_repo` field enabled. Then export it into your environment:

```sh
export GITHUB_AUTH=...
```

You are now all set and just need to call:

```sh
# ensure to have pulled the latest code
$ git pull origin master
# release using Lerna
$ npm run release
```

and choose the appropriate version upgrade based on the [Semantic Versioning](https://semver.org/).
