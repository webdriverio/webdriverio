---
id: jenkins
title: Jenkins
---

WebdriverIO bietet eine enge Integration in CI-Systeme wie [Jenkins](https://jenkins-ci.org). Mit dem `junit` Reporter können Sie Ihre Tests einfach debuggen und Ihre Testergebnisse verfolgen. Die Integration ist ziemlich einfach.

1. Installieren Sie den JUnit-Testreporter: `$ npm install @wdio/junit-reporter --save-dev`)
1. Aktualisieren Sie Ihre Konfiguration, um Ihre JUnit-Ergebnisse dort zu speichern, wo Jenkins sie finden kann, (und geben Sie den Reporter `junit` an):

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

Welches Framework Sie wählen, bleibt Ihnen überlassen. Die JUnit-Reports werden ähnlich sein. Für dieses Tutorial verwenden wir Jasmine.

Nachdem Sie einige Tests geschrieben haben, können Sie einen neuen Jenkins-Job einrichten. Geben Sie ihm einen Namen und eine Beschreibung:

![Name und Beschreibung](/img/jenkins/jobname.png "Name und Beschreibung")

Stellen Sie dann sicher, dass immer die neueste Version Ihres Repositorys abgerufen wird:

![Jenkins Git-Setup](/img/jenkins/gitsetup.png "Jenkins Git-Setup")

**Jetzt der wichtige Teil:** Erstellen Sie einen `build` Schritt, um Shell-Befehle auszuführen. Der Schritt `build` muss Ihr Projekt erstellen. Da dieses Demoprojekt nur eine externe App testet, müssen Sie nichts bauen. Installieren Sie einfach die NodeJS Abhängikeiten und führen Sie den Befehl `npm test` aus (das ist ein Alias für `node_modules/.bin/wdio test/wdio.conf.js`).

Wenn Sie ein Plugin wie AnsiColor installiert haben, aber Logs immer noch nicht gefärbt sind, führen Sie Tests mit der Umgebungsvariable `FORCE_COLOR=1` durch (z. B. `FORCE_COLOR=1 npm test`).

![Bauschritt](/img/jenkins/runjob.png "Bauschritt")

Nach Ihrem Test möchten Sie, dass Jenkins Ihren JUnit-Bericht speichert. Dazu müssen Sie eine Post-Build-Aktion mit dem Namen _„Publish JUnit test result report“_hinzufügen.

Sie können auch ein externes JUnit-Plugin installieren, um Ihre Berichte zu speichern. Die JUnit-Version wird mit der grundlegenden Jenkins-Installation geliefert und reicht vorerst aus.

Gemäß der Konfigurationsdatei werden die JUnit-Berichte im Stammverzeichnis des Projekts gespeichert. Diese Berichte sind XML-Dateien. Alles, was Sie tun müssen, um die Berichte zu speichern, ist, Jenkins auf alle XML-Dateien in Ihrem Stammverzeichnis zu verweisen:

![Post-Build-Aktion](/img/jenkins/postjob.png "Post-Build-Aktion")

Geschafft! Sie haben jetzt Jenkins eingerichtet, um Ihre WebdriverIO-Jobs auszuführen. Ihr Job liefert nun detaillierte Testergebnisse mit Verlaufsdiagrammen, Stacktrace-Informationen zu fehlgeschlagenen Jobs und eine Liste von Befehlen mit Payload, die in jedem Test verwendet wurden.

![Endgültige Jenkins-Integration](/img/jenkins/final.png "Endgültige Jenkins-Integration")
