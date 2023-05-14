---
id: repl
title: REPL interface
---

`v4.5.0`உடன், WebdriverIO ஆனது [REPL](https://en.wikipedia.org/wiki/Read%E2%80%93eval%E2%80%93print_loop) இன்டெர்பேசை அறிமுகப்படுத்தியது, இது பிரமேஒர்க் API ஐக் கற்றுக்கொள்வது மட்டுமல்லாமல், பிழைத்திருத்தம் மற்றும் உங்கள் டெஸ்டுகளை ஆய்வு செய்ய உதவுகிறது. இது பல வழிகளில் பயன்படுத்தப்படலாம்.

முதலில் `npm install -g @wdio/cli` ஐ நிறுவி CLI கட்டளையாகப் பயன்படுத்தலாம் மற்றும் கட்டளை வரியிலிருந்து WebDriver அமர்வை உருவாக்கலாம், எ.கா.

```sh
wdio repl chrome
```

இது REPL இடைமுகத்துடன் நீங்கள் கட்டுப்படுத்தக்கூடிய Chrome உலாவியைத் திறக்கும். அமர்வைத் தொடங்க, போர்ட் `4444` இல் இயங்கும் பிரௌசர் டிரைவர் உங்களிடம் உள்ளதா என்பதை உறுதிப்படுத்தவும். உங்களிடம் [Sauce Labs](https://saucelabs.com) (அல்லது பிற கிளவுட் விற்பனையாளர்) கணக்கு இருந்தால், உங்கள் கமாண்ட் லைனில் பிரௌசரை நேரடியாகக் கிளவுடில் இயக்கலாம்:

```sh
wdio repl chrome -u $SAUCE_USERNAME -k $SAUCE_ACCESS_KEY
```

டிரைவர் வெவ்வேறு போர்ட்டில் இயங்கினால், எ. கா: 9515, அது கமாண்ட் லைன் ஆர்குமென்டில் --port அல்லது alias -p உடன் அனுப்பப்படும்

```sh
wdio repl chrome -u $SAUCE_USERNAME -k $SAUCE_ACCESS_KEY -p 9515
```

WebdriverIO config பைலில் உள்ள capabilitiesயை பயன்படுத்தி Repl ஐ இயக்கலாம். Wdio supports capabilities ஆப்ஜெக்ட்; அல்லது ; multiremote capability list அல்லது ஆப்ஜெக்ட்.

config பைல் capabilities ஆப்ஜெக்டை பயன்படுத்தினால், config பைலுக்கான பாதையைச் செலுத்தவும், அது multiremote capability என்றால், list அல்லது multiremoteல் இருந்து எந்த capabilities யைப் பயன்படுத்த வேண்டும் என்பதைக positional argument மூலம் குறிப்பிடவும். குறிப்பு: listக்கு நாங்கள் பூஜ்ஜிய அடிப்படையிலான குறியீட்டைக் கருதுகிறோம்.

### எடுத்துக்காட்டு

WebdriverIO with capability array:

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

WebdriverIO with [multiremote](https://webdriver.io/docs/multiremote/) capability object:

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

அல்லது Appium ஐப் பயன்படுத்தி லோக்கல் மொபைல் டெஸ்டுகளை ரன் செய்ய விரும்பினால்:

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

இது கனெக்டட் டிவைஸ்/எமுலேட்டர்/சிமுலேட்டரில் Chrome/Safari அமர்வைத் திறக்கும். அமர்வைத் தொடங்குவதற்கு Appium போர்ட் `4444` இல் இயங்குவதை உறுதிசெய்யவும்.

```sh
wdio repl './path/to/your_app.apk'
```

இது கனெக்டட் டிவைஸ்/எமுலேட்டர்/சிமுலேட்டரில் ஆப் அமர்வைத் திறக்கும். அமர்வைத் தொடங்குவதற்கு Appium போர்ட் `4444` இல் இயங்குவதை உறுதிசெய்யவும்.

iOS சாதனத்திற்கான Capabilitiesகளை ஆர்குமென்சுடன் அனுப்பலாம்:

* `-v`      - `platformVersion`: ஆண்ட்ராய்டு/iOS இயங்குதளத்தின் பதிப்பு
* `-d`      - `deviceName`: மொபைல் சாதனத்தின் பெயர்
* `-u`      - `udid`: ரியல் சாதனங்களுக்கான udid

பயன்பாடு:

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

உங்கள் REPL அமர்வுக்குக் கிடைக்கக்கூடிய எந்த விருப்பங்களையும் நீங்கள் பயன்படுத்தலாம் (`wdio repl --help`ஐப் பார்க்கவும்).

![WebdriverIO REPL](https://webdriver.io/img/repl.gif)

REPL ஐப் பயன்படுத்த மற்றொரு வழி [`debug`](/docs/api/browser/debug) கட்டளை வழியாக உங்கள் டெஸ்டிற்குள் உள்ளது. அழைக்கப்படும்போது இது பிரௌசரை நிறுத்தும், மேலும் நீங்கள் பயன்பாட்டிற்கு (எ.கா. dev கருவிகளுக்கு) செல்ல அல்லது கமாண்ட் லைனிலிருந்து பிரௌசரைக் கட்டுப்படுத்த உதவுகிறது. சில கட்டளைகள் எதிர்பார்த்தபடி ஒரு குறிப்பிட்ட செயலைத் தூண்டாதபோது இது உதவியாக இருக்கும். REPL உடன், எந்த கட்டளைகள் மிகவும் நம்பகத்தன்மையுடன் செயல்படுகின்றன என்பதைப் பார்க்க நீங்கள் முயற்சி செய்யலாம்.
