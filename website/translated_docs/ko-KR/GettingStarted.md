---
id: gettingstarted
title: 시작하기
---

WebdriverIO 문서에 오신 것을 환영합니다. 이 문서는 여러분이 빠르게 시작할 수 있도록 도와줄 것입니다. 만약 당신이 문제를 만났을 때, [Gitter 채널](https://gitter.im/webdriverio/webdriverio)에서 질문하고 답을 얻을 수 있으실 것입니다. 아니면 제 [트위터 계정](https://twitter.com/webdriverio)으로 연락할 수도 있습니다. 또한, 만약 당신이 서버를 작동시키거나 튜토리얼을 따라하는 테스트를 실행하는데 문제를 겪는다면, 서버와 geckodriver가 당신의 프로젝트 디렉토리에 있는지 확인하십시오. 만약 아니라면, 스텝2와 3을 따라서 다시 다운로드 하세요.

> **참고:** 이 문서들은 가장 최근버전 (v5.0.0) 의 WebdriverIO를 다루고 있습니다. 만약 당신이 여전히 v4나 그 이전의 버전을 사용하신다면, 예전 [문서](http://v4.webdriver.io)를 사용 해주세요.

다음은 당신의 첫번째 WebdriverIO 스크립트를 작성하고 실행하기 위한 목차 입니다.

## 첫 걸음

당신이 이미 [Node.js](http://nodejs.org/)를 설치했다고 가정합니다. 첫번째로 해야할 것은, 브라우저 자동화를 도와줄 브라우저 드라이버를 다운로드 하는 것 입니다. 먼저 예제 폴더를 생성합시다:

### 간단한 테스트 폴더를 생성하기

```sh
$ mkdir webdriverio-test && cd webdriverio-test
```

*테스트 폴더 위치로 이동한 상태에서:*

### Geckodriver 다운로드하기

당신의 환경에 맞는 가장 최신의 geckodriver를 다운로드 하고, 프로젝트 디렉토리에 가져다 놓읍시다.

Linux 64 bit

```sh
$ curl -L https://github.com/mozilla/geckodriver/releases/download/v0.21.0/geckodriver-v0.21.0-linux64.tar.gz | tar xz
```

OSX

```sh
$ curl -L https://github.com/mozilla/geckodriver/releases/download/v0.21.0/geckodriver-v0.21.0-macos.tar.gz | tar xz
```

참고: 다른 geckodriver 릴리즈 버전들은 [여기](https://github.com/mozilla/geckodriver/releases)에서 받을 수 있습니다. 다른 브라우저를 자동화하기 위해서는 다른 드라이버를 실행해야 합니다. 다른 브라우저들은 [awesome-selenium](https://github.com/christian-bromann/awesome-selenium#driver)의 readme 에서 찾을 수 있습니다.

### 브라우저 드라이버 실행하기

Geckodriver를 실행합시다:

```sh
$ /path/to/binary/geckodriver --port 4444
```

위 명령어는 `localhost:4444`를 Geckodriver 웹드라이버 엔드포인트 `/`로 설정합니다. 위 프로세스를 백그라운드로 실행되도록 두고, 새로운 터미널 윈도우를 생성합니다. 다음은 NPM을 통해 WebdriverIO를 다운로드 합니다:

### WebdriverIO 다운로드

명령어 실행:

```sh
$ npm install webdriverio
```

### 테스트 파일 생성하기

다음과 같은 내용의 테스트 파일 (예 `test.js`)를 생성:

```js
const { remote } = require('webdriverio');

(async () => {
    const browser = await remote({
        logLevel: 'error',
        path: '/',
        capabilities: {
            browserName: 'firefox'
        }
    });

    await browser.url('http://webdriver.io');

    const title = await browser.getTitle();
    console.log('Title was: ' + title);

    await browser.deleteSession();
})().catch((e) => console.error(e));
```

### 테스트 파일 실행하기

Node.js가 최소한 v8.11.2 또는 그 이상의 버전이 설치되어 있는지 확인하십시오. 당신의 Node.js를 최신 버전으로 업데이트하기 위해서는 [npm](https://github.com/creationix/nvm)를 설치하고 안내를 따르십시오. 위 상태가 만족 되었다면, 테스트 스크립트를 실행합니다:

```sh
$ node test.js
```

결과는 다음과 같아야 합니다:

```sh
Title was: WebdriverIO · Next-gen WebDriver test framework for Node.js
```

오예! 축하합니다! WebdriverIO를 활용한 첫 자동화 스크립트를 실행했습니다. 다음 단계로 나아가 실제 테스트를 만들어 봅시다.

## 진지해지기

*(root 디렉토리로 되돌아 갑시다)*

이제까지는 몸풀기였습니다. 이제 테스트 러너를 사용해 WebdriverIO를 실행시켜 봅시다. 만약 당신이 WebdriverIO를 통합 테스트용으로 사용하길 원한다면, 테스트 러너를 사용하길 추천합니다. 왜냐하면 그것이 여러분의 인생을 더 편하게 해줄 다양한 기능들 제공합니다. WebdriverIO v5와 그 테스트 러너는 [`@wdio/cli`](https://www.npmjs.com/package/@wdio/cli) NPM 패키지에 있습니다. 시작하려면, 먼저 다음에 나오는 것을 설치해야 합니다:

```sh
$ npm i --save-dev @wdio/cli
```

### 설정파일 생성하기

설정파일을 만드려면, 다음 설정 유틸리티를 실행하세요:

```sh
$ ./node_modules/.bin/wdio config
```

실행하면 질문 인터페이스가 나올 것입니다. 그것이 설정을 쉽고 빠르게 할 수 있도록 도와줍니다. 만악 어떻게 답해야할지 모르겠다면 다음 답변들을 따라하세요:

__Q: Where should your tests be launched?__  
A: *local_  
<br /> __Q: Shall I install the runner plugin for you?__  
A: _Yes_  
<br /> __Q: Where do you want to execute your tests?__  
A: _On my local machine_  
<br /> __Q: Which framework do you want to use?__  
A: _mocha_  
<br /> __Q: Shall I install the framework adapter for you?__  
A: _Yes* (just press enter)  
<br /> __Q: Do you want to run WebdriverIO commands synchronous or asynchronous?__  
A: *sync* (just press enter, you can also run commands async and handle promises by yourself but for the sake of simplicity let's run them synchronously)  
<br /> __Q: Where are your test specs located?__  
A: *./test/specs/**/*.js* (just press enter)  
<br /> __Q: Which reporter do you want to use?__  
A: *dot* (just press space and enter)  
<br /> __Q: Shall I install the reporter library for you?__  
A: *Yes* (just press enter)  
<br /> __Q: Do you want to add a service to your test setup?__  
A: none (just press enter, let's skip this for simplicity)  
<br /> __Q: Level of logging verbosity:__  
A: *trace* (just press enter)  
<br /> __Q: In which directory should screenshots gets saved if a command fails?__  
A: *./errorShots/* (just press enter)  
<br /> __Q: What is the base url?__  
A: *http://localhost* (just press enter)  


끝났습니다! 설정 도우미가 모든 필요한 패키지들을 설치하고, `wdio.conf.js`이름의 설정 파일을 생성해줄 것입니다. 다음 스텝은 당신의 첫 spec 파일을 생성하는 것 입니다 (테스트 파일).

### Spec 파일들 생성하기

테스트 폴더를 생성하려면:

```sh
$ mkdir -p ./test/specs
```

이제, 새 폴더 안에 간단한 spec 파일을 생성해봅시다:

```js
const assert = require('assert');

describe('webdriver.io page', () => {
    it('should have the right title', () => {
        browser.url('http://webdriver.io');
        const title = browser.getTitle();
        assert.equal(title, 'WebdriverIO - WebDriver bindings for Node.js');
    });
});
```

### 테스트러너 시작

테스트러너를 실행하기 위한 마지막 스텝입니다. 명령어창에 실행:

```sh
$ ./node_modules/.bin/wdio wdio.conf.js
```

오~예! 테스트는 성공해야 하고, 이제 당신은 WebdriverIO를 사용해 통합 테스트 작성을 시작할 수 있습니다. 만약 더 깊이있는 비디오 튜토리얼에 관심이 있으시다면, 우리가 만든 코스 [learn.webdriver.io](https://learn.webdriver.io/?coupon=wdio)에 방문해주세요. 또한 우리 커뮤니티는 다양한 [boilerplate projects](BoilerplateProjects.md) 모음이 있어서 당신이 시작하기 좋게 도와줄 수 있습니다.