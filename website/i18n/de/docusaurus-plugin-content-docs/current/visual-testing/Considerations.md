---
index: 1
id: considerations
title: Überlegungen
---

# Wichtige Überlegungen für die optimale Nutzung

Bevor Sie in die leistungsstarken Funktionen des `@wdio/visual-service` eintauchen, ist es entscheidend, einige wichtige Überlegungen zu verstehen, die sicherstellen, dass Sie das Beste aus diesem Tool herausholen. Die folgenden Punkte sollen Sie durch bewährte Praktiken und häufige Fallstricke führen und Ihnen helfen, genaue und effiziente visuelle Testergebnisse zu erzielen. Diese Überlegungen sind nicht nur Empfehlungen, sondern wesentliche Aspekte, die Sie für die effektive Nutzung des Services in realen Szenarien beachten sollten.

## Art des Vergleichs

- **Pixel-für-Pixel-Basis:** Das Modul führt einen pixelgenauen Vergleich von Bildern durch. Während bestimmte Aspekte angepasst werden können (siehe Vergleichsoptionen), bleibt der Kernansatz ein grundlegender Pixelvergleich.
- **Auswirkungen von Browser-Updates:** Beachten Sie, dass Updates von Browsern, wie Chrome, die Schriftartendarstellung beeinflussen können, was möglicherweise eine Aktualisierung Ihrer Baseline-Bilder erforderlich macht.

## Konsistenz bei Plattformen

- **Vergleich identischer Plattformen:** Stellen Sie sicher, dass Screenshots innerhalb derselben Plattform verglichen werden. Ein Screenshot von Chrome auf einem Mac sollte beispielsweise nicht mit einem von Chrome auf Ubuntu oder Windows verglichen werden.
- **Analogie:** Einfach ausgedrückt, vergleichen Sie _'Äpfel mit Äpfeln, nicht Äpfel mit Androiden'_.

## Vorsicht bei Abweichungsprozentsätzen

- **Risiko der Akzeptanz von Abweichungen:** Seien Sie vorsichtig, wenn Sie einen Abweichungsprozentsatz akzeptieren. Dies gilt besonders für große Screenshots, bei denen das Akzeptieren einer Abweichung versehentlich bedeutende Diskrepanzen übersehen könnte, wie fehlende Schaltflächen oder Elemente.

## Simulation von Mobilgerätebildschirmen

- **Vermeiden Sie Browser-Größenänderungen zur Mobilgerätesimulation:** Versuchen Sie nicht, Mobilgerätebildschirmgrößen durch Ändern der Größe von Desktop-Browsern zu simulieren und diese als mobile Browser zu behandeln. Desktop-Browser replizieren, selbst bei Größenänderung, nicht genau die Darstellung echter mobiler Browser.
- **Authentizität beim Vergleich:** Dieses Tool zielt darauf ab, visuelle Elemente so zu vergleichen, wie sie einem Endbenutzer erscheinen würden. Ein größenveränderter Desktop-Browser spiegelt nicht die wahre Erfahrung auf einem Mobilgerät wider.

## Haltung zu Headless-Browsern

- **Nicht empfohlen für Headless-Browser:** Die Verwendung dieses Moduls mit Headless-Browsern wird nicht empfohlen. Die Begründung ist, dass Endbenutzer nicht mit Headless-Browsern interagieren, und daher werden Probleme, die aus einer solchen Nutzung entstehen, nicht unterstützt.
