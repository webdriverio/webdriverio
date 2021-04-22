---
id: repl
title: REPL-Schnittstelle
---

Mit `v4.5.0` WebdriverIO führte eine [REPL](https://en.wikipedia.org/wiki/Read%E2%80%93eval%E2%80%93print_loop) -Schnittstelle ein, die Ihnen hilft, nicht nur die Framework-API zu erforschen, sondern auch Ihre Tests besser zu debuggen und zu überprüfen. Diese kann auf verschiedene Weise verwendet werden. Zuerst können Sie diese über einen CLI-Befehl verwenden und eine WebDriver-Sitzung von der Kommandozeile starten, z.B.:

```sh
$ wdio repl chrome
```

Dies würde einen Chrome-Browser öffnen, den Sie mit der REPL-Schnittstelle steuern können. Stellen Sie sicher, dass Sie einen Browser-Treiber auf Port `4444` verwenden, um die Sitzung zu starten. Wenn Sie ein [SauceLabs](https://saucelabs.com) (oder andere Cloud-Anbieter) Konto haben, können Sie auch den Browser direkt in Ihrer Befehlszeile in der Cloud über:

```sh
$ wdio repl chrome -u $SAUCE_USERNAME -k $SAUCE_ACCESS_KEY
```

Sie können jede andere Option für Ihre REPL-Sitzung anwenden (siehe `wdio --help`).

![WebdriverIO REPL](http://webdriver.io/images/repl.gif)

Eine andere Möglichkeit, die REPL zu nutzen, ist in Ihren Tests über den [`debug`](/api/utility/debug.html) Befehl. Es stoppt den Browser und ermöglicht es Ihnen die Applikation zu untersuchen (z.B.: über die DevTools Applikation) oder den Browser über die Kommandozeile zu steuern. Dies ist hilfreich, wenn einige Befehle nicht die erwartete Aktion auslösen. Mit der REPL können Sie dann die Befehle ausprobieren, wie zuverlässig diese funktionieren.