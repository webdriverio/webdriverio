---
id: githubactions
title: Github Actions
---

If your repository is hosted on Github, you can use [Github Actions](https://docs.github.com/en/actions/getting-started-with-github-actions/about-github-actions#about-github-actions) to run your tests on Github's infrastructure.

1. everytime you push changes
2. on every pull request creation
3. on scheduled time
4. by manual trigger

In the root of your repository, create a .github/workflows directory. Add a .yml file, for example .github/workflows/ci.yaml. In here you will configure how to run tests.

See [jasmine-boilerplate](https://github.com/webdriverio/jasmine-boilerplate/blob/master/.github/workflows/ci.yaml) for reference implementation, and [sample test runs](https://github.com/webdriverio/jasmine-boilerplate/actions?query=workflow%3ACI).

```yaml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
        - name: Checkout
          uses: actions/checkout@v2
        - name: Install
          uses: ianwalter/puppeteer@master
          with:
            args: npm install
        - name: Test
          uses: ianwalter/puppeteer@master
          with:
            args: npm run test:local
        - uses: actions/upload-artifact@v1
          if: failure()
          with:
            name: logs
            path: logs
```

Refer [Github](https://docs.github.com/en/actions/configuring-and-managing-workflows/configuring-a-workflow#creating-a-workflow-file) to know more about creating workflow files.
