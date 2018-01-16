name: docker
category: services
tags: guide
index: 13
title: WebdriverIO - Docker Service
---

Docker Service
===========================

This service allows user to seamlessly run test for/using a containerized application by utilizing a popular [Docker](https://www.docker.com/) service.
Currently it supports two modes of operation:
- using Docker to host Selenium (similar to Selenium Standalone Service)
- using Docker to run your containerized application

## Installation

The easiest way is to keep `wdio-docker-service` as a devDependency in your `package.json`.

```json
{
  "devDependencies": {
    "wdio-docker-service": "~1.x"
  }
}
```

You can simply do it by:

```bash
npm install wdio-docker-service --save-dev
```

## Configuration

By default, Google Chrome, Firefox and PhantomJS are available when installed on the host system. In order to use the service you need to add docker to your service array:

```js
// wdio.conf.js
exports.config = {
  // ...
  services: ['docker'],
  // ...
  // Options are set here as well
  dockerLogs: './logs',
  dockerOptions: { 
    image: 'selenium/standalone-chrome',
    healthCheck: 'http://localhost:4444',
    options: { 
      p: ['4444:4444'],
      shmSize: '2g'
    }    
  }
  //...
};
```

## Options

### dockerOptions
Various options required to run docker container

Type: `Object`

Default: `{ 
    options: {
        rm: true,
        cidfile: [path to cidfile]
    }
}`

Example:

```javascript
dockerOptions: {
    image: 'selenium/standalone-chrome',
    healthCheck: 'http://localhost:4444',
    options: {
        p: ['4444:4444'],
        shmSize: '2g'
    }
}
```

### dockerOptions.image
Docker container name tag. Could be local or from Docker HUB.

Type: `String`

Required: `true`

### dockerOptions.healthCheck
Url to an app exposed by your container. Normally this is a localhost url.
If healthCheck is not provided, Webdriver will start running tests immediately after Docker container is executed, which
maybe too early considering that it takes time for web service to start inside a Docker container.

Type: `String`

Example: `http://localhost:4444`

### dockerOptions.options
Map of options used by `docker run` command. For more details on `run` command click [here](https://docs.docker.com/edge/engine/reference/commandline/run/).

Any single-letter option will be converted to `-[option]` (i.e. `d: true` -> `-d`). 

Any option of two-character or more will
be converted to `--[option]` (i.e. `rm: true` -> `--rm`). 

For options that may be used more than once 
(i.e. `-e`,`-add-host`, `--expose`, etc.), please use array notation (i.e. `e: ["NODE_ENV=development", "FOO=bar"]`).

Type: `Object`

Example:

```javascript
options: {
    e: ['NODE_ENV=development', 'PROXY=http://myproxy:80']
    p: ['4444:4444', '5900:5900'],
    shmSize: '2g'
}
```

### dockerOptions.args
Any arguments you may want to pass into container. Corresponds to `[ARG...]` in Docker run CLI.

Type: `String`

### dockerOptions.command
Any command you may want to pass into container. Corresponds to `[COMMAND]` in Docker run CLI.

Type: `String`

### onDockerReady
A callback method which is called when Docker application is ready. Readiness is determined by ability to ping `healthCheck` url.

Type: `Function`

### dockerLogs
Path to where logs from docker container should be stored

Type: `String`

## Testing Use Cases / Recipes
Please visit our [Wiki](https://github.com/stsvilik/wdio-docker-service/wiki) for more details.
