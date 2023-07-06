---
id: coverage
title: Couverture
---

L'exécuteur du navigateur WebdriverIO prend en charge les rapports de couverture de code en utilisant [`istanbul`](https://istanbul.js.org/). Le testrunner vous permettra d'automatiser la couverture de votre code et de capturer le code pour vous.

## Configurer

Afin d'activer le rapport de couverture de code, activez-le via la configuration de l'exécuteur WebdriverIO, par exemple.:

```js title=wdio.conf.js
export const config = {
    // ...
    runner: ['browser', {
        preset: process.env.WDIO_PRESET,
        coverage: {
            enabled: true
        }
    }],
    // ...
}
```

Repérez toutes les [options de couverture](/docs/runner#coverage-options), pour apprendre comment le configurer correctement.

## Code ignoré

Il peut y avoir certaines sections de votre code de base que vous souhaitez exclure volontairement du suivi de couverture, pour ce faire, vous pouvez utiliser les astuces d'analyse suivantes :

- `/* istanbul ignore if */`: ignore l'instruction if suivante.
- `/* istanbul ignore else */`: ignore la partie else d'une instruction if.
- `/* istanbul ignore la prochaine chose */`: ignore la prochaine chose dans le code source ( fonctions, si les instructions, classes, vous la nommez).
- `/* istanbul ignore le fichier */`: ignore un fichier source entier (il faut le placer en haut du fichier).

:::info

Il est recommandé d'exclure vos fichiers de test de la déclaration de couverture car cela pourrait causer des erreurs, e. . lors de l'appel des commandes `exécuter` ou `executeAsync`. Si vous aimez les conserver dans votre rapport, assurez-vous que votre exclusion les instruire via :

```ts
await browser.execute(/* istanbul ignore next */() => {
    // ...
})
```

:::
