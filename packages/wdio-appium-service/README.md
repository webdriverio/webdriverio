WebdriverIO Appium Service
==========================

Handling the Appium server is out of the scope of the actual WebdriverIO project. This service helps you to run the Appium server seamlessly when running tests with the [WDIO testrunner](https://webdriver.io/docs/clioptions). It starts the [Appium Server](https://appium.io/docs/en/latest/quickstart/install/#starting-appium) in a child process.

## Installation

The easiest way is to keep `@wdio/appium-service` as a devDependency in your `package.json`, via:

```sh
npm install @wdio/appium-service --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here.](https://webdriver.io/docs/gettingstarted)

## Configuration

In order to use the service you need to add `appium` to your service array:

```js
// wdio.conf.js
export const config = {
    // ...
    port: 4723, // default appium port
    services: ['appium'],
    // ...
};
```

## Options

The following options can be added to the wdio.conf.js file. To define options for the service you need to add the service to the `services` list in the following way:

```js
// wdio.conf.js
export const config = {
    // ...
    port: 4723, // default appium port
    services: [
        ['appium', {
            // Appium service options here
            // ...
        }]
    ],
    // ...
};
```

### logPath
The path where all logs from the Appium server should be stored.

Type: `String`

Example:
```js
export const config = {
    // ...
    services: [
        ['appium', {
            logPath : './'
        }]
    ],
    // ...
}
```

### command
To use your installation of Appium, e.g. globally installed, specify the command which should be started.

Type: `String`

Example:
```js
export const config = {
    // ...
    services: [
        ['appium', {
            command : 'appium'
        }]
    ],
    // ...
}
```

### args
Map of arguments for the Appium server, passed directly to `appium`.

See [the documentation](https://appium.io/docs/en/latest/cli/args/) for possible arguments.
The arguments are supplied in lower camel case. For instance, `debugLogSpacing: true` transforms into `--debug-log-spacing`, or they can be supplied as outlined in the Appium documentation.

Type: `Object`

Default: `{}`

Example:
```js
export const config = {
    // ...
    services: [
        ['appium', {
            args: {
                // ...
                debugLogSpacing: true,
                platformName: 'iOS'
                // ...
            }
        }]
    ],
    // ...
}
```
**Note:** The utilization of aliases is discouraged and unsupported. Instead, please use the full property name in lower camel case.

## CLI Command

This package includes a CLI command to quickly start the Appium server and open the Appium Inspector in your browser. This makes it easier to work with Appium when using WebdriverIO.

### Usage

```sh
npx start-appium-inspector [options]
```

The command will:
- Check if the Appium Inspector plugin is installed (required for the Inspector to work)
- Automatically start the Appium server with the Inspector plugin enabled
- Open the Appium Inspector at `http://localhost:{port}/inspector` in your default browser
- Handle cleanup when you press `Ctrl+C`

### Prerequisites

Make sure you have Appium installed with the drivers you need:

```sh
# Install Appium globally
npm install -g appium

# Install drivers (examples)
appium driver install uiautomator2  # For Android
appium driver install xcuitest      # For iOS
```

Or install Appium locally in your project:

```sh
npm install --save-dev appium
```

**Important:** The Appium Inspector plugin must be installed for this CLI command to work. The command will automatically check if the plugin is installed before starting the server. If it's not installed, you'll see an error with instructions.

Install the Appium Inspector plugin:

```sh
# Add it as a local dependency
npm install --D appium-inspector-plugin

# Add it globally, depending on how you installed it before
appium plugin install inspector
```

For more information about installing and using the Appium Inspector plugin, see the [Appium Inspector documentation](https://appium.github.io/appium-inspector/latest/quickstart/installation/#appium-plugin).

### Examples

Start with default port (4723):
```sh
npx start-appium-inspector
```

Start with a custom port:
```sh
npx start-appium-inspector --port=8080
```

Pass additional Appium server arguments:
```sh
npx start-appium-inspector --port=4723 --base-path=/wd/hub --relaxed-security
```

The command accepts all standard Appium server arguments. For a complete list of available arguments, see the [Appium documentation](https://appium.io/docs/en/latest/cli/args/).

### Appium Inspector

The CLI automatically opens the Appium Inspector web application at `http://localhost:{port}/inspector`, which provides a GUI interface for inspecting and interacting with your mobile apps. The Inspector is served directly from the Appium server when the Inspector plugin is enabled. For more information about the Appium Inspector, visit the [Appium Inspector GitHub repository](https://github.com/appium/appium-inspector).

**Note:**
- The Appium Inspector requires CORS to be enabled on the Appium server. The CLI automatically adds the `--allow-cors` flag to ensure compatibility.
- The CLI uses the `--use-plugins=inspector` flag to enable the Appium Inspector plugin. Before running the command, make sure you have installed the Appium Inspector plugin (see Prerequisites above).

----

For more information on WebdriverIO see the [homepage](https://webdriver.io).
