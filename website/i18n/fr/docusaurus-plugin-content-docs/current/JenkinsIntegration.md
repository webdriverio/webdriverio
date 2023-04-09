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

![Name And Description](/img/jenkins/jobname.png "Name And Description")

Ensuite, assurez-vous qu'il récupère toujours la version la plus récente de votre dépôt :

![Jenkins Git Setup](/img/jenkins/gitsetup.png "Jenkins Git Setup")

**Maintenant la partie importante :** Créer une étape `build` pour exécuter des commandes shell. L'étape `de build` a besoin de construire votre projet. Puisque ce projet de démo ne teste qu'une application externe, vous n'avez pas besoin de construire quoi que ce soit. Installez simplement les dépendances du noeud et exécutez la commande `npm test` (qui est un alias pour `node_modules/.bin/wdio test/wdio.conf.js`).

If you have installed a plugin like AnsiColor, but logs are still not colored, run tests with environment variable `FORCE_COLOR=1` (e.g., `FORCE_COLOR=1 npm test`).

![Build Step](/img/jenkins/runjob.png "Build Step")

After your test, you’ll want Jenkins to track your XUnit report. To do so, you have to add a post-build action called _"Publish JUnit test result report"_.

You could also install an external XUnit plugin to track your reports. The JUnit one comes with the basic Jenkins installation and is sufficient enough for now.

According to the config file, the XUnit reports will be saved in the project’s root directory. These reports are XML files. So, all you need to do in order to track the reports is to point Jenkins to all XML files in your root directory:

![Post-build Action](/img/jenkins/postjob.png "Post-build Action")

That's it! You’ve now set up Jenkins to run your WebdriverIO jobs. Your job will now provide detailed test results with history charts, stacktrace information on failed jobs, and a list of commands with payload that got used in each test.

![Jenkins Final Integration](/img/jenkins/final.png "Jenkins Final Integration")
