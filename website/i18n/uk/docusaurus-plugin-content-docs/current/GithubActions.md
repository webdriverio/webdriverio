---
id: githubactions
title: Github Actions
---

Якщо ваш репозиторій на Github, ви можете використовувати [Github Actions](https://docs.github.com/en/actions/getting-started-with-github-actions/about-github-actions#about-github-actions) для запуску тестів в інфраструктурі Github.

1. кожного разу, коли ви робите push до репозиторію
2. при кожному створенні Pull Request
3. в запланований час
4. вручну

У корені вашого репозиторію створіть теку `.github/workflows`. Додайте файл Yaml, наприклад `.github/workflows/ci.yaml`. Там ви налаштуєте спосіб запуску тестів.

Перегляньте [jasmine-boilerplate](https://github.com/webdriverio/jasmine-boilerplate/blob/master/.github/workflows/ci.yaml) для прикладу реалізації та [приклади тестових прогонів](https://github.com/webdriverio/jasmine-boilerplate/actions?query=workflow%3ACI).

```yaml reference
https://github.com/webdriverio/jasmine-boilerplate/blob/master/.github/workflows/ci.yaml
```

Дізнайтеся в [Github Docs](https://docs.github.com/en/actions/configuring-and-managing-workflows/configuring-a-workflow#creating-a-workflow-file) більше інформації про створення файлів Ci процесу.
