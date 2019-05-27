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
