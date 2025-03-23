---
id: githubactions
title: Github Actions
---

If your repository is hosted on Github, you can use [Github Actions](https://docs.github.com/en/actions) to run your tests on Github's infrastructure.

1. every time you push changes
2. à chaque création de pull request
3. heure programmé
4. lancement manuel

À la racine de votre dépôt, créez un répertoire `.github/workflows`. Ajouter un fichier Yaml, par exemple `.github/workflows/ci.yaml`. Ici, vous allez configurer comment exécuter vos tests.

Voir [jasmine-boilerplate](https://github.com/webdriverio/jasmine-boilerplate/blob/master/.github/workflows/ci.yaml) pour l'implémentation de référence, et [les essais d'échantillon](https://github.com/webdriverio/jasmine-boilerplate/actions?query=workflow%3ACI).

```yaml reference
https://github.com/webdriverio/jasmine-boilerplate/blob/master/.github/workflows/ci.yaml
```

Find out in the [Github Docs](https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-workflow-runs/manually-running-a-workflow?tool=cli) on more information about creating workflow files.
