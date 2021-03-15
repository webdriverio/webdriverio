---
id: autocompletion
title: Автозаполнение
---

Если вы пишете программный код некоторое время, то вам, вероятно, нравится автозаполнение (autocompletion). Автрозаполнение сразу же доступно во многих редакторах. Однако если автозаполнение требует пакеты, которые не установлены в обычных директориях или исключены из индексации по некоторых причинам, они также могут быть добавлены через изменения в конфигурации.

![Автозаполнение](/img/autocompletion/0.png)

[JSDoc](http://usejsdoc.org/) используется для документации кода. Он помогает видеть более подробную информацию о параметрах и их типах.

![Автозаполнение](/img/autocompletion/1.png)

Используйте стандартную команду *⇧ + ⌥ + SPACE* в IntelliJ Platform для просмотра доступной документации:

![Автозаполнение](/img/autocompletion/2.png)

Итак, давайте рассмотрим пример добавления автозаполнения к редактору кода на примере Intellij WebStorm.

### Node.js Core модули как Внешняя библиотека (External library)

Открыть *Settings -> Preferences -> Languages & Frameworks -> JavaScript -> Libraries*

![Автозаполнение](/img/autocompletion/3.png)

Добавить новую библиотеку

![Автозаполнение](/img/autocompletion/4.png)

Добавить директорию с командами WebdriverIO

![Автозаполнение](/img/autocompletion/5.png) ![Автозаполнение](/img/autocompletion/6.png) ![Автозаполнение](/img/autocompletion/7.png)

Введите URL документации

![Автозаполнение](/img/autocompletion/8.png) ![Автозаполнение](/img/autocompletion/9.png) ![Автозаполнение](/img/autocompletion/10.png)

### Использование TypeScript community stubs (TypeScript definition files)

WebStorm предоставляет еще один воркараунд для добавления помощи при написании кода. Это позволяет вам скачать [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) stubs.

![Автозаполнение](/img/autocompletion/11.png) ![Автозаполнение](/img/autocompletion/12.png)