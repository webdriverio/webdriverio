---
id: githubactions
title: Github Actions
---

If your repository is hosted on Github, you can use [Github Actions](https://docs.github.com/en/actions) to run your tests on Github's infrastructure.

1. every time you push changes
2. при кожному створенні Pull Request
3. в запланований час
4. вручну

У корені вашого репозиторію створіть теку `.github/workflows`. Додайте файл Yaml, наприклад `.github/workflows/ci.yaml`. Там ви налаштуєте спосіб запуску тестів.

Перегляньте [jasmine-boilerplate](https://github.com/webdriverio/jasmine-boilerplate/blob/master/.github/workflows/ci.yaml) для прикладу реалізації та [приклади тестових прогонів](https://github.com/webdriverio/jasmine-boilerplate/actions?query=workflow%3ACI).

```yaml reference
https://github.com/webdriverio/jasmine-boilerplate/blob/master/.github/workflows/ci.yaml
```

Find out in the [Github Docs](https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-workflow-runs/manually-running-a-workflow?tool=cli) on more information about creating workflow files.
