---
id: globals
title: Global
---

Dans vos fichiers de test, WebdriverIO place chacune de ces méthodes et objets dans l'environnement global. Vous n'avez rien à importer pour les utiliser. Cependant, si vous préférez les importations explicites, vous pouvez faire `import { browser, $, $$, expect } from '@wdio/globals'` et définir `injectGlobals: false` dans votre configuration WDIO.

Les objets globaux suivants sont définis s'ils ne sont pas configurés autrement :

- `navigateur`: WebdriverIO [Objet navigateur](https://webdriver.io/docs/api/browser)
- `driver`: alias vers `browser` (utilisé lors de l'exécution de tests mobiles)
- `multiremotebrowser`: alias vers `browser` ou `driver` mais uniquement défini pour [les sessions Multiremote](/docs/multiremote)
- `$`: commande pour récupérer un élément (voir plus dans la [doc d'APIs](/docs/api/browser/$))
- `$`: commande pour récupérer un élément (voir plus dans la [doc d'APIs](/docs/api/browser/$$))
- `expect`: framework d'assertion pour WebdriverIO (voir la [doc d'APIs](/docs/api/expect-webdriverio))

__Remarque :__ WebdriverIO n'a aucun contrôle sur les frameworks utilisés (par exemple, Mocha ou Jasmine) définissant des variables globales lors de l'amorçage de leur environnement.
