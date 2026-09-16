---
id: preparing-flutter-application
title: Preparing the Flutter App
---

For WebdriverIO and Appium to inspect and interact with internal elements inside the Flutter canvas, the application must expose a communication channel. This is achieved by enabling Flutter's test extension in the application's source code.

:::info Sharing with Development Teams
Automation engineers (QAs) often do not have direct access to the Flutter app codebase. If you do not maintain the app code yourself, share this page with your development team so they can add the `flutter_driver` extension and provide a test build (`.apk`, `.app`, or `.ipa`).
:::

:::note Legacy Extension
Flutter's recommended testing path for newer apps is the `integration_test` package. However, the Appium Flutter Driver integrates with the legacy `flutter_driver` extension, which is why this guide uses `enableFlutterDriverExtension()`.
:::

### Configuring `pubspec.yaml`

Add `flutter_driver` under `dev_dependencies` in your Flutter project's `pubspec.yaml` file:

```yaml
dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_driver:
    sdk: flutter
```

Fetch the dependencies:

```bash
flutter pub get
```

### Enabling the Extension in `main.dart`

To start the instrumentation server that responds to commands from WebdriverIO, invoke `enableFlutterDriverExtension()` before `runApp`:

```dart
import 'package:flutter/material.dart';
import 'package:flutter_driver/driver_extension.dart';

void main() {
  // Enable the Flutter driver extension before starting the app
  enableFlutterDriverExtension();

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(title: const Text('E2E Testing Flutter')),
        body: const Center(child: Text('Application ready for automation!')),
      ),
    );
  }
}
```

:::tip Best Practice: Separate Test Entry Point
To prevent test instrumentation code from entering production builds, create a separate entry point file (such as `lib/main_e2e.dart`) that enables the extension and calls the main app. This keeps production builds clean and secure:

```dart
import 'package:flutter_driver/driver_extension.dart';
import 'main.dart' as app;

void main() {
  enableFlutterDriverExtension();
  app.main();
}
```
:::

### Official Reference Documentation

To learn more about component exposure mechanics and `enableFlutterDriverExtension()`, refer to the official [Flutter API Reference](https://api.flutter.dev/flutter/flutter_driver_extension/enableFlutterDriverExtension.html) and Flutter's [Integration Testing Guide](https://docs.flutter.dev/testing/integration-tests).