---
id: docker
title: Docker
---

Docker es una potente tecnología de containerización que permite encapsular su suite de pruebas en un contenedor que se comporta lo mismo en cada sistema. Esto puede evitar errores debido a diferentes versiones de navegador o plataforma. Para ejecutar tus pruebas dentro de un contenedor, crea un `Dockerfile` en el directorio de tu proyecto, por ejemplo.:

```Dockerfile
FROM ianwalter/puppeteer:latest
WORKDIR /app
ADD . /app

RUN npm install

CMD npx wdio
```

Asegúrate de no incluir tu `node_modules` en tu imagen de Docker y tener estos instalados al construir la imagen. Para eso añada un archivo `.dockerignore` con el siguiente contenido:

```
node_modules
```

:::info
Estamos usando una imagen de Docker que viene con Google Chrome preinstalado. Hay varias imágenes disponibles con diferentes configuraciones del navegador. Echa un vistazo a las imágenes mantenidas por el proyecto Selenium [en Docker Hub](https://hub.docker.com/u/selenium).
:::

Como sólo podemos ejecutar Google Chrome en modo sin cabeceras en nuestro contenedor Docker, tenemos que modificar nuestro `wdio. onf.js` para asegurar que hagamos eso:

```js title="wdio.conf.js"
export const config = {
    // ...
    capabilities: [{
        maxInstances: 1,
        browserName: 'chrome',
        acceptInsecureCerts: true,
        'goog:chromeOptions': {
            args: [
                '--no-sandbox',
                '--disable-infobars',
                '--headless',
                '--disable-gpu',
                '--window-size=1440,735'
            ],
        }
    }],
    // ...
}
```

Como se menciona en [Protocolos de automatización](/docs/automationProtocols) puede ejecutar WebdriverIO usando el protocolo WebDriver o Chrome DevTools. Si utiliza WebDriver asegúrese de que la versión de Chrome instalada en su imagen coincide con la versión de [Chromedriver](https://www.npmjs.com/package/chromedriver) que ha definido en su paquete `.

Para construir el contenedor Docker se puede ejecutar:

```sh
docker build -t mytest -f Dockerfile .
```

Luego para ejecutar las pruebas, ejecuta:

```sh
docker run -it mytest
```

Para obtener más información sobre cómo configurar la imagen de Docker, consulte la [documentación de Docker](https://docs.docker.com/).
