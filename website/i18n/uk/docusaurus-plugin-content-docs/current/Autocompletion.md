---
id: autocompletion
title: Автодоповнення коду
---

## IntelliJ

Автодоповнення коду працюватиме одразу в IDEA та WebStorm.

Якщо ви вже деякий час пишете код, вам, ймовірно, подобається автодоповнення. Функція автодоповнення коду є стандартною в багатьох редакторах коду.

![Автодоповнення коду](/img/autocompletion/0.png)

Визначення типів за допомогою [JSDoc](http://usejsdoc.org/) використовується для документування коду. Це допомагає побачити додаткову інформацію про параметри та їхні типи.

![Автодоповнення коду](/img/autocompletion/1.png)

Використовуйте стандартні комбінації клавіш <kbd>⇧ + ⌥ + ПРОБІЛ</kbd> у середовищах розробки IntelliJ, щоб переглянути доступну документацію:

![Автодоповнення коду](/img/autocompletion/2.png)

## Visual Studio Code (VSCode)

У Visual Studio Code зазвичай є вбудована підтримка типів, і не потрібно робити нічого додатково.

![Автодоповнення коду](/img/autocompletion/14.png)

Якщо ви використовуєте чистий JavaScript і хочете мати належну підтримку типів, вам потрібно створити `jsconfig.json` у корені вашого проєкту та вказати пакунки wdio, що використовується, наприклад:

```json title="jsconfig.json"
{
    "compilerOptions": {
        "types": [
            "node",
            "@wdio/globals/types",
            "@wdio/mocha-framework"
        ]
    }
}
```
