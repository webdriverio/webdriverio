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

We will always export an instance of a page object and never create that instance in the test. Since we are writing end to end tests we always see the page as a stateless construct the same way as each http request is a stateless construct. Sure, the browser can carry session information and therefore can display different pages based on different sessions, but this shouldn't be reflected within a page object. These state changes should emerge from your actual tests.

Let's start testing the first page. For demo purposes we use [The Internet](http://the-internet.herokuapp.com) website by [Elemental Selenium](http://elementalselenium.com/) as guinea pig. Let's try to build a page object example for the [login page](http://the-internet.herokuapp.com/login). First step is to write all important selectors that are required in our `login.page` object as getter functions. As mentioned above we are using the `Object.create` method to inherit the prototype of our main page:

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

Defining selectors in getter functions might look a bit verbose but it is really useful. These functions get evaluated when you actually access the property and not when you generate the object. With that you always request the element before you do an action on it.

WebdriverIO internally remembers the last result of a command. If you chain an element command with an action command it finds the element from the previous command and uses the result to execute the action. With that you can remove the selector (first parameter) and the command looks as simple as:

```js
LoginPage.username.setValue('Max Mustermann');
```

which is basically the same thing as:

```js
var elem = $('#username');
elem.setValue('Max Mustermann');
```

or

```js
$('#username').setValue('Max Mustermann');
```

After we've defined all required elements and methods for the page we can start to write the test for it. All we need to do to use the page object is to require it and that's it. The `Object.create` method returns an instance of that page so we can start using it right away. By adding an additional assertion framework you can make your tests even more expressive:

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

From the structural side it makes sense to separate spec files and page objects and put them into different directories. Additionally you can give each page object the ending: `.page.js`. This way it is easy to figure out that you actually require a page object if you execute `var LoginPage = require('../pageobjects/form.page');`.

This is the basic principle of how to write page objects with WebdriverIO. Note that you can build up way more complex page object structures than this. For example have specific page objects for modals or split up a huge page object into different sections objects that inherit from the main page object. The pattern gives you really a lot of opportunities to encapsulate page information from your actual tests, which is important to keep your test suite structured and clear in times where the project and number of tests grows.

You can find this and some more page object examples in the [example folder](https://github.com/webdriverio/webdriverio/tree/master/examples/pageobject) on GitHub.