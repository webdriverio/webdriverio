---
id: repl
title: Interfaz ERP
---

importar pestañas desde '@theme/Tabs'; importar TabItem desde '@theme/TabItem';

Con `v4.5.`, WebdriverIO introdujo una interfaz [REPL](https://en.wikipedia.org/wiki/Read%E2%80%93eval%E2%80%93print_loop) que le ayuda a no sólo a aprender la API de framework. pero también depurar e inspeccionar sus pruebas. Puede utilizarse de múltiples maneras.

Primero puede usarlo como comando CLI instalando `npm install -g @wdio/cli` y generar una sesión WebDriver desde la línea de comandos, p.

```sh
wdio repl chrome
```

Esto abriría un navegador Chrome que puede controlar con la interfaz REPL. Asegúrese de que tiene un controlador de navegador corriendo en el puerto `4444` para iniciar la sesión. Si tiene una cuenta de [Sauce Labs](https://saucelabs.com) (u otro proveedor de la nube), también puede ejecutar directamente el navegador en su línea de comandos en la nube a través de:

```sh
wdio repl chrome -u $SAUCE_USERNAME -k $SAUCE_ACCESS_KEY
```

Si el controlador se está ejecutando en diferentes puertos, por ejemplo: 9515, podría pasar con el argumento de línea de comandos --port o alias -p

```sh
wdio repl chrome -u $SAUCE_USERNAME -k $SAUCE_ACCESS_KEY -p 9515
```

Repl también podría ser ejecutado usando las capacidades del archivo de configuración webdriverIO. Wdio soporta objetos de capacidad; o ; lista u objeto de capacidad multiremoto.

Si el archivo de configuración utiliza un objeto de capacidades, simplemente pasa la ruta al archivo de configuración, si es una capacidad multiremota entonces, especifica qué capacidad usar desde la lista o multiremoto usando el argumento posicional . Nota: para la lista se considera el índice basado en cero.

### Ejemplo

WebdriverIO con matriz de capacidades:

```ts title="wdio.conf.ts example"
export const config = {
    // ...
    capabilities:[{
        browserName: 'chrome', // options: `firefox`, `chrome`, `opera`, `safari`
        browserVersion: '27.0', // browser version
        platformName: 'Windows 10' // OS platform
    }]
}
```

```sh
wdio repl "./path/to/wdio.config.js" 0 -p 9515
```

WebdriverIO con objeto de capacidad [multiremoto](https://webdriver.io/docs/multiremote/):

```ts title="wdio.conf.ts example"
export const config = {
    // ...
    capabilities: {
        myChromeBrowser: {
            capabilities: {
                browserName: 'chrome'
            }
        },
        myFirefoxBrowser: {
            capabilities: {
                browserName: 'firefox'
            }
        }
    }
}
```

```sh
wdio repl "./path/to/wdio.config.js" "myChromeBrowser" -p 9515
```

O si desea ejecutar pruebas móviles locales usando Appium:

<Tabs
  defaultValue="android"
  values={[
    {label: 'Android', value: 'android'},
 {label: 'iOS', value: 'ios'}
 ]
}>
<TabItem value="android">

```sh
wdio repl android
```

</TabItem>
<TabItem value="ios">

```sh
wdio repl ios
```

</TabItem>
</Tabs>

Esto abriría la sesión de Chrome/Safari en el dispositivo conectado/emulador/simulador. Asegúrese de que tiene un controlador de navegador corriendo en el puerto `4444` para iniciar la sesión.

```sh
wdio repl './path/to/your_app.apk'
```

Esto abriría la sesión de Chrome/Safari en el dispositivo conectado/emulador/simulador. Asegúrese de que tiene un controlador de navegador corriendo en el puerto `4444` para iniciar la sesión.

Las capacidades para el dispositivo iOS pueden ser pasadas con argumentos:

* `-v`      - `platformVersion`: versión de Android/iOS platform
* `-d`      - `deviceName`: nombre del dispositivo móvil
* `-u`      - `udid`: udid para dispositivos reales

Uso:

<Tabs
  defaultValue="long"
  values={[
    {label: 'Long Parameter Names', value: 'long'},
 {label: 'Short Parameter Names', value: 'short'}
 ]
}>
<TabItem value="long">

```sh
wdio repl ios --platformVersion 11.3 --deviceName 'iPhone 7' --udid 123432abc
```

</TabItem>
<TabItem value="short">

```sh
wdio repl ios -v 11.3 -d 'iPhone 7' -u 123432abc
```

</TabItem>
</Tabs>

Puede aplicar cualquier opción (ver `wdio repl --help`) disponible para su sesión REPL.

![WebdriverIO REPL](https://webdriver.io/img/repl.gif)

Otra forma de usar el REPL está dentro de tus pruebas a través del comando [`debug`](/docs/api/browser/debug). Esto detendrá el navegador cuando se llame, y le permite saltar a la aplicación (e.. a las herramientas de desarrollo) o controle el navegador desde la línea de comandos. Esto es útil cuando algunos comandos no desencadenan una determinada acción como se esperaba. Con el REPL, puede probar los comandos para ver los que están funcionando más confiablemente.
