# Contributing

This repository contains all necessary packages of the WebdriverIO project (excluding plugins that were contributed by 3rd party developers). These packages have individual descriptions in their README files (`/packages/<package>/README.md`) providing information about their scope and responsibilities. Even though the build commands might differ from package to package the way to work with these is the same. This project uses [Lerna](https://lernajs.io/) to manage all its subprojects in this monolith repository.

We are trying to make contributing to this project as easy and transparent as possible. If there is any information missing that prevents you from sending in a pull request, please let us know. We treat these kind of issues like actual bugs.

Also if there is anything that needs to get simplified, also please let us know.

## Set Up Project

In order to set up this project and start contributing follow this step by step guide:

* Fork the project.
* Clone the project somewhere on your computer

    ```sh
    $ git clone git@github.com:<your-username>/webdriverio.git
    ```

    _Note_: this is currently a dev repository to keep making releases in the [original](https://github.com/webdriverio/webdriverio) project. Once we are at a state where this can be released we will force push this master branch to the webdriverio/webdriverio#master branch.

* Switch to Node v8 (you should be able to use older/newer versions of Node but we recommend to use v8 so all developers are on the same side)

* Setup project:

    ```sh
    $ cd ./webdriverio
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
# e.g. `$ npm run watch:pkg wdio-runner`
$ npm run watch:pkg <package-name>
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

Package releases are made using Lerna's release capabilities and executed by [the technical committee](https://github.com/webdriverio/webdriverio/blob/master/GOVERNANCE.md#the-technical-committee) only. To run it just call:

```sh
$ npm run release
```

and choose the appropiate version upgrade based on the [Semantic Versioning](https://semver.org/).
