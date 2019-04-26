Feature: Example feature
    As a test script of wdio-cucumber-framework
    I should pass
    to get get published

    Background: Some repeated setup
        Given I go on the website "https://mymockpage.com"

    Scenario: Foo Bar
        When  I click on link "=foo"
        Then  the title of the page should be "bar"

    Scenario: Foo Baz
        When  I click on link "=fooFo"
        Then  the title of the page should be "bar2"

    Scenario Outline: Foo Bar Baz
        When  I click on link "<link>"
        Then  the title of the page should be "<pageTitle>"

        Examples:
            | link  | pageTitle |
            | =foo2 | bar3    |
            | =foo3 | bar4    |
