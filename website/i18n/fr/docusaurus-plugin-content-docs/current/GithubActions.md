---
id: githubactions
title: Github Actions
---

Si votre dépôt est hébergé sur Github, vous pouvez utiliser [Github Actions](https://docs.github.com/en/actions/getting-started-with-github-actions/about-github-actions#about-github-actions) pour exécuter vos tests sur l'infrastructure de Github.

1. chaque fois que vous envoyez des changements
2. à chaque création de pull request
3. heure programmé
4. lancement manuel

À la racine de votre dépôt, créez un répertoire `.github/workflows`. Ajouter un fichier Yaml, par exemple `.github/workflows/ci.yaml`. Ici, vous allez configurer comment exécuter vos tests.

Voir [jasmine-boilerplate](https://github.com/webdriverio/jasmine-boilerplate/blob/master/.github/workflows/ci.yaml) pour l'implémentation de référence, et [les essais d'échantillon](https://github.com/webdriverio/jasmine-boilerplate/actions?query=workflow%3ACI).

```yaml reference
https://github.com/webdriverio/jasmine-boilerplate/blob/master/.github/workflows/ci.yaml
```

Découvrez dans les [Github Docs](https://docs.github.com/en/actions/configuring-and-managing-workflows/configuring-a-workflow#creating-a-workflow-file) plus d'informations sur la création de fichiers de workflow.
