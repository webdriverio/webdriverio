Feature: Example feature
    As a test script of wdio-cucumber-framework
    I should pass
    to get get published

    Background: Some repeated setup
        Given I choose the "cucumberScenario" scenario
        And   I go on the website "https://mymockpage.com"

    Scenario: Foo Bar
        When  I click on link "=foo"
        Then  the title of the page should be "Mock Page Title"
