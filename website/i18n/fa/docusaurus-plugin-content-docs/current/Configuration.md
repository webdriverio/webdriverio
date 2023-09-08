---
id: configuration
title: پیکربندی
---

بر اساس [تنظیم نوع](/docs/setuptypes) (مثلاً با استفاده از اتصال پروتکل خام، WebdriverIO به عنوان بسته مستقل و اجرا کننده تست WDIO) مجموعه متفاوتی از گزینه ها برای کنترل محیط وجود دارد.

## گزینه های WebDriver

هنگام استفاده از بسته پروتکل [`webdriver`](https://www.npmjs.com/package/webdriver) گزینه های زیر تعریف می شوند:

### protocol

پروتکل مورد استفاده در هنگام برقراری ارتباط با سرور درایور.

Type: `String`<br /> Default: `http`

### hostname

میزبان سرور درایور شما.

Type: `String`<br /> Default: `localhost`

### port

پورتی که سرور درایور شما روی آن است.

Type: `Number`<br /> Default: `4444`

### path

مسیری به سرور درایور شما.

Type: `String`<br /> Default: `/`

### queryParams

پارامترهای درخواست که به سرور درایور انتشار می یابند.

Type: `Object`<br /> Default: `null`

### user

نام کاربری سرویس ابری شما (فقط برای اکانت های [Sauce Labs](https://saucelabs.com), [Browserstack](https://www.browserstack.com), [TestingBot](https://testingbot.com), [CrossBrowserTesting](https://crossbrowsertesting.com) or [LambdaTest](https://www.lambdatest.com) کار می کند). در صورت تنظیم، WebdriverIO به طور خودکار ویژگی های اتصال را برای شما تنظیم می کند. اگر از ارائه‌دهنده ابری استفاده نمی‌کنید، می‌توان از آن برای احراز هویت هر بک اند WebDriver دیگری استفاده کرد.

Type: `String`<br /> Default: `null`

### key

کلید دسترسی به سرویس ابری یا کلید مخفی شما (فقط برای اکانت های [Sauce Labs](https://saucelabs.com), [Browserstack](https://www.browserstack.com), [TestingBot](https://testingbot.com), [CrossBrowserTesting](https://crossbrowsertesting.com) or [LambdaTest](https://www.lambdatest.com) کار می کند). در صورت تنظیم، WebdriverIO به طور خودکار ویژگی های اتصال را برای شما تنظیم می کند. اگر از ارائه‌دهنده ابری استفاده نمی‌کنید، می‌توان از آن برای احراز هویت هر بک اند WebDriver دیگری استفاده کرد.

Type: `String`<br /> Default: `null`

### capabilities

قابلیت(Capability) هایی را که می خواهید در جلسه WebDriver خود اجرا کنید را تعریف می کند. برای جزئیات بیشتر، پروتکل [WebDriver](https://w3c.github.io/webdriver/#capabilities) را بررسی کنید. اگر درایور قدیمی‌تری را اجرا می‌کنید که از پروتکل WebDriver پشتیبانی نمی‌کند، برای اجرای موفقیت‌آمیز یک جلسه، باید از قابلیت‌های [JSONWireProtocol](https://github.com/SeleniumHQ/selenium/wiki/DesiredCapabilities) استفاده کنید.

در کنار قابلیت‌های مبتنی بر WebDriver، می‌توانید گزینه‌هایی که خاص یک مرورگر و یا سازنده خاصی است را اعمال کنید که امکان پیکربندی عمیق‌تر را برای مرورگر یا دستگاه در راه دور فراهم می‌کند. اینها در اسناد سازنده مربوطه مستند شده اند، به عنوان مثال:

- `goog:chromeOptions`: for [Google Chrome](https://chromedriver.chromium.org/capabilities#h.p_ID_106)
- `moz:firefoxOptions`: for [Mozilla Firefox](https://firefox-source-docs.mozilla.org/testing/geckodriver/Capabilities.html)
- `ms:edgeOptions`: for [Microsoft Edge](https://docs.microsoft.com/en-us/microsoft-edge/webdriver-chromium/capabilities-edge-options#using-the-edgeoptions-class)
- `sauce:options`: for [Sauce Labs](https://docs.saucelabs.com/dev/test-configuration-options/#desktop-and-mobile-capabilities-sauce-specific--optional)
- `bstack:options`: for [BrowserStack](https://www.browserstack.com/automate/capabilities?tag=selenium-4#)
- `selenoid:options`: for [Selenoid](https://github.com/aerokube/selenoid/blob/master/docs/special-capabilities.adoc)

علاوه بر این، یک ابزار مفید Sauce Labs [Automated Test Configurator](https://wiki.saucelabs.com/display/DOCS/Platform+Configurator#/) است که به شما کمک می کند این شی را با کلیک کردن روی قابلیت های مورد نظر خود ایجاد کنید.

Type: `Object`<br /> Default: `null`

**مثال:**

```js
{
    browserName: 'chrome', // options: `firefox`, `chrome`, `opera`, `safari`
    browserVersion: '27.0', // browser version
    platformName: 'Windows 10' // OS platform
}
```

اگر تست های وب یا بومی را روی دستگاه های تلفن همراه اجرا می کنید، `قابلیت(Capability)` با پروتکل WebDriver متفاوت است. برای جزئیات بیشتر به [Appium Docs](https://appium.github.io/appium.io/docs/en/writing-running-appium/caps/) مراجعه کنید.

### logLevel

سطح و میزان لاگ.

Type: `String`<br /> Default: `info`<br /> Options: `trace` | `debug` | `info` | `warn` | `error` | `silent`

### outputDir

دایرکتوری برای ذخیره همه فایل‌های لاگ اجرا کننده تست (از جمله لاگ‌های گزارش‌دهنده ها و `لاگ wdio`). اگر تنظیم نشود، همه گزارش‌ها به `stdout` ارسال می‌شوند. از آنجایی که اکثر گزارش‌دهنده ها برای لاگ در `stdout`ساخته شده اند، توصیه می شود از این گزینه فقط برای گزارش‌دهنده های خاصی استفاده شود که در آن انتقال گزارش به یک فایل منطقی تر است (مثلاً گزارش‌دهنده `junit`).

هنگامی که در حالت مستقل اجرا می شود، تنها گزارشی که توسط WebdriverIO ایجاد می شود، گزارش `wdio` خواهد بود.

Type: `String`<br /> Default: `null`

### connectionRetryTimeout

مهلت زمانی برای هر درخواست WebDriver به درایور یا شبکه.

Type: `Number`<br /> Default: `120000`

### connectionRetryCount

حداکثر تعداد درخواست‌های مجدد به سرور سلنیوم.

Type: `Number`<br /> Default: `3`

### agent

به شما امکان می دهد از یک عامل سفارشی `http`/`https`/`http2` [](https://www.npmjs.com/package/got#agent) برای درخواست استفاده کنید.

Type: `Object`<br /> Default:

```js
{
    http: new http.Agent({ keepAlive: true }),
    https: new https.Agent({ keepAlive: true })
}
```

### headers

مشخص کردن `headers` های سفارشی برای ارسال با هر درخواست WebDriver و هنگام اتصال به مرورگر از طریق Puppeteer با استفاده از پروتکل CDP.

:::caution

این header ها به درخواست مرورگر منتقل __نمی شوند__. اگر به دنبال اصلاح هدر درخواست، برای درخواست های مرورگر هستید، لطفاً در [#6361](https://github.com/webdriverio/webdriverio/issues/6361) شرکت کنید!

:::

Type: `Object`<br /> Default: `{}`

### transformRequest

تابعی برای intercept کردن [ویژگی های درخواست HTTP](https://github.com/sindresorhus/got#options) قبل از درخواست WebDriver

Type: `(RequestOptions) => RequestOptions`<br /> Default: *none*

### transformResponse

تابعی برای intercept اشیاء در پاسخ HTTP پس از رسیدن پاسخ WebDriver. تابع به شیء پاسخ اصلی به عنوان اولین و `RequestOptions` مربوطه به عنوان آرگومان دوم ارسال می شود.

Type: `(Response, RequestOptions) => Response`<br /> Default: *none*

### strictSSL

آیا برای معتبر بودن به گواهی SSL نیاز هست یا خیر. می توان آن را از طریق متغیرهای محیطی به صورت `STRICT_SSL` یا `strict_ssl` تنظیم کرد.

Type: `Boolean`<br /> Default: `true`

### enableDirectConnect

فعال کردن [ویژگی اتصال مستقیم Appium](https://appiumpro.com/editions/86-connecting-directly-to-appium-hosts-in-distributed-environments). اگر در حالی که پرچم فعال است، پاسخ کلیدهای مناسبی نداشته باشد، کاری انجام نمی دهد.

Type: `Boolean`<br /> Default: `true`

---

## WebdriverIO

گزینه های زیر (از جمله موارد ذکر شده در بالا) را می توان با WebdriverIO به صورت مستقل استفاده کرد:

### automationProtocol

تعریف پروتکلی که می خواهید برای اتوماسیون مرورگر خود استفاده کنید. در حال حاضر فقط [`webdriver`](https://www.npmjs.com/package/webdriver) و [`devtools`](https://www.npmjs.com/package/devtools) پشتیبانی می شوند، زیرا اینها فناوری های اصلی اتوماسیون مرورگر موجود هستند.

اگر می‌خواهید مرورگر را با استفاده از `devtools` خودکار کنید، مطمئن شوید که بسته NPM را نصب کرده‌اید (`$ npm install --save-dev devtools`).

Type: `String`<br /> Default: `webdriver`

### baseUrl

با تنظیم یک URL پایه، فراخوانی دستور های `url` را کوتاه کنید.
- اگر پارامتر `url` شما با `/`شروع می شود، `baseUrl` به قبل اضافه می شود (به جز مسیر `baseUrl`، اگر مسیری وجود داشته باشد دارد).
- اگر پارامتر `url` بدون شماتیک یا `/` (مثل`some/path`) شروع می شود، سپس `baseUrl` کامل مستقیما اضافه می شود.

Type: `String`<br /> Default: `null`

### waitforTimeout

مهلت زمانی پیش‌فرض برای همه دستورات ` waitFor*`. (به کوچک بودن حرف `f` در نام گزینه توجه کنید.) این مهلت __فقط__ بر دستوراتی که با `waitFor*` شروع می شوند و در زمان انتظار پیش فرض آنها تأثیر می گذارد.

برای افزایش زمان برای _یک تست_، لطفاً به اسناد فریمورک مراجعه کنید.

Type: `Number`<br /> Default: `3000`

### waitforInterval

فاصله پیش‌فرض برای همه دستورات `waitFor*` برای بررسی اینکه آیا وضعیت مورد انتظار (مثلاً visibility) تغییر کرده است یا خیر.

Type: `Number`<br /> Default: `500`

### region

اگر در Sauce Labs اجرا می‌شود، می‌توانید تست‌ها را بین مراکز داده مختلف اجرا کنید: ایالات متحده یا اتحادیه اروپا. برای تغییر منطقه خود به اتحادیه اروپا، `region: 'eu'` را به پیکربندی خود اضافه کنید.

__توجه:__ این فقط در صورتی تأثیر می گذارد که `user` و `key` را ارائه دهید که به حساب Sauce Labs شما متصل شده باشند.

Type: `String`<br /> Default: `us`

*(فقط برای vm و یا em/شبیه سازها)*

---

## Testrunner Options

گزینه‌های زیر (از جمله موارد ذکر شده در بالا) فقط برای اجرای WebdriverIO با تست‌کننده WDIO تعریف شده‌اند:

### specs

تعریف spec ها برای اجرای تست. یک الگوی glob را برای مطابقت با چندین فایل به صورت یکباره مشخص کنید، یا یک glob یا مجموعه ای از مسیرها را در یک آرایه جمع کنید تا آنها را در یک worker process اجرا کنید. همه مسیرها از مسیر فایل پیکربندی به صورت نسبی دیده می شوند.

Type: `(String | String[])[]`<br /> Default: `[]`

### exclude

مستثنی کردن spec ها برای اجرای تست. همه مسیرها از مسیر فایل پیکربندی به صورت نسبی دیده می شوند.

Type: `String[]`<br /> Default: `[]`

### suites

یک شی که مجموعه های مختلفی را توصیف می کند، که سپس می توانید با گزینه `--suite` در `wdio` CLI آن را مشخص کنید.

Type: `Object`<br /> Default: `{}`

### capabilities

مانند بخش `capabilities` که در بالا توضیح داده شد. با این تفاوت که گزینه ای وجود دارد برای تعیین گزینه [`multiremote`](multiremote) شیء و یا چندین WebDriver Session در یک آرایه برای اجرای موازی.

می‌توانید همان قابلیت‌های خاص سازنده و مرورگر را که [در بالا](/docs/configuration#capabilities) توضیح داده شده است، اعمال کنید.

Type: `Object`|`Object[]`<br /> Default: `[{ maxInstances: 5, browserName: 'firefox' }]`

### maxInstances

حداکثر تعداد کل worker ها در حال اجرا موازی.

__توجه:__ ممکن است عددی به زیادی `100`باشد، زمانی که تست ها بر روی برخی از فروشندگان خارجی مانند دستگاه های Sauce Labs انجام می شود. در آنجا، تست ها بر روی یک ماشین واحد آزمایش نمی شوند، بلکه روی چندین ماشین مجازی تست می شوند. اگر قرار است آزمایش‌ها روی یک ماشین توسعه محلی اجرا شوند، از عددی استفاده کنید که معقول‌تر است، مانند `4`، `3`، یا `5`. اساساً، این تعداد مرورگرهایی است که همزمان راه‌اندازی می‌شوند و آزمایش‌های شما را همزمان اجرا می‌کنند، بنابراین بستگی به میزان رم دستگاه شما و تعداد برنامه‌های دیگر در حال اجرا در دستگاه شما دارد.

Type: `Number`<br /> Default: `100`

### maxInstancesPerCapability

حداکثر تعداد کل worker ها در حال اجرا موازی در هر capability.

Type: `Number`<br /> Default: `100`

### injectGlobals

اضافه کردن متغییر های جهانی WebdriverIO (مثلاً `browser`، `$` و `$$`). اگر روی `false`تنظیم کنید، باید آنها را از `@wdio/globals` وارد کنید، به عنوان مثال:

```ts
import { browser, $, $$, expect } from '@wdio/globals'
```

توجه: WebdriverIO کاری با تزریق متغیر های جهانی فریمورک ها ندارد.

Type: `Boolean`<br /> Default: `true`

### bail

اگر می خواهید اجرای تست‌های شما پس از تعداد معینی از شکست متوقف شود، از `bail` استفاده کنید. (به طور پیش‌فرض روی `0`قرار می‌گیرد، که همه تست‌ها را بدون توجه به هر اتفاقی اجرا می‌کند.) **توجه:** لطفاً توجه داشته باشید که هنگام استفاده از اجرا کننده تست شخص ثالث (مانند موکا)، ممکن است به پیکربندی اضافی نیاز باشد.

Type: `Number`<br /> Default: `0` (don't bail; run all tests)

### specFileRetries

تعداد دفعات امتحان مجدد کل یک فایل زمانی که به طور کلی ناموفق است.

Type: `Number`<br /> Default: `0`

### specFileRetriesDelay

چند ثانیه تأخیر بین تلاش‌های مجدد فایل تست

Type: `Number`<br /> Default: `0`

### specFileRetriesDeferred

اینکه آیا فایل‌های تکرار شده باید فوراً دوباره امتحان شوند یا به انتهای صف موکول شوند.

Type: `Boolean`<br /> Default: `true`

### services

سرویس ها کار خاصی را به عهده می گیرند که شما نمی خواهید از آن مراقبت کنید. آنها تقریباً بدون هیچ تلاشی تنظیمات تست شما را بهبود می بخشند.

Type: `String[]|Object[]`<br /> Default: `[]`

### framework

فریمورک تستی را برای استفاده توسط اجرا کننده تست WDIO تعریف می‌کند.

Type: `String`<br /> Default: `mocha`<br /> Options: `mocha` | `jasmine`

### mochaOpts, jasmineOpts and cucumberOpts


Specific framework-related options. See the framework adapter documentation on which options are available. Read more on this in [Frameworks](frameworks).

Type: `Object`<br /> Default: `{ timeout: 10000 }`

### cucumberFeaturesWithLineNumbers

List of cucumber features with line numbers (when [using cucumber framework](./Frameworks.md#using-cucumber)).

Type: `String[]` Default: `[]`

### reporters

List of reporters to use. A reporter can be either a string, or an array of `['reporterName', { /* reporter options */}]` where the first element is a string with the reporter name and the second element an object with reporter options.

Type: `String[]|Object[]`<br /> Default: `[]`

Example:

```js
reporters: [
    'dot',
    'spec'
    ['junit', {
        outputDir: `${__dirname}/reports`,
        otherOption: 'foobar'
    }]
]
```

### reporterSyncInterval

Determines in which interval the reporter should check if they are synchronized if they report their logs asynchronously (e.g. if logs are streamed to a 3rd party vendor).

Type: `Number`<br /> Default: `100` (ms)

### reporterSyncTimeout

Determines the maximum time reporters have to finish uploading all their logs until an error is being thrown by the testrunner.

Type: `Number`<br /> Default: `5000` (ms)

### execArgv

Node arguments to specify when launching child processes.

Type: `String[]`<br /> Default: `null`

### filesToWatch

A list of glob supporting string patterns that tell the testrunner to have it additionally watch other files, e.g. application files, when running it with the `--watch` flag. By default the testrunner already watches all spec files.

Type: `String[]`<br /> Default: `[]`

### autoCompileOpts

Compiler options when using WebdriverIO with TypeScript or Babel.

#### autoCompileOpts.autoCompile

If set to `true` the WDIO testrunner will automatically try to transpile the spec files.

Type: `Boolean` Default: `true`

#### autoCompileOpts.tsNodeOpts

Configure how [`ts-node`](https://www.npmjs.com/package/ts-node) is suppose to transpile the files.

Type: `Object` Default: `{ transpileOnly: true }`

#### autoCompileOpts.babelOpts

Configure how [@babel/register](https://www.npmjs.com/package/@babel/register) is suppose to transpile the files.

Type: `Object` Default: `{}`

## Hooks

The WDIO testrunner allows you to set hooks to be triggered at specific times of the test lifecycle. This allows custom actions (e.g. take screenshot if a test fails).

Every hook has as parameter specific information about the lifecycle (e.g. information about the test suite or test). Read more about all hook properties in [our example config](https://github.com/webdriverio/webdriverio/blob/master/examples/wdio.conf.js#L183-L326).

**Note:** Some hooks (`onPrepare`, `onWorkerStart`, `onWorkerEnd` and `onComplete`) are executed in a different process and therefore can not share any global data with the other hooks that live in the worker process.

### onPrepare

Gets executed once before all workers get launched.

Parameters:

- `config` (`object`): WebdriverIO configuration object
- `param` (`object[]`): list of capabilities details

### onWorkerStart

Gets executed before a worker process is spawned and can be used to initialize specific service for that worker as well as modify runtime environments in an async fashion.

Parameters:

- `cid` (`string`): capability id (e.g 0-0)
- `caps` (`object`): containing capabilities for session that will be spawn in the worker
- `specs` (`string[]`): specs to be run in the worker process
- `args` (`object`): object that will be merged with the main configuration once worker is initialized
- `execArgv` (`string[]`): list of string arguments passed to the worker process

### onWorkerEnd

Gets executed just after a worker process has exited.

Parameters:

- `cid` (`string`): capability id (e.g 0-0)
- `exitCode` (`number`): 0 - success, 1 - fail
- `specs` (`string[]`): specs to be run in the worker process
- `retries` (`number`): number of retries used

### beforeSession

Gets executed just before initializing the webdriver session and test framework. It allows you to manipulate configurations depending on the capability or spec.

Parameters:

- `config` (`object`): WebdriverIO configuration object
- `caps` (`object`): containing capabilities for session that will be spawn in the worker
- `specs` (`string[]`): specs to be run in the worker process

### before

Gets executed before test execution begins. At this point you can access to all global variables like `browser`. It is the perfect place to define custom commands.

Parameters:

- `caps` (`object`): containing capabilities for session that will be spawn in the worker
- `specs` (`string[]`): specs to be run in the worker process
- `browser` (`object`): instance of created browser/device session

### beforeSuite

Hook that gets executed before the suite starts

Parameters:

- `suite` (`object`): suite details

### beforeHook

Hook that gets executed *before* a hook within the suite starts (e.g. runs before calling beforeEach in Mocha)

Parameters:

- `test` (`object`): test details
- `context` (`object`): test context (represents World object in Cucumber)

### afterHook

Hook that gets executed *after* a hook within the suite ends (e.g. runs after calling afterEach in Mocha)

Parameters:

- `test` (`object`): test details
- `context` (`object`): test context (represents World object in Cucumber)
- `result` (`object`): hook result (contains `error`, `result`, `duration`, `passed`, `retries` properties)

### beforeTest

Function to be executed before a test (in Mocha/Jasmine only).

Parameters:

- `test` (`object`): test details
- `context` (`object`): scope object the test was executed with

### beforeCommand

Runs before a WebdriverIO command gets executed.

Parameters:

- `commandName` (`string`): command name
- `args` (`*`): arguments that command would receive

### afterCommand

Runs after a WebdriverIO command gets executed.

Parameters:

- `commandName` (`string`): command name
- `args` (`*`): arguments that command would receive
- `result` (`number`): 0 - command success, 1 - command error
- `error` (`Error`): error object if any

### afterTest

Function to be executed after a test (in Mocha/Jasmine) ends.

Parameters:

- `test` (`object`): test details
- `context` (`object`): scope object the test was executed with
- `result.error` (`Error`): error object in case the test fails, otherwise `undefined`
- `result.result` (`Any`): return object of test function
- `result.duration` (`Number`): duration of test
- `result.passed` (`Boolean`): true if test has passed, otherwise false
- `result.retries` (`Object`): information about spec related retries, e.g. `{ attempts: 0, limit: 0 }`
- `result` (`object`): hook result (contains `error`, `result`, `duration`, `passed`, `retries` properties)

### afterSuite

Hook that gets executed after the suite has ended

Parameters:

- `suite` (`object`): suite details

### after

Gets executed after all tests are done. You still have access to all global variables from the test.

Parameters:

- `result` (`number`): 0 - test pass, 1 - test fail
- `caps` (`object`): containing capabilities for session that will be spawn in the worker
- `specs` (`string[]`): specs to be run in the worker process

### afterSession

Gets executed right after terminating the webdriver session.

Parameters:

- `config` (`object`): WebdriverIO configuration object
- `caps` (`object`): containing capabilities for session that will be spawn in the worker
- `specs` (`string[]`): specs to be run in the worker process

### onComplete

Gets executed after all workers got shut down and the process is about to exit. An error thrown in the onComplete hook will result in the test run failing.

Parameters:

- `exitCode` (`number`): 0 - success, 1 - fail
- `config` (`object`): WebdriverIO configuration object
- `caps` (`object`): containing capabilities for session that will be spawn in the worker
- `result` (`object`): results object containing test results

### onReload

Gets executed when a refresh happens.

Parameters:

- `oldSessionId` (`string`): session ID of the old session
- `newSessionId` (`string`): session ID of the new session

### beforeFeature

Runs before a Cucumber Feature.

Parameters:

- `uri` (`string`): path to feature file
- `feature` ([`GherkinDocument.IFeature`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/json-to-messages/javascript/src/cucumber-generic/JSONSchema.ts#L8-L17)): Cucumber feature object

### afterFeature

Runs after a Cucumber Feature.

Parameters:

- `uri` (`string`): path to feature file
- `feature` ([`GherkinDocument.IFeature`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/json-to-messages/javascript/src/cucumber-generic/JSONSchema.ts#L8-L17)): Cucumber feature object

### beforeScenario

Runs before a Cucumber Scenario.

Parameters:

- `world` ([`ITestCaseHookParameter`](https://github.com/cucumber/cucumber-js/blob/ac124f7b2be5fa54d904c7feac077a2657b19440/src/support_code_library_builder/types.ts#L10-L15)): world object containing information on pickle and test step
- `context` (`object`): Cucumber World object

### afterScenario

Runs after a Cucumber Scenario.

Parameters:

- `world` ([`ITestCaseHookParameter`](https://github.com/cucumber/cucumber-js/blob/ac124f7b2be5fa54d904c7feac077a2657b19440/src/support_code_library_builder/types.ts#L10-L15)): world object containing information on pickle and test step
- `result` (`object`): results object containing scenario results
- `result.passed` (`boolean`): true if scenario has passed
- `result.error` (`string`): error stack if scenario failed
- `result.duration` (`number`): duration of scenario in milliseconds
- `context` (`object`): Cucumber World object

### beforeStep

Runs before a Cucumber Step.

Parameters:

- `step` ([`Pickle.IPickleStep`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/messages/jsonschema/Pickle.json#L20-L49)): Cucumber step object
- `scenario` ([`IPickle`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/messages/jsonschema/Pickle.json#L137-L175)): Cucumber scenario object
- `context` (`object`): Cucumber World object

### afterStep

Runs after a Cucumber Step.

Parameters:

- `step` ([`Pickle.IPickleStep`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/messages/jsonschema/Pickle.json#L20-L49)): Cucumber step object
- `scenario` ([`IPickle`](https://github.com/cucumber/common/blob/b94ce625967581de78d0fc32d84c35b46aa5a075/messages/jsonschema/Pickle.json#L137-L175)): Cucumber scenario object
- `result`: (`object`): results object containing step results
- `result.passed` (`boolean`): true if scenario has passed
- `result.error` (`string`): error stack if scenario failed
- `result.duration` (`number`): duration of scenario in milliseconds
- `context` (`object`): Cucumber World object
