# Session demos

Three short `wdio session` demos. The walkthrough, with every command, is [Session demos](https://webdriver.io/docs/session/demos) (`website/docs/session/demos.md`).

From the repository root:

```sh
node examples/session/serve.js browser
node examples/session/serve.js mobile
```

The launch console is an Electron app. Install and open it from its own directory:

```sh
cd examples/session/desktop
npm install
npx wdio session open electron ./main.js --app-arg=--no-sandbox
```
