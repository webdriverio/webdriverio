---
id: watcher
title: Watch Test Files
---
С WDIO TestRunner вы можете автоматически проверять файлы, пока работаете с ними. Они автоматически перезапускаются, если вы что-то меняете в вашей аппликации или в тестовых файлах. Добавив флаг `--watch` при вызове команды `wdio`, TestRunner будет ждать изменения файлов и после этого он запустит все тесты, например.

```sh
$ wdio wdio.conf.js --watch
```

По умолчанию он следит только за изменениями в ваших `specs` файлах. However by setting a `filesToWatch` property in your `wdio.conf.js` that contains a list of file paths (globbing supported) it will also watch for these files to be changed in order to rerun the whole suite. This is useful if you want to automatically rerun all your tests if you have changed your application code, e.g.

```js
// wdio.conf.js
export.config = {
    // ...
    filesToWatch: [
        // watch for all JS files in my app
        './src/app/**/*.js'
    ],
    // ...
}
```

**Note:** ensure that you run as much tests in parallel as possible. E2E tests are by nature slow and rerunning tests is only useful if you can keep the individual testrun time short. In order to save time the testrunner keeps the WebDriver sessions alive while waiting for file changes. Make sure your WebDriver backend can be modified so that it doesn't automatically close the session if no command was executed after some specific time.