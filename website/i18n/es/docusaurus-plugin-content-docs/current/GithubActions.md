---
id: githubactions
title: Acciones de Github
---

Si su repositorio está alojado en Github, puede usar [Github Actions](https://docs.github.com/en/actions/getting-started-with-github-actions/about-github-actions#about-github-actions) para ejecutar sus pruebas en la infraestructura de Github.

1. cada vez que envíes cambios
2. en cada creación del pull request
3. tiempo programado
4. por activación manual

En la raíz de su repositorio, cree un directorio `.github/workflows`. Añade un archivo Yaml, por ejemplo `.github/workflows/ci.yaml`. Allí se configurará cómo ejecutar las pruebas.

Vea [jasmine-boilerplate](https://github.com/webdriverio/jasmine-boilerplate/blob/master/.github/workflows/ci.yaml) para la implementación de referencia, y [prueba de muestra se ejecuta](https://github.com/webdriverio/jasmine-boilerplate/actions?query=workflow%3ACI).

```yaml reference
https://github.com/webdriverio/jasmine-boilerplate/blob/master/.github/workflows/ci.yaml
```

Descubre en [Github Docs](https://docs.github.com/en/actions/configuring-and-managing-workflows/configuring-a-workflow#creating-a-workflow-file) sobre más información sobre cómo crear archivos de flujo de trabajo.
