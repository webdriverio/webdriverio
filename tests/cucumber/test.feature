Feature: Example feature
    As a test script of wdio-cucumber-framework
    I should pass
    to get get published

    Background: Some repeated setup
        Given I choose the "cucumberScenario" scenario
        And   I go on the website "https://mymockpage.com"

    Scenario: Sync Execution
        When  I click on link "=foo"
        Then  the title of the page should be "Mock Page Title"

    Scenario: Async Execution
        When  I click on link "=foo" async
        Then  the title of the page should be "Mock Page Title" async

    Scenario: Retry Check
        Then  I should fail once but pass on the second run

    Scenario: data tables
        Given a table step
            | Vegetable | Rating |
            | Apricot   | 5      |
            | Brocolli  | 2      |
            | Cucumber  | 10     |

    Scenario: ignoreUndefinedDefinitions
        Given this step doesn't exist

    Scenario: failAmbiguousDefinitions
        Given this is ambiguous
        Then this is ambiguous
