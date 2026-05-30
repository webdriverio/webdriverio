WDIO Logger Utility
===================

> A helper utility for logging of WebdriverIO packages

This package is used across all WebdriverIO packages to log information using the [`loglevel`](https://www.npmjs.com/package/loglevel) package. It can also be used for any other arbitrary Node.js project.

## Install

To install the package just call

```sh
npm install @wdio/logger
```

or when adding it to a WebdriverIO subpackage:

```sh
lerna add @wdio/logger --scope <subpackage>
```

## Usage

The package exposes a logger function that you can use to register an instance for your scoped package:

```js
import logger from '@wdio/logger'

const log = logger('myPackage')
log.info('some logs')
```

For more info see [`loglevel`](https://www.npmjs.com/package/loglevel) package on NPM.

## Custom Log Levels

This package extends the log levels available in [`loglevel`](https://www.npmjs.com/package/loglevel) by introducing a new level called `progress`.

The `progress` level is particularly useful when you need to dynamically update a specific line in the terminal. For example, it can be utilized to display the download progress of browsers or drivers.

Notably, the `progress` level is equivalent to the `info` level. Therefore, if you set the log level to `error` or `silent`, any `progress` logs will be suppressed.

It's important to mention that `progress` writes directly to `process.stdout`, and these logs won't be captured in any log files.

To ensure consistent formatting with subsequent logs while using `progress`, it's essential to clear it at the end. To do so, simply call `progress` with an empty string, which will clear the last line:

```
log.progress('')
```

### Illustrative Usage of Progress

```javascript
import logger from '@wdio/logger';

const log = logger('internal');

const totalSize = 100;
let uploadedSize = 0;

const uploadInterval = setInterval(() => {
	const chunkSize = 10;
	uploadedSize += chunkSize;
	const data = `Progress: ${(uploadedSize * 100) / totalSize}%`;
	log.progress(data);
	if (uploadedSize >= totalSize) {
		clearInterval(uploadInterval);
		log.progress(''); // Called at the end to maintain the alignment of subsequent logs.
		console.log('Upload complete.');
	}
}, 100);
```

## Masking Patterns

For more secure logging, `setMaskingPatterns`, `WDIO_LOG_MASKING_PATTERNS` or `maskingPatterns` can obfuscate sensitive information from the log.
For example, we can replace `--key=MySecretKey` with `--key=**MASKED**` to hide your cloud service access key or secret key
 - The regular expression pattern must be provided as a string similar as a RegEx but as string type, for example, `--key=[^ ]*`
 - It support flags and capturing groups like `/--key=([^ ]*)/i`
 - Multiple patterns are separated by a comma, like `--key=([^ ]*),secrets=([^ ]*)`
 - If no capturing group is provided, the entire matching string of the pattern is masked
 - If one or more capturing groups are provided, we replace all the matching groups with `**MASKED**`
 - If there are multiple matches for a single group, we replace them all, too
 - Support both masking in a file and the console
    - Note: In the console, when masking, some colors get stripped, which is a known limitation

`setMaskingPatterns` example
 ```javascript
import logger from '@wdio/logger';

// Default for all loggers
logger.setMaskingPatterns('/--key=([^ ]*)/i,/--secrets=([^ ]*)/i')

// For a specific logger
logger.setMaskingPatterns({'internal' : '/--key=([^ ]*)/i,/--secrets=([^ ]*)/i'})
const log = logger('internal');
```

Using wdio config from a `conf.ts` file, we can also configure masking patterns
```javascript
export const config: WebdriverIO.Config = {
    /**
     * test configurations
     */
    logLevel: 'debug',
    maskingPatterns: '/--key=([^ ]*)/i,/--secrets=([^ ]*)/i',
}
```

Below are examples with the environment variable `WDIO_LOG_MASKING_PATTERNS` in the code directly:

```javascript
// Using environment variable in code
process.env.WDIO_LOG_MASKING_PATTERNS = '/--key=([^ ]*)/i,/--secrets=([^ ]*)/i'
```

Or before your command line
```shell
WDIO_LOG_MASKING_PATTERNS='RESULT ([^ ]*)' npx wdio run ./wdio/wdio.conf.ts
```
