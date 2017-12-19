# Contributing

This repository contains all necessary packages to use the WebdriverIO test framework. These packages have individual descriptions in their README files (`/packages/<package>/README.md`). Even though the build commands might differ from package to package the way to work with these is the same. This project uses [Lerna](https://lernajs.io/) to manage all its subprojects in this monolith repository.

We are trying to make contributing to this project as easy and transparent as possible. If there is any information missing that prevents you from sending in a pull request, please let us know. We treat these kind of issues like actual bugs.

Also if there is anything that needs to get simplified, also please let us know.

## Set Up Project

In order to set up this project and start contributing follow this step by step guide:

1. Fork the project.
2. Clone the project somewhere on your computer

    ```sh
    $ git clone git@github.com:<your-username>/v5.git
    ```

    _Note_: this is currently a dev repository to keep making releasing in the [original](https://github.com/webdriverio/webdriverio) project. Once we are at a state where this can be release we will force push to master.

3. Switch to Node v8 (you should be able to use older/newer versions of Node but we recommend to use v8 so all developers are on the same side)
4. Install Dependencies

    ```sh
    $ cd ./v5
    $ npm install
    ```

5. Bootstrap sub-projects: many packages depend on each other, in order to properly set up the dependency tree you need to run the [Lerna Bootstrap](https://github.com/lerna/lerna#bootstrap) command to create all necessary links. As this project also does some other house keeping tasks it is recommend to use the package bootstrap command:

    ```sh
    $ npm run bootstrap
    ```

6. As the last step you need to build all sub-packages in order to resolve the internal dependencies. We also have a NPM command for that:

    ```sh
    $ npm run build
    ```

6. You are all set now. To ensure that everything is set up correctly run the unit tests:

    ```sh
    $ npm run test
    ```

It should give you a passing result.

## Work On Packages

If you start making changes to specific packages, make sure you listen on file changes and transpile the code everytime you press safe. For that it is recommended to use [Lernas exec](https://github.com/lerna/lerna#exec) command to run the watch task on a specific package:

```sh
# e.g. run watch task on changes for `/packages/webdriver` package
lerna exec 'npm run compile -- --watch' --scope=webdriver
```
