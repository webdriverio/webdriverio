---
id: bamboo
title: Bamboo
---

WebdriverIO bietet eine enge Integration in CI-Systeme wie [Bamboo](https://www.atlassian.com/software/bamboo). Mit dem [JUnit](https://webdriver.io/docs/junit-reporter.html) oder [Allure](https://webdriver.io/docs/allure-reporter.html) Reporter können Sie Ihre Tests einfach debuggen und Ihre Testergebnisse verfolgen. Die Integration ist ziemlich einfach.

1. Installieren Sie den JUnit-Testreporter: `$ npm install @wdio/junit-reporter --save-dev`)
1. Aktualisieren Sie Ihre Konfiguration, um Ihre JUnit-Ergebnisse dort zu speichern, wo Bamboo sie finden kann (und geben Sie den Reporter `junit` an):

```js
// wdio.conf.js
module.exports = {
    // ...
    reporters: [
        'dot',
        ['junit', {
            outputDir: './testresults/'
        }]
    ],
    // ...
}
```
Hinweis: *Es ist immer ein guter Standard, die Testergebnisse in einem anderen Ordner als im Stammordner aufzubewahren.*

```js
// wdio.conf.js - For tests running in parallel
module.exports = {
    // ...
    reporters: [
        'dot',
        ['junit', {
            outputDir: './testresults/',
            outputFileFormat: function (options) {
                return `results-${options.cid}.xml`;
            }
        }]
    ],
    // ...
}
```

Die Berichte sind für alle Frameworks ähnlich und Sie können jeden verwenden: Mocha, Jasmine oder Cucumber.

Wir glauben, dass Sie zu diesem Zeitpunkt die Tests geschrieben haben und die Ergebnisse im Ordner `./testresults/` generiert werden und Ihr Bamboo betriebsbereit ist.

## Integrieren Sie Ihre Tests in Bamboo

1. Öffnen Sie Ihr Bamboo-Projekt

    > Erstellen Sie einen neuen Plan, verknüpfen Sie Ihr Repository (stellen Sie sicher, dass es immer auf die neueste Version Ihres Repositorys verweist) und erstellen Sie Ihre Stufen

    ![Plan-Details](/img/bamboo/plancreation.png "Plan-Details")

    Ich werde mit der Standardstufe und dem Standardjob fortfahren. In Ihrem Fall können Sie Ihre eigenen Stufen und Jobs erstellen

    ![Standardstufe](/img/bamboo/defaultstage.png "Standardstufe")
2. Open your testing job and create tasks to run your tests in Bamboo > **Task 1:** Source Code Checkout
> **Aufgabe 1:** Quellcode-Checkout
> **Aufgabe 1:** Quellcode-Checkout **Aufgabe: 4** (optional) Um sicherzustellen, dass Ihre Testergebnisse nicht mit alten Dateien durcheinandergebracht werden, können Sie eine Aufgabe erstellen, um den Ordner `./testresults/` nach einem erfolgreichen Parsen zu Bamboo zu entfernen. Sie können *Script* Task und *Shell Interpreter* verwenden, um die obigen Befehle auszuführen (Dies generiert die Testergebnisse und speichert sie in `. testresults/` Ordner)

    ![Testlauf](/img/bamboo/testrun.png "Testlauf")
> **Aufgabe: 3** Fügen Sie *jUnit Parser* Aufgabe hinzu, um Ihre gespeicherten Testergebnisse zu parsen. Bitte geben Sie hier das Verzeichnis der Testergebnisse an (Sie können auch Muster im Ant-Stil verwenden)

    ![jUnit-Parser](/img/bamboo/junitparser.png "jUnit-Parser")

    !\[jUnit Parser\](/img/bamboo/junitparser.png "jUnit Parser") Note: *Make sure you are keeping the results parser task in *Final* section, so that it always get executed even if your test task is failed*
> **Aufgabe 1:** Quellcode-Checkout **Aufgabe 1:** Quellcode-Checkout **Aufgabe: 4** (optional) Um sicherzustellen, dass Ihre Testergebnisse nicht mit alten Dateien durcheinandergebracht werden, können Sie eine Aufgabe erstellen, um den Ordner `./testresults/` nach einem erfolgreichen Parsen zu Bamboo zu entfernen. Sie können ein Shell-Skript wie `rm -f ./testresults/*.xml` hinzufügen, um die Ergebnisse zu entfernen, oder `rm -r testresults` , um den gesamten Ordner zu entfernen

Sobald die obige *Raketenwissenschaft* fertig ist, aktivieren Sie bitte den Plan und führen Sie ihn aus. Ihre endgültige Ausgabe wird wie folgt aussehen:

## Erfolgreicher Test

![Erfolgreicher Test](/img/bamboo/successfulltest.png "Erfolgreicher Test")

## Fehlgeschlagener Test

![Fehlgeschlagener Test](/img/bamboo/failedtest.png "Fehlgeschlagener Test")

## Fehlgeschlagen und Behoben

![Fehlgeschlagen und Behoben](/img/bamboo/failedandfixed.png "Fehlgeschlagen und Behoben")

Yay!! Das war es schon! Sie haben Ihre WebdriverIO-Tests erfolgreich in Bamboo integriert.
