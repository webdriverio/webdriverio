---
id: bamboo
title: Bamboo
---

WebdriverIO обеспечивает тесную интеграцию с такими CI системами, как [Bamboo](https://www.atlassian.com/software/bamboo). With the [JUnit](https://webdriver.io/docs/junit-reporter.html) or [Allure](https://webdriver.io/docs/allure-reporter.html) reporter, you can easily debug your tests as well as keep track of your test results. The integration is pretty easy.

1. Install the JUnit test reporter: `$ npm install @wdio/junit-reporter --save-dev`)
1. Update your config to save your JUnit results where Bamboo can find them, (and specify the `junit` reporter):

```js
// wdio.conf.js
module.exports = {
    // ...
    reporters: [
        'dot',
        ['junit', {
            outputDir: './testresults/'
        }]
    ],
    // ...
}
```
Примечание: *Всегда рекомендуется хранить результаты теста в отдельной папке, а не в корневой.*

```js
// wdio.conf.js - For tests running in parallel
module.exports = {
    // ...
    reporters: [
        'dot',
        ['junit', {
            outputDir: './testresults/',
            outputFileFormat: function (options) {
                return `results-${options.cid}.xml`;
            }
        }]
    ],
    // ...
}
```

Отчеты будут одинаковыми для всех фреймворков и можно использовать любой: Mocha, Jasmine или Cucumber.

На данный момент мы считаем, что у вас есть написанные тесты и результаты сгенерированы в папке `./testresults/` , а ваш Bamboo запущен и работает.

## Интегрируйте свои тесты в Bamboo

1. Откройте ваш Bamboo проект

    > Создайте новый план, свяжите свой репозиторий (убедитесь, что он всегда указывает на самую новую версию вашего репозитория) и создайте свои шаги

    ![Детали плана](/img/bamboo/plancreation.png "Детали Плана")

    I will go with the default stage and job. In your case, you can create your own stages and jobs

    ![Default Stage](/img/bamboo/defaultstage.png "Default Stage")
2. Open your testing job and create tasks to run your tests in Bamboo
> **Task 1:** Source Code Checkout
> **Task 1:** Source Code Checkout **Task 1:** Source Code Checkout **Task 1:** Source Code Checkout **Task 2:** Run your tests `npm i && npm run test`. You can use *Script* task and *Shell Interpreter* to run the above commands (This will generate the test results and save them in `./testresults/` folder)

    ![Test Run](/img/bamboo/testrun.png "Test Run")
> **Task: 3** Add *jUnit Parser* task to parse your saved test results. Please specify the test results directory here (you can use Ant style patterns as well)

    ![jUnit Parser](/img/bamboo/junitparser.png "jUnit Parser")

    Note: *Make sure you are keeping the results parser task in *Final* section, so that it always get executed even if your test task is failed*
> **Task: 4** (optional) In order to make sure that your test results are not messed up with old files, you can create a task to remove the `./testresults/` folder after a successful parse to Bamboo. You can add a shell script like `rm -f ./testresults/*.xml` to remove the results or `rm -r testresults` to remove the complete folder

Once the above *rocket science* is done, please enable the plan and run it. Your final output will be like:

## Successful Test

![Successful Test](/img/bamboo/successfulltest.png "Successful Test")

## Failed Test

![Failed Test](/img/bamboo/failedtest.png "Failed Test")

## Failed and Fixed

![Failed and Fixed](/img/bamboo/failedandfixed.png "Failed and Fixed")

Yay!! Это все. Вы успешно интегрировали свои WebdriverIO тесты в Bamboo.
