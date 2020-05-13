---
id: jenkins
title: Интеграция с Jenkins
---

WebdriverIO может работать с системами непрерывной интеграции (CI), такими как [Jenkins](https://jenkins-ci.org/). В этом примере для отладки тестов и получения отчетов рассмотрим [junit reporter](https://github.com/webdriverio/wdio-junit-repo). Сам процесс интеграции довольно прост.

Во-первых, нам необходимо назначить `junit` в качестве репортера. Так же, стоит убедиться, что репортер установлен (`$ npm install --save-dev wdio-junit-reporter`) и что место, куда мы будем сохранять XUnit отчеты, доступно для Jenkins'а. Следовательно, назначаем репортер в файле конфигурации:

```js
// wdio.conf.js
module.exports = {
    // ...
    reporters: [
        'dot',
        ['junit', {
            outputDir: './'
        }]
    ],
    // ...
};
```

Тестовый фреймворк, в данном случае, не имеет значения. Отчеты будут одинаковы. В этом руководстве использован Jasmine. Написав неколько тестовых сценариев, можно приступать к настройке новой задачи в Jenkins. Даем наименование и описание:

![Name And Description](/img/jenkins/jobname.png "Name And Description")

Затем убеждаемся, что Jenkins всегда будет стягивать последнюю версию проекта:

![Jenkins Git Setup](/img/jenkins/gitsetup.png "Jenkins Git Setup")

Самая важная часть: добавляем build step для выполнения shell комманд. Здесь будет происходить сборка проекта. В случае нашего примера, тестируется стороннее приложение, поэтому, собирать ничего не будем. Нужно только установить все зависимости и запустить тесты командой `npm test` (алиас для `node_modules/.bin/wdio test/wdio.conf.js`).

![Build Step](/img/jenkins/runjob.png "Build Step")

По окончанию тестов нам нужно, чтобы Jenkins увидел сгенерированный XUnit репорт. Для этого в post-build действия добавляем *"Publish JUnit test result report"*. Как альтернатива, можно установить сторонний xunit плагин для обработки отчетов. The JUnit one comes with the basic Jenkins installation and is sufficient enough for now.

According to our config file we store the xunit reports in our workspace root directory. These reports are xml files. So all we need to do in order to track the reports is to point Jenkins to all xml files in our root directory:

![Post-build Action](/img/jenkins/postjob.png "Post-build Action")

That's it! This is all you need to setup Jenkins to run your WebdriverIO jobs. Your job will now provide detailed test results with history charts, stacktrace information on failed jobs as well as a list of commands with payload that got used in each test.

![Jenkins Final Integration](/img/jenkins/final.png "Jenkins Final Integration")