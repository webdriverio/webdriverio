---
id: githubactions
title: Github Actions
---

If your repository is hosted on Github, you can use [Github Actions](https://docs.github.com/en/actions) to run your tests on Github's infrastructure.

1. every time you push changes
2. bei jeder Pull-Request-Erstellung
3. zu einer geplanten Uhrzeit
4. durch eine manuelle Auslösung

Erstellen Sie im Root-Ordner Ihres Repositorys ein Verzeichnis `.github/workflows`. Fügen Sie eine Yaml-Datei hinzu, zum Beispiel `.github/workflows/ci.yaml`. Dort konfigurieren Sie, wie Sie Ihre Tests ausführen.

Siehe [Jasmin-Boilerplate](https://github.com/webdriverio/jasmine-boilerplate/blob/master/.github/workflows/ci.yaml) für die Referenzimplementierung und [Beispieltestläufe](https://github.com/webdriverio/jasmine-boilerplate/actions?query=workflow%3ACI).

```yaml reference
https://github.com/webdriverio/jasmine-boilerplate/blob/master/.github/workflows/ci.yaml
```

Find out in the [Github Docs](https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-workflow-runs/manually-running-a-workflow?tool=cli) on more information about creating workflow files.
