---
id: gettingstarted
title: தொடங்குதல்
---

WebdriverIO ஆவணப்படுத்தலுக்கு வரவேற்கிறோம். விரைவாகத் தொடங்க இது உதவும். நீங்கள் சிக்கல்களைச் சந்திக்க நேர்ந்தால், எங்கள் [Discord Support Server](https://discord.webdriver.io) இல் உதவி மற்றும் பதில்களைக் காணலாம் அல்லது [Twitter](https://twitter.com/webdriverio)இல் எங்களை அணுகலாம்.

:::info
WebdriverIO இன் சமீபத்திய பதிப்பின் (__>=8.x__) ஆவணங்கள் இவை. நீங்கள் இன்னும் பழைய பதிப்பைப் பயன்படுத்துகிறீர்கள் என்றால், தயவுசெய்து [old documentation websites](/versions) யைப் பார்வையிடவும்!
:::

<LiteYouTubeEmbed id="rA4IFNyW54c" title="WebdriverIO உடன் தொடங்குதல்" />

:::tip அதிகாரப்பூர்வ YouTube சேனல் 🎥

[official YouTube channel](https://youtube.com/@webdriverio)இல் WebdriverIO ஐச் பற்றி மேலும் வீடியோக்களைக் காணலாம். நீங்கள் குழுசேர உறுதி செய்யவும்!

:::

## WebdriverIO அமைப்பைத் தொடங்கவும்

[WebdriverIO Starter Toolkit](https://www.npmjs.com/package/create-wdio)ஐப் பயன்படுத்தி ஏற்கனவே உள்ள அல்லது புதிய ப்ரொஜெக்டிற்கு முழு WebdriverIO அமைப்பைச் சேர்க்க, இயக்கவும்:

நீங்கள் ஏற்கனவே உள்ள ப்ரொஜெக்ட்டின் ரூட் டைரக்டரியில் இருந்தால், இயக்கவும்:

<Tabs
  defaultValue="npm"
  values={[
    {label: 'NPM', value: 'npm'},
 {label: 'Yarn', value: 'yarn'},
 {label: 'pnpm', value: 'pnpm'},
 ]
}>
<TabItem value="npm">

```sh
npm init wdio .
```

or if you want to create a new project:

```sh
npm init wdio ./path/to/new/project
```

</TabItem>
<TabItem value="yarn">

```sh
yarn create wdio .
```

or if you want to create a new project:

```sh
yarn create wdio ./path/to/new/project
```

</TabItem>
<TabItem value="pnpm">

```sh
pnpm create wdio .
```

or if you want to create a new project:

```sh
pnpm create wdio ./path/to/new/project
```

</TabItem>
</Tabs>

இந்த ஒற்றை கட்டளை WebdriverIO CLI கருவியைப் பதிவிறக்குகிறது மற்றும் உங்கள் டெஸ்ட் தொகுப்பை உள்ளமைக்க உதவும் உள்ளமைவு வழிகாட்டியை இயக்குகிறது.

<CreateProjectAnimation />

அமைவு மூலம் உங்களுக்கு வழிகாட்டும் ஒரு தொகுப்புக் கேள்விகளை வழிகாட்டி கேட்கும். [Page Object](https://martinfowler.com/bliki/PageObject.html) வடிவத்தைப் பயன்படுத்தி Chrome உடன் மோக்காவைப் பயன்படுத்தும் இயல்புநிலை அமைப்பைத் தேர்வுசெய்ய, நீங்கள் `--yes` பாராமீட்டரை அனுப்பலாம்.

<Tabs
  defaultValue="npm"
  values={[
    {label: 'NPM', value: 'npm'},
 {label: 'Yarn', value: 'yarn'},
 {label: 'pnpm', value: 'pnpm'},
 ]
}>
<TabItem value="npm">

```sh
npm init wdio . -- --yes
```

</TabItem>
<TabItem value="yarn">

```sh
yarn create wdio . --yes
```

</TabItem>
<TabItem value="pnpm">

```sh
pnpm create wdio . --yes
```

</TabItem>
</Tabs>

## Install CLI Manually

You can also add the CLI package to your project manually via:

```sh
npm i --save-dev @wdio/cli
npx wdio --version # prints e.g. `8.13.10`

# run configuration wizard
npx wdio config
```

## டெஸ்டை இயக்கவும்

`run` கட்டளையைப் பயன்படுத்தி, நீங்கள் இப்போது உருவாக்கிய WebdriverIO கட்டமைப்பைச் சுட்டிக்காட்டி உங்கள் டெஸ்ட் தொகுப்பைத் தொடங்கலாம்:

```sh
npx wdio run ./wdio.conf.js
```

குறிப்பிட்ட டெஸ்ட் பைல்களை இயக்க விரும்பினால், `--spec` பாராமீட்டரைச் சேர்க்கலாம்:

```sh
npx wdio run ./wdio.conf.js --spec example.e2e.js
```

அல்லது உங்கள் கட்டமைப்பு பைலில் தொகுப்புகளை வரையறுத்து, தொகுப்பில் வரையறுக்கப்பட்ட டெஸ்ட் பைல்களை இயக்கவும்:

```sh
npx wdio run ./wdio.conf.js --suite exampleSuiteName
```

## ஸ்கிரிப்டில் இயக்கவும்

நீங்கள் ஒரு Node.JS ஸ்கிரிப்ட்டில் [ Standalone Mode ](/docs/setuptypes#standalone-mode) இல் WebdriverIO ஐ ஒரு தன்னியக்க இயந்திரமாகப் பயன்படுத்த விரும்பினால், நீங்கள் WebdriverIO ஐ நேரடியாக நிறுவி அதைத் தொகுப்பாகப் பயன்படுத்தலாம், எ.கா. இணையதளத்தின் ஸ்கிரீன்ஷாட்டை உருவாக்க:

```js reference useHTTPS
https://github.com/webdriverio/example-recipes/blob/fc362f2f8dd823d294b9bb5f92bd5991339d4591/getting-started/run-in-script.js#L2-L19
```

__Note:__ அனைத்து WebdriverIO கட்டளைகளும் ஏசின்க்ரநஸ் மற்றும் [`async/waiit`](https://javascript.info/async-await)ஐப் பயன்படுத்தி சரியாகக் கையாளப்பட வேண்டும்.

## டெஸ்டுகளை பதிவு செய்

WebdriverIO உங்கள் டெஸ்ட் செயல்களைத் திரையில் பதிவுசெய்து, தானாகவே WebdriverIO டெஸ்ட் ஸ்கிரிப்ட்களை உருவாக்குவதன் மூலம் தொடங்குவதற்கு உதவும் கருவிகளை வழங்குகிறது. மேலும் தகவலுக்கு [Recorder tests with Chrome DevTools Recorder](/docs/record) யைப் பார்க்கவும்.

## கணினி தேவைகள்

நீங்கள் [Node.js](http://nodejs.org) ஐ நிறுவ வேண்டும்.

- குறைந்தது v16.x அல்லது அதற்கு மேற்பட்டவற்றை நிறுவவும் ஏனென்றால் இது தான் பழமையான செயலில் உள்ள LTS பதிப்பு என்பதால்
- LTS வெளியீடாக இருக்கும் அல்லது மாறும் வெளியீடுகள் மட்டுமே அதிகாரப்பூர்வமாக ஆதரிக்கப்படும்

உங்கள் கணினியில் Node தற்போது நிறுவப்படவில்லை எனில், பல செயலில் உள்ள Node.js பதிப்புகளை நிர்வகிப்பதற்கு உதவ, [NVM](https://github.com/creationix/nvm) அல்லது [Volta](https://volta.sh/) போன்ற கருவியைப் பயன்படுத்தப் பரிந்துரைக்கிறோம். NVM ஒரு பிரபலமான தேர்வாகும், அதே சமயம் Voltaவும் ஒரு நல்ல மாற்றாகும்.
