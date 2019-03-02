Feature: Example feature
    As a test script of wdio-cucumber-framework
    I should pass if I understand how to retry failed step definitons

    Scenario: Foo Bar Doo
        Given I set retryTest to "1"
        And   I go on the website "http://webdriver.io" that can fail one time
        Then  the last command should be "url"

    Scenario: Next Foo Bar
        Given I set retryTest to "2"
        Then  should the title of the page be "Google"
        And   the last command should be "getTitle"

    Scenario: Async Foo Bar
        Given I set retryTest to "3"
        And   I go on the website "foobar" the async way
        Then  the last command should be "url"

    Scenario: Next async Foo Bar
        Given I set retryTest to "2"
        Then  I click on link "foobar" the async way
        Then  the last command should be "click"
