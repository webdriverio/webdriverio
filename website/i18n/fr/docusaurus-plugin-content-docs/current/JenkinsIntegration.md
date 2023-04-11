---
id: jenkins
title: Jenkins
---

WebdriverIO offre une intégration étroite aux systèmes CI comme [Jenkins](https://jenkins-ci.org). Avec le reporteur `junit` , vous pouvez facilement déboguer vos tests et garder une trace de vos résultats de test. L'intégration est assez facile.

1. Installez le rapport de test `junit` : `$ npm install @wdio/junit-reporter --save-dev`)
1. Mettez à jour votre configuration pour enregistrer vos résultats XUnit où Jenkins peut les trouver, (et spécifiez le reporteur `junit` ) :

```js
// wdio.conf.js
module.exports = {
    // ...
    reporters: [
        'dot',
        ['junit', {
            outputDir: './'
        }]
    ],
    // ...
}
```

C'est à vous de choisir la méthode qui vous convient. Les rapports seront similaires. Pour ce tutoriel, nous utiliserons Jasmine.

Une fois que vous avez écrit quelques tests, vous pouvez configurer une nouvelle tâche Jenkins. Donnez-lui un nom et une description :

![Nom et description](/img/jenkins/jobname.png "Nom et description")

Ensuite, assurez-vous qu'il récupère toujours la version la plus récente de votre dépôt :

![Jenkins Git Setup](/img/jenkins/gitsetup.png "Jenkins Git Setup")

**Maintenant la partie importante :** Créer une étape `build` pour exécuter des commandes shell. L'étape `de build` a besoin de construire votre projet. Puisque ce projet de démo ne teste qu'une application externe, vous n'avez pas besoin de construire quoi que ce soit. Installez simplement les dépendances du noeud et exécutez la commande `npm test` (qui est un alias pour `node_modules/.bin/wdio test/wdio.conf.js`).

Si vous avez installé un plugin comme AnsiColor, mais que les logs ne sont toujours pas colorés, exécutez des tests avec la variable d'environnement `FORCE_COLOR=1` (e. ., `FORCE_COLOR=1 test npm`).

![À l'étape Build](/img/jenkins/runjob.png "À l'étape Build")

Après votre test, vous voudrez que Jenkins suive votre rapport XUnit. Pour ce faire, vous devez ajouter une action post-build appelée _"Publier le rapport de résultats de test JUnit"_.

Vous pouvez également installer un plugin XUnit externe pour suivre vos rapports. Le JUnit est livré avec l'installation de base de Jenkins et est suffisant pour l'instant.

Selon le fichier de configuration, les rapports XUnit seront enregistrés dans le répertoire racine du projet. Ces rapports sont des fichiers XML. Donc, tout ce que vous avez à faire pour suivre les rapports est de pointer Jenkins vers tous les fichiers XML de votre répertoire racine :

![Action de post-construction](/img/jenkins/postjob.png "Action de post-construction")

Voilà! Vous avez maintenant mis en place Jenkins pour exécuter vos jobs WebdriverIO. Votre travail va maintenant fournir des résultats de test détaillés avec des graphiques d'historique, stacktrace les informations sur les tâches échouées et une liste de commandes avec un bloc qui a été utilisé dans chaque test.

![Intégration finale de Jenkins](/img/jenkins/final.png "Intégration finale de Jenkins")
