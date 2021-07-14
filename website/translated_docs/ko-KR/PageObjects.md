---
id: pageobjects
title: 페이지 오브젝트 패턴
---

새로운 버전 (v4)의 WebdriverIO는 페이지 오브젝트 패턴을 지원하도록 디자인 되었습니다. 엘리먼트를 일급 객체로 취급하는 원칙을 도입하면서, 이제 큰 규모의 테스트 수트를 이 패턴을 이용하여 만들 수 있습니다. 페이지 오브젝트를 구현하기 위해 추가적인 패키지가 필요하지 않습니다. `Object.create` 메서드가 우리에게 필요한 모든 기능을 제공 합니다.

- 페이지 오브젝트 간의 상속
- 엘리먼트들의 게으른 로딩
- 메서드와 액션들의 캡슐화

페이지 오브젝트의 목적은 어떤 페이지의 정보든지 실제 테스트로 부터 추상화를 하는 것 입니다. 이상적으로는 당신은 특정 페이지의 모든 셀렉터나 고유한 명령어들을 페이지 오브젝트로 저장 함으로서, 만약 테스트 대상 페이지가 완전히 다시 디자인 되어도 여전히 테스트를 수행할 수 있습니다.

먼저, 당신은 `Page`라 불리는 메인 페이지 오브젝트가 필요합니다. 그것은 모든 페이지 오브젝트들이 상속 받는 일반적인 셀렉터나 메서드들을 포함 해야합니다. 모든 자녀 페이지 오브젝트들과 같이 `Page`는 다음의 프로토타입 모델을 이용하여 생성 됩니다.

```js
export default class Page {
    constructor() {
        this.title = 'My Page';
    }

    open(path) {
        browser.url(path);
    }
}
```

우리는 언제나 페이지 오브젝트의 인스턴스를 내보내야(export) 하고, 절대로 테스트 내에서 인스턴스를 생성하지 않아야 합니다. 우리가 엔드 투 엔드 테스트를 작성하기 때문에, 각각의 http 요청이 상태가 없는 구조인 것 처럼, 페이지들을 상태가 없는 구조로 보아야 합니다. 물론, 브라우저가 세션 정보를 전달할 수 있고, 다른 세션 정보에 따라 다른 페이지를 보여줄 수 있습니다. 그렇지만 이것이 페이지 오브젝트 안에 반영되어서는 안 됩니다. 이러한 상태의 변화는 당신의 실제 테스트에 따라 나타나야 합니다.

그럼 첫번째 페이지 테스팅을 시작 해봅시다. 데모의 목적으로 우리는 [Elemental Selenium](http://elementalselenium.com/) 에서 만든 [The Internet](http://the-internet.herokuapp.com) 웹사이트를 사용 합니다. [login page](http://the-internet.herokuapp.com/login) 로 페이지 오브젝트 예제를 생성해 봅시다. 첫 번째 할 것은, `login.page`에 요구되는 모든 중요한 셀렉터들을 getter 함수를 통해 오브젝트로 만듭시다. 위에 서술한 것 처럼, 우리는 메인 페이지의 프로토타입을 상속 받기 위해서 `Object.create` 메서드를 사용 할 것입니다.

```js
// login.page.js
import Page from './page';

class LoginPage extends Page {

    get username() { return $('#username'); }
    get password() { return $('#password'); }
    get submitBtn() { return $('form button[type="submit"]'); }
    get flash() { return $('#flash'); }
    get headerLinks() { return $$('#header a'); }

    open() {
        super.open('login');
    }

    submit() {
        this.submitBtn.click();
    }

}

export default new LoginPage();
```

셀럭터들을 getter 함수로 정의하는 것은 약간 과한 것 처럼 보이지만 매우 유용합니다. 이 함수들은 당신이 객체를 생성할 때가 아니라 실제로 그 특성에 접근할 때 평가 됩니다. (lazy loading) 그것으로 당신은 당신이 실제로 엘리먼트를 대상으로 액션을 취하기 전에 언제나 새로 요청 합니다.

WebdriverIO는 내부적으로 마지막 명령의 결과들을 저장하고 있습니다. 만약 액션 명령으로 엘리먼트를 연속하여 호출하는 경우 마지막 명령의 엘리먼트를 찾아서 그것을 대상으로 액션을 실행합니다. 그것으로 첫번째 파라미터로 사용하는 셀렉터를 제거할 수 있어서, 다음과 같이 간단해 집니다:

```js
LoginPage.username.setValue('Max Mustermann');
```

이는 기본적으로 다음과 동일합니다:

```js
var elem = $('#username');
elem.setValue('Max Mustermann');
```

또는

```js
$('#username').setValue('Max Mustermann');
```

페이지에 필요한 모든 엘리먼트들과 메서드들을 정의하고나서 우리는 테스트를 작성을 시작할 수 있습니다. 우리가 페이지 오브젝트들을 사용하기 위해서 필요한 것은 단지 그것들을 요청하는 것 뿐입니다. `Object.create` 메서드는 대상 페이지의 인스턴스를 반환하기 떄문에, 우리는 그것을 즉시 사용할 수 있습니다. 검증 프레임워크를 추가 함으로서 당신은 테스트들을 더욱 표현력 있게 만들 수 있습니다:

```js
// login.spec.js
import { expect } 'chai';
import LoginPage '../pageobjects/login.page';

describe('login form', () => {
    it('should deny access with wrong creds', () => {
        LoginPage.open();
        LoginPage.username.setValue('foo');
        LoginPage.password.setValue('bar');
        LoginPage.submit();

        expect(LoginPage.flash.getText()).to.contain('Your username is invalid!');
    });

    it('should allow access with correct creds', () => {
        LoginPage.open();
        LoginPage.username.setValue('tomsmith');
        LoginPage.password.setValue('SuperSecretPassword!');
        LoginPage.submit();

        expect(LoginPage.flash.getText()).to.contain('You logged into a secure area!');
    });
});
```

구조적인 측면에서도 스펙 파일들과 페이지 오브젝트들을 다른 디렉토리들로 분리하는 것이 이치에 맞습니다. 추가적으로, 당신은 각 페이지 오브젝트들을 `.page.js`로 명명할 수 있습니다. 이러한 방식은 만약 당신이 `var LoginPage = require('../pageobjects/form.page');` 와 같은 코드를 실행할 때, 어떤 페이지 오브젝트를 불러오는지 찾기 쉽습니다.

이것이 WebdriverIO로 페이지 오브젝트를 작성하는 기본적인 원칙 입니다. 이것 보다 더 복잡한 구조의 페이지 오브젝트 구조를 만들 수도 있습니다. 예를 들면 페이지의 일부에 대한 페이지 오브젝트를 갖는다거나, 큰 페이지를 메인 오브젝트를 상속하는 여러 오브젝트들로 구성된 섹션으로 나눌 수 있습니다. 이 패턴은 여러분의 실제 테스트를 캡슐화 할 수 있는 기회를 제공하는데, 이는 시간이 지나며 프로젝트와 그에 따른 테스트들이 증가하더라도 구조적이고 깔끔하게 유지하게 해줍니다.

추가적인 페이지 오브젝트 예제는 깃허브에 있는 [예제 폴더](https://github.com/webdriverio/webdriverio/tree/master/examples/pageobject) 에서 찾아볼 수 있습니다.