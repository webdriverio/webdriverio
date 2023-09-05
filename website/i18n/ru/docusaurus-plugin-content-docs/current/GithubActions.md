---
id: githubactions
title: Github Actions
---

If your repository is hosted on Github, you can use [Github Actions](https://docs.github.com/en/actions/getting-started-with-github-actions/about-github-actions#about-github-actions) to run your tests on Github's infrastructure.

1. every time you push changes
2. on every pull request creation
3. on scheduled time
4. by manual trigger

In the root of your repository, create a `.github/workflows` directory. Add a Yaml file, for example `.github/workflows/ci.yaml`. In there you will configure how to run your tests.

See [jasmine-boilerplate](https://github.com/webdriverio/jasmine-boilerplate/blob/master/.github/workflows/ci.yaml) for reference implementation, and [sample test runs](https://github.com/webdriverio/jasmine-boilerplate/actions?query=workflow%3ACI).

```yaml reference
https://github.com/webdriverio/jasmine-boilerplate/blob/master/.github/workflows/ci.yaml
```

Find out in the [Github Docs](https://docs.github.com/en/actions/configuring-and-managing-workflows/configuring-a-workflow#creating-a-workflow-file) on more information about creating workflow files.
