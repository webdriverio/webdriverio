---
id: githubactions
title: Acciones de Github
---

If your repository is hosted on Github, you can use [Github Actions](https://docs.github.com/en/actions) to run your tests on Github's infrastructure.

1. every time you push changes
2. en cada creación del pull request
3. tiempo programado
4. por activación manual

En la raíz de su repositorio, cree un directorio `.github/workflows`. Añade un archivo Yaml, por ejemplo `.github/workflows/ci.yaml`. Allí se configurará cómo ejecutar las pruebas.

Vea [jasmine-boilerplate](https://github.com/webdriverio/jasmine-boilerplate/blob/master/.github/workflows/ci.yaml) para la implementación de referencia, y [prueba de muestra se ejecuta](https://github.com/webdriverio/jasmine-boilerplate/actions?query=workflow%3ACI).

```yaml reference
https://github.com/webdriverio/jasmine-boilerplate/blob/master/.github/workflows/ci.yaml
```

Find out in the [Github Docs](https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-workflow-runs/manually-running-a-workflow?tool=cli) on more information about creating workflow files.
