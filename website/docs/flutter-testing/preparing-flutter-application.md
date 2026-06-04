---
id: preparing-flutter-application
title: Preparing the Flutter App
---

For WebdriverIO and Appium to successfully inspect and interact with internal elements inside the Flutter Canvas, the application must expose a communication channel. This is achieved by enabling Flutter's native test extension directly within the application's source code.

> Flutter's current recommended testing path for new apps is the `integration_test` package. This guide still uses the legacy `flutter_driver` extension because the Appium Flutter Driver integrates with that test hook.

### Configuring `pubspec.yaml`

The automation extension used here is part of the legacy `flutter_driver` API. It must be explicitly declared under the development dependencies section (`dev_dependencies`).

Open your Flutter project's `pubspec.yaml` file and add the following configuration:
```yaml
dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_driver:
    sdk: flutter
```

After saving the file, run the following command in your terminal to fetch the dependencies:

```bash
flutter pub get
```

### Enabling the Extension in `main.dart`

To boot up the instrumentation server that responds to commands sent by WebdriverIO, you must invoke the `enableFlutterDriverExtension()` function before the initial application rendering occurs (`runApp`).

Here is how the structure of your `lib/main.dart` file should look:

```dart
import 'package:flutter/material.dart';
// 1. Import the Flutter driver extension package
import 'package:flutter_driver/driver_extension.dart';

void main() {
  // 2. Enable the extension before the application starts
  enableFlutterDriverExtension();

  // 3. Initialize the application normally
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

💡**Best Practice**: To prevent testing code from being included in your production build, it is highly recommended to create a separate entry point file for tests (e.g., `lib/main_e2e.dart`). This file enables the extension and then triggers the main function from your core main.dart. This ensures your production build remains clean and secure.

### Official Reference Documentation

To learn more about component exposure mechanics and `enableFlutterDriverExtension()`, refer to the official [Flutter API Reference](https://api.flutter.dev/flutter/flutter_driver_extension/enableFlutterDriverExtension.html). For the current modern testing standards, see the [Integration Testing Guide](https://docs.flutter.dev/testing/integration-tests).