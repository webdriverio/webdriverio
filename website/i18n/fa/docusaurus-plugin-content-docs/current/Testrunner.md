---
id: testrunner
title: اجرا کننده تست
---

WebdriverIO با اجرا کننده تست خود به شما کمک می کند تا در سریع ترین زمان ممکن شروع به تست کنید. فرض بر این است که اجرا کننده تست تمام کارها را برای شما انجام می دهد، اجازه می دهد تا خدمات اشخاص ثالثی را نیز ادغام کنید، و به شما کمک می کند تا تست های خود را تا حد امکان بهینه اجرا کنید.

اجرا کننده تست WebdriverIO به طور جداگانه در بسته `@wdio/cli` در NPM قرار داده شده است.

اینگونه می‌توانید نصبش کنید:

```sh npm2yarn
npm install @wdio/cli
```

برای مشاهده راهنمای رابط خط فرمان، دستور زیر را در ترمینال خود تایپ کنید:

```sh
$ npx wdio --help

wdio <command>

Commands:
  wdio config                           Initialize WebdriverIO and setup configuration in
                                        your current project.
  wdio install <type> <name>            Add a `reporter`, `service`, or `framework` to
                                        your WebdriverIO project
  wdio repl <option> [capabilities]     Run WebDriver session in command line
  wdio run <configPath>                 Run your WDIO configuration file to initialize
                                        your tests.

Options:
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]
```

عالی! اکنون باید یک فایل پیکربندی تعریف کنید که در آن تمام اطلاعات مربوط به تست ها، قابلیت ها و تنظیمات شما تنظیم شده باشد. به بخش [Configuration File](configurationfile)  بروید تا ببینید این فایل چگونه باید باشد.

با کمک پیکربندی `wdio` ، تولید فایل پیکربندی بسیار آسان است. فقط خط زیر را اجرا کنید:

```sh
$ npx wdio config
```

... و ابزار کمکی راه اندازی می شود.

در کمتر از یک دقیقه از شما سوالاتی می پرسد و یک فایل پیکربندی برای شما ایجاد می کند.

![ابزار پیکربندی WDIO](/img/config-utility.gif)

هنگامی که فایل پیکربندی خود را تنظیم کردید، می توانید تست های خود را با اجرای فرمان زیر شروع کنید:

```sh
npx wdio run wdio.conf.js
```

همچنین می توانید اجرای تست های خود را بدون دستور `run` راه اندازی کنید:

```sh
npx wdio wdio.conf.js
```

تمام! اکنون، می توانید از طریق متغیر جهانی `browser` به نمونه سلنیوم دسترسی داشته باشید.

## دستورات

### `wdio config`

دستور `config` کمک کننده تنظیمات WebdriverIO را اجرا می کند. این راهنما از شما چند سوال در مورد پروژه WebdriverIO شما می پرسد و یک فایل `wdio.conf.js` را بر اساس پاسخ های شما ایجاد می کند.

مثال:

```sh
wdio config
```

تنظیمات:

```
--help            prints WebdriverIO help menu                                [boolean]
--npm             Wether to install the packages using NPM instead of yarn    [boolean]
```

### `wdio run`

> این دستور پیش فرض برای اجرای پیکربندی شما است.

دستور `run` فایل پیکربندی WebdriverIO شما را مقداردهی اولیه می کند و تست های شما را اجرا می کند.

مثال:

```sh
wdio run ./wdio.conf.js --watch
```

تنظیمات:

```
--help                prints WebdriverIO help menu                   [boolean]
--version             prints WebdriverIO version                     [boolean]
--hostname, -h        automation driver host address                  [string]
--port, -p            automation driver port                          [number]
--user, -u            username if using a cloud service as automation backend
                                                                        [string]
--key, -k             corresponding access key to the user            [string]
--watch               watch specs for changes                        [boolean]
--logLevel, -l        level of logging verbosity
                            [choices: "trace", "debug", "info", "warn", "error", "silent"]
--bail                stop test runner after specific amount of tests have
                        failed                                          [number]
--baseUrl             shorten url command calls by setting a base url [string]
--waitforTimeout, -w  timeout for all waitForXXX commands             [number]
--framework, -f       defines the framework (Mocha, Jasmine or Cucumber) to
                        run the specs                                   [string]
--reporters, -r       reporters to print out the results on stdout     [array]
--suite               overwrites the specs attribute and runs the defined
                        suite                                            [array]
--spec                run only a certain spec file - overrides specs piped
                        from stdin                                       [array]
--exclude             exclude spec file(s) from a run - overrides specs piped
                        from stdin                                       [array]
--multi-run           Run one or more specs x amount of times            [number]
--mochaOpts           Mocha options
--jasmineOpts         Jasmine options
--cucumberOpts        Cucumber options
```

> توجه: کامپایل خودکار را می توان به راحتی با کتابخانه مناسب ENV Vars کنترل کرد. همچنین به عملکرد کامپایل خودکار Test Runner مستند شده در صفحات [TypeScript (ts-node)](typeScript) و [Babel (@babel/register)](babel) مراجعه کنید.

### `wdio install`
دستور `install` به شما این امکان را می دهد که گزارشگران و خدمات را از طریق CLI به پروژه های WebdriverIO خود اضافه کنید.

مثال:

```sh
wdio install service sauce # installs @wdio/sauce-service
wdio install reporter dot # installs @wdio/dot-reporter
wdio install framework mocha # installs @wdio/mocha-framework
```

اگر می خواهید بسته ها را با استفاده از `yarn` نصب کنید، می توانید پرچم `--yarn` را همراه با دستور ارسال کنید:

```sh
wdio install service sauce --yarn
```

همچنین اگر فایل پیکربندی WDIO شما در همان پوشه ای نیست که روی آن کار می کنید، یک مسیر پیکربندی سفارشی را انتقال دهید:

```sh
wdio install service sauce --config="./path/to/wdio.conf.js"
```

#### لیست خدمات پشتیبانی شده

```
sauce
testingbot
firefox-profile
devtools
browserstack
appium
intercept
zafira-listener
reportportal
docker
wiremock
lambdatest
vite
nuxt
```

#### لیست گزارش‌دهنده های پشتیبانی شده

```
dot
spec
junit
allure
sumologic
concise
reportportal
video
html
json
mochawesome
timeline
```

#### لیست فریمورک های پشتیبانی شده

```
mocha
jasmine
cucumber
```

### `wdio repl`

دستور repl اجازه می دهد تا یک رابط خط فرمان تعاملی برای اجرای دستورات WebdriverIO راه اندازی شود. می توان از آن برای اهداف تست یا برای راه اندازی سریع Session در WebdriverIO استفاده کرد.

اجرای تست در کروم محلی:

```sh
wdio repl chrome
```

یا اجرای تست در Sauce Labs:

```sh
wdio repl chrome -u $SAUCE_USERNAME -k $SAUCE_ACCESS_KEY
```

می توانید همان آرگومان هایی را در دستور [run](#wdio-run) استفاده می‌کنید، اعمال کنید.
