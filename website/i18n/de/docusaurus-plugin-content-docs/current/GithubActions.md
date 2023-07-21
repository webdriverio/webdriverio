---
id: githubactions
title: Github Actions
---

Wenn Ihr Repository auf Github gehostet wird, können Sie [Github Actions](https://docs.github.com/en/actions/getting-started-with-github-actions/about-github-actions#about-github-actions) verwenden, um Ihre Tests auf der Infrastruktur von Github auszuführen.

1. jedes Mal, wenn Sie Änderungen vornehmen
2. bei jeder Pull-Request-Erstellung
3. zu einer geplanten Uhrzeit
4. durch eine manuelle Auslösung

Erstellen Sie im Root-Ordner Ihres Repositorys ein Verzeichnis `.github/workflows`. Fügen Sie eine Yaml-Datei hinzu, zum Beispiel `.github/workflows/ci.yaml`. Dort konfigurieren Sie, wie Sie Ihre Tests ausführen.

Siehe [Jasmin-Boilerplate](https://github.com/webdriverio/jasmine-boilerplate/blob/master/.github/workflows/ci.yaml) für die Referenzimplementierung und [Beispieltestläufe](https://github.com/webdriverio/jasmine-boilerplate/actions?query=workflow%3ACI).

```yaml reference
https://github.com/webdriverio/jasmine-boilerplate/blob/master/.github/workflows/ci.yaml
```

Informieren Sie sich in den [Github Docs](https://docs.github.com/en/actions/configuring-and-managing-workflows/configuring-a-workflow#creating-a-workflow-file) über weitere Informationen zum Erstellen von Workflow-Dateien.
