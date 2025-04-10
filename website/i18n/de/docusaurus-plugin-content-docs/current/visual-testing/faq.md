---
id: faq
title: FAQ
---

### Muss ich die Methoden `save(Screen/Element/FullPageScreen)` verwenden, wenn ich `check(Screen/Element/FullPageScreen)` ausführen möchte?

Nein, das ist nicht notwendig. Die `check(Screen/Element/FullPageScreen)`-Methoden erledigen das automatisch für Sie.

### Meine visuellen Tests schlagen mit einer Differenz fehl, wie kann ich meine Baseline aktualisieren?

Sie können die Baseline-Bilder über die Kommandozeile aktualisieren, indem Sie das Argument `--update-visual-baseline` hinzufügen. Dies wird:

- automatisch den aktuellen Screenshot kopieren und in den Baseline-Ordner legen
- den Test bestehen lassen, falls es Unterschiede gibt, da die Baseline aktualisiert wurde

**Verwendung:**

```sh
npm run test.local.desktop  --update-visual-baseline
```

Wenn Sie Logs im Info/Debug-Modus ausführen, werden Sie folgende Logs sehen:

```logs
[0-0] ..............
[0-0] #####################################################################################
[0-0]  INFO:
[0-0]  Updated the actual image to
[0-0]  /Users/wswebcreation/Git/wdio/visual-testing/localBaseline/chromel/demo-chrome-1366x768.png
[0-0] #####################################################################################
[0-0] ..........
```

### Breite und Höhe können nicht negativ sein

Es könnte sein, dass der Fehler `Width and height cannot be negative` (Breite und Höhe können nicht negativ sein) auftritt. In 9 von 10 Fällen hängt dies damit zusammen, dass ein Bild von einem Element erstellt wird, das nicht im Sichtbereich ist. Bitte stellen Sie sicher, dass sich das Element immer im Sichtbereich befindet, bevor Sie versuchen, ein Bild davon zu erstellen.

### Installation von Canvas unter Windows schlug mit Node-Gyp-Logs fehl

Wenn Sie bei der Installation von Canvas unter Windows auf Probleme mit Node-Gyp-Fehlern stoßen, beachten Sie bitte, dass dies nur für Version 4 und niedriger gilt. Um diese Probleme zu vermeiden, sollten Sie ein Upgrade auf Version 5 oder höher in Betracht ziehen, da diese keine solchen Abhängigkeiten hat und [Jimp](https://github.com/jimp-dev/jimp) für die Bildverarbeitung verwendet.

Wenn Sie die Probleme mit Version 4 trotzdem lösen müssen, überprüfen Sie bitte:

- den Node Canvas-Abschnitt im [Erste Schritte](/docs/visual-testing#system-requirements)-Leitfaden
- [diesen Beitrag](https://spin.atomicobject.com/2019/03/27/node-gyp-windows/) zur Behebung von Node-Gyp-Problemen unter Windows. (Dank an [IgorSasovets](https://github.com/IgorSasovets))
