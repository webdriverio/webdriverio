---
id: environment
title: Variables d'Environnement
---

WebdriverIO définit les variables d'environnement suivantes dans chaque travail:

## `NODE_ENV`

Définissez à `'test'` si ce n'est pas déjà défini à autre chose.

## `WDIO_LOG_LEVEL`

Peut être défini sur les valeurs `trace`, `debug`, `info`, `warn`, `error`, `silent` pour écrire des journaux avec les détails correspondants. A la priorité sur la valeur `logLevel` transmise.

## `WDIO_WORKER_ID`

Un identifiant unique qui aide à identifier le processus de travail. Il a un format de `{number}-{number}` où le premier nombre identifie la capacité et le second le fichier de spécification qui est en cours d'exécution, e. . `0-5` indique à un travailleur le premier à exécuter le sixième fichier de spécification pour la première capacité.
