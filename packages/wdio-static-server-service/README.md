WebdriverIO Static Server Service
=================================

Some projects are front-end assets only, and don't run on more than a static server. This service helps you to run a static file server during testing.

## Installation

The easiest way is to add `@wdio/static-server-service` as a `devDependency` in your `package.json`:

```bash
npm install @wdio/static-server-service --save-dev
```

After that, your `package.json` should include the following:

```json
{
    "devDependencies": {
        "@wdio/static-server-service": "^5.11.0"
    }
}
```

Instructions on how to install `WebdriverIO` can be found [here](https://webdriver.io/docs/gettingstarted.html).

## Configuration

To use the static server service, add `static-server` to your service array:

```js
// wdio.conf.js
export.config = {
    // ...
    services: ['static-server'],
    // ...
};
```

## Options

### `staticServerFolders` (required)

Array of folder paths and mount points.

Type: `Array<Object>`
Props:
 - mount `{String}` - URL endpoint where folder will be mounted.
 - path `{String}` - Path to the folder to mount.

``` javascript
 // wdio.conf.js
 export.config = {
    // ...
    services: [
        ['static-server', {
            staticServerFolders: [
                { mount: '/fixtures', path: './tests/fixtures' },
                { mount: '/dist', path: './dist' },
            ]
        }]
    ],
    // ...
 };
```

### `staticServerPort`

Port to bind the server.

Type: `Number`

Default: `4567`

### `staticServerLog`

Debugging logs, will print mount points and requests. When `staticServerLogs` is set to `true`, it will print to the console. Otherwise, a string is treated as the log folder.

Type: `Boolean` or `String`

### `staticServerMiddleware`

Array of middleware objects. Load and instatiate these in the config, and pass them in for the static server to use.

Type: `Array<Object>`
Props:
 - mount `{String}` - URL endpoint where middleware will be mounted.
 - middleware `<Object>` - Middleware function callback.

Default: `[]`

``` javascript
// wdio.conf.js
const middleware = require('middleware-package')

export.config = {
    // ...
    services: [
        ['static-server', {
            staticServerMiddleware: [{
                mount: '/',
                middleware: middleware(/* middleware options */),
            }],
        }]
    ],
    // ...
};
```

----

For more information on WebdriverIO, see the [homepage](http://webdriver.io).
