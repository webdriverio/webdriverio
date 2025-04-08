---
id: mobile
title: Mobile Befehle
---

# Einführung in benutzerdefinierte und erweiterte Mobile-Befehle in WebdriverIO

Das Testen von mobilen Apps und mobilen Webanwendungen bringt eigene Herausforderungen mit sich, insbesondere bei der Handhabung plattformspezifischer Unterschiede zwischen Android und iOS. Während Appium die Flexibilität bietet, mit diesen Unterschieden umzugehen, erfordert es oft, dass man sich intensiv mit komplexen, plattformabhängigen Dokumentationen ([Android](https://github.com/appium/appium-uiautomator2-driver/blob/master/docs/android-mobile-gestures.md), [iOS](https://appium.github.io/appium-xcuitest-driver/latest/reference/execute-methods/)) und Befehlen auseinandersetzt. Dies kann das Schreiben von Testskripten zeitaufwändiger, fehleranfälliger und schwieriger zu warten machen.

Um diesen Prozess zu vereinfachen, führt WebdriverIO **benutzerdefinierte und erweiterte Mobile-Befehle** ein, die speziell für das Testen von mobilem Web und nativen Apps entwickelt wurden. Diese Befehle abstrahieren die Komplexität der zugrundeliegenden Appium-APIs und ermöglichen es Ihnen, präzise, intuitive und plattformunabhängige Testskripte zu schreiben. Mit dem Fokus auf Benutzerfreundlichkeit möchten wir den zusätzlichen Aufwand bei der Entwicklung von Appium-Skripten reduzieren und Sie befähigen, mobile Apps mühelos zu automatisieren.

## Warum benutzerdefinierte Mobile-Befehle?

### 1. **Vereinfachung komplexer APIs**

Einige Appium-Befehle, wie Gesten oder Element-Interaktionen, erfordern eine ausführliche und komplizierte Syntax. Um beispielsweise eine Langes-Drücken-Aktion mit der nativen Appium-API auszuführen, müssen Sie manuell eine `action`-Kette konstruieren:

```ts
const element = $('~Contacts')

await browser
    .action( 'pointer', { parameters: { pointerType: 'touch' } })
    .move({ origin: element })
    .down()
    .pause(1500)
    .up()
    .perform()
```

Mit den benutzerdefinierten Befehlen von WebdriverIO kann dieselbe Aktion mit einer einzigen, aussagekräftigen Codezeile durchgeführt werden:

```ts
await $('~Contacts').longPress();
```

Dies reduziert drastisch den Boilerplate-Code und macht Ihre Skripte sauberer und verständlicher.

### 2. **Plattformübergreifende Abstraktion**

Mobile Apps erfordern oft plattformspezifische Handhabung. Beispielsweise unterscheidet sich das Scrollen in nativen Apps erheblich zwischen [Android](https://github.com/appium/appium-uiautomator2-driver/blob/master/docs/android-mobile-gestures.md#mobile-scrollgesture) und [iOS](https://appium.github.io/appium-xcuitest-driver/latest/reference/execute-methods/#mobile-scroll). WebdriverIO überbrückt diese Lücke, indem es einheitliche Befehle wie `scrollIntoView()` bereitstellt, die plattformübergreifend nahtlos funktionieren, unabhängig von der zugrunde liegenden Implementierung.

```ts
await $('~element').scrollIntoView();
```

Diese Abstraktion stellt sicher, dass Ihre Tests portabel sind und keine ständigen Verzweigungen oder bedingte Logik erfordern, um Betriebssystemunterschiede zu berücksichtigen.

### 3. **Erhöhte Produktivität**

Durch die Reduzierung der Notwendigkeit, Low-Level-Appium-Befehle zu verstehen und zu implementieren, ermöglichen die mobilen Befehle von WebdriverIO, dass Sie sich auf das Testen der Funktionalität Ihrer App konzentrieren können, anstatt sich mit plattformspezifischen Feinheiten auseinanderzusetzen. Dies ist besonders vorteilhaft für Teams mit begrenzter Erfahrung in der mobilen Automatisierung oder solche, die ihren Entwicklungszyklus beschleunigen möchten.

### 4. **Konsistenz und Wartbarkeit**

Benutzerdefinierte Befehle bringen Einheitlichkeit in Ihre Testskripte. Anstatt unterschiedliche Implementierungen für ähnliche Aktionen zu haben, kann Ihr Team auf standardisierte, wiederverwendbare Befehle zurückgreifen. Dies macht den Codebase nicht nur besser wartbar, sondern senkt auch die Einstiegshürde für neue Teammitglieder.

## Warum bestimmte mobile Befehle verbessern?

### 1. Flexibilität hinzufügen

Bestimmte mobile Befehle wurden verbessert, um zusätzliche Optionen und Parameter bereitzustellen, die in den Standard-Appium-APIs nicht verfügbar sind. Zum Beispiel fügt WebdriverIO Wiederholungslogik, Timeouts und die Möglichkeit hinzu, Webviews nach bestimmten Kriterien zu filtern, was mehr Kontrolle über komplexe Szenarien ermöglicht.

```ts
// Example: Customizing retry intervals and timeouts for webview detection
await driver.getContexts({
  returnDetailedContexts: true,
  androidWebviewConnectionRetryTime: 1000, // Retry every 1 second
  androidWebviewConnectTimeout: 10000,    // Timeout after 10 seconds
});
```

Diese Optionen helfen dabei, Automatisierungsskripte an dynamisches App-Verhalten anzupassen, ohne zusätzlichen Boilerplate-Code.

### 2. Verbesserte Benutzerfreundlichkeit

Erweiterte Befehle abstrahieren Komplexitäten und repetitive Muster, die in den nativen APIs zu finden sind. Sie ermöglichen es Ihnen, mehr Aktionen mit weniger Codezeilen durchzuführen, was die Lernkurve für neue Benutzer reduziert und Skripte leichter lesbar und wartbar macht.

```ts
// Example: Enhanced command for switching context by title
await driver.switchContext({
  title: 'My Webview Title',
});
```

Im Vergleich zu den Standard-Appium-Methoden eliminieren erweiterte Befehle die Notwendigkeit zusätzlicher Schritte wie das manuelle Abrufen verfügbarer Kontexte und das Filtern durch diese.

### 3. Standardisierung des Verhaltens

WebdriverIO stellt sicher, dass erweiterte Befehle auf Plattformen wie Android und iOS konsistent funktionieren. Diese plattformübergreifende Abstraktion minimiert die Notwendigkeit für bedingte Verzweigungslogik basierend auf dem Betriebssystem, was zu besser wartbaren Testskripten führt.

```ts
// Example: Unified scroll command for both platforms
await $('~element').scrollIntoView();
```

Diese Standardisierung vereinfacht Codebases, besonders für Teams, die Tests auf mehreren Plattformen automatisieren.

### 4. Erhöhung der Zuverlässigkeit

Durch die Einbeziehung von Wiederholungsmechanismen, intelligenten Standardeinstellungen und detaillierten Fehlermeldungen reduzieren erweiterte Befehle die Wahrscheinlichkeit von instabilen Tests. Diese Verbesserungen stellen sicher, dass Ihre Tests widerstandsfähig gegen Probleme wie Verzögerungen bei der Webview-Initialisierung oder vorübergehende App-Zustände sind.

```ts
// Example: Enhanced webview switching with robust matching logic
await driver.switchContext({
  url: /.*my-app\/dashboard/,
  androidWebviewConnectionRetryTime: 500,
  androidWebviewConnectTimeout: 7000,
});
```

Dies macht die Testausführung vorhersehbarer und weniger anfällig für Fehler, die durch Umgebungsfaktoren verursacht werden.

### 5. Verbesserung der Debugging-Möglichkeiten

Erweiterte Befehle liefern oft reichhaltigere Metadaten, was das Debugging komplexer Szenarien erleichtert, insbesondere in Hybrid-Apps. Befehle wie getContext und getContexts können beispielsweise detaillierte Informationen über Webviews zurückgeben, einschließlich Titel, URL und Sichtbarkeitsstatus.

```ts
// Example: Retrieving detailed metadata for debugging
const contexts = await driver.getContexts({ returnDetailedContexts: true });
console.log(contexts);
```

Diese Metadaten helfen dabei, Probleme schneller zu identifizieren und zu lösen, was die allgemeine Debugging-Erfahrung verbessert.

Durch die Verbesserung mobiler Befehle macht WebdriverIO die Automatisierung nicht nur einfacher, sondern steht auch im Einklang mit seiner Mission, Entwicklern Tools zur Verfügung zu stellen, die leistungsstark, zuverlässig und intuitiv zu verwenden sind.

---

## Hybrid-Apps

Hybrid-Apps kombinieren Webinhalte mit nativer Funktionalität und erfordern eine spezialisierte Handhabung während der Automatisierung. Diese Apps verwenden Webviews, um Webinhalte innerhalb einer nativen Anwendung darzustellen. WebdriverIO bietet erweiterte Methoden für die effektive Arbeit mit Hybrid-Apps.

### Webviews verstehen

Ein Webview ist eine browserähnliche Komponente, die in eine native App eingebettet ist:

- **Android:** Webviews basieren auf Chrome/System Webview und können mehrere Seiten enthalten (ähnlich wie Browser-Tabs). Diese Webviews benötigen ChromeDriver, um Interaktionen zu automatisieren. Appium kann automatisch die erforderliche ChromeDriver-Version basierend auf der Version des System WebView oder Chrome, die auf dem Gerät installiert ist, bestimmen und sie automatisch herunterladen, wenn sie noch nicht verfügbar ist. Dieser Ansatz gewährleistet nahtlose Kompatibilität und minimiert manuelle Einrichtung. Siehe die [Appium UIAutomator2-Dokumentation](https://github.com/appium/appium-uiautomator2-driver?tab=readme-ov-file#automatic-discovery-of-compatible-chromedriver), um zu erfahren, wie Appium automatisch die richtige ChromeDriver-Version herunterlädt.
- **iOS:** Webviews werden von Safari (WebKit) angetrieben und durch generische IDs wie `WEBVIEW_{id}` identifiziert.

### Herausforderungen mit Hybrid-Apps

1. Identifizierung des richtigen Webviews unter mehreren Optionen.
2. Abrufen zusätzlicher Metadaten wie Titel, URL oder Paketname für einen besseren Kontext.
3. Umgang mit plattformspezifischen Unterschieden zwischen Android und iOS.
4. Zuverlässiges Wechseln zum richtigen Kontext in einer Hybrid-App.

### Wichtige Befehle für Hybrid-Apps

#### 1. `getContext`

Ruft den aktuellen Kontext der Sitzung ab. Standardmäßig verhält es sich wie Appiums getContext-Methode, kann aber detaillierte Kontextinformationen liefern, wenn `returnDetailedContext` aktiviert ist. Weitere Informationen finden Sie unter [`getContext`](/docs/api/mobile/getContext)

#### 2. `getContexts`

Gibt eine detaillierte Liste verfügbarer Kontexte zurück und verbessert Appiums contexts-Methode. Dies erleichtert die Identifizierung des richtigen Webviews für die Interaktion, ohne zusätzliche Befehle aufrufen zu müssen, um Titel, URL oder aktive `bundleId|packageName` zu bestimmen. Weitere Informationen finden Sie unter [`getContexts`](/docs/api/mobile/getContexts)

#### 3. `switchContext`

Wechselt zu einem bestimmten Webview basierend auf Name, Titel oder URL. Bietet zusätzliche Flexibilität, wie die Verwendung regulärer Ausdrücke für Übereinstimmungen. Weitere Informationen finden Sie unter [`switchContext`](/docs/api/mobile/switchContext)

### Wichtige Funktionen für Hybrid-Apps

1. Detaillierte Metadaten: Abrufen umfassender Details für Debugging und zuverlässigen Kontextwechsel.
2. Plattformübergreifende Konsistenz: Einheitliches Verhalten für Android und iOS, nahtlose Handhabung plattformspezifischer Eigenheiten.
3. Benutzerdefinierte Wiederholungslogik (Android): Anpassen von Wiederholungsintervallen und Timeouts für die Webview-Erkennung.

:::info Hinweise und Einschränkungen

- Android bietet zusätzliche Metadaten wie `packageName` und `webviewPageId`, während iOS sich auf `bundleId` konzentriert.
- Die Wiederholungslogik ist für Android anpassbar, aber nicht für iOS anwendbar.
- Es gibt mehrere Fälle, in denen iOS das Webview nicht finden kann. Appium bietet verschiedene zusätzliche Capabilities für den `appium-xcuitest-driver`, um das Webview zu finden. Wenn Sie glauben, dass das Webview nicht gefunden wird, können Sie versuchen, eine der folgenden Capabilities zu setzen:
  - `appium:includeSafariInWebviews`: Fügt Safari-Webkontexte zur Liste der verfügbaren Kontexte während eines nativen/Webview-App-Tests hinzu. Dies ist nützlich, wenn der Test Safari öffnet und damit interagieren muss. Standardmäßig `false`.
  - `appium:webviewConnectRetries`: Die maximale Anzahl von Wiederholungsversuchen, bevor die Erkennung von Webview-Seiten aufgegeben wird. Die Verzögerung zwischen jedem Wiederholungsversuch beträgt 500ms, Standard sind `10` Wiederholungen.
  - `appium:webviewConnectTimeout`: Die maximale Zeit in Millisekunden, die auf die Erkennung einer Webview-Seite gewartet wird. Standard ist `5000` ms.

Für fortgeschrittene Beispiele und Details siehe die WebdriverIO Mobile API-Dokumentation.
:::

---

Unsere wachsende Sammlung von Befehlen spiegelt unser Engagement wider, mobile Automatisierung zugänglich und elegant zu gestalten. Egal, ob Sie komplizierte Gesten ausführen oder mit nativen App-Elementen arbeiten, diese Befehle entsprechen der Philosophie von WebdriverIO, eine nahtlose Automatisierungserfahrung zu schaffen. Und wir hören hier nicht auf – wenn es eine Funktion gibt, die Sie sehen möchten, freuen wir uns über Ihr Feedback. Zögern Sie nicht, Ihre Anfragen über [diesen Link](https://github.com/webdriverio/webdriverio/issues/new/choose) einzureichen.
