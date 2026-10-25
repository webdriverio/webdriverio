Feature: CucumberJS JSON report
    Scenario: Attach data to the steps
        Given I attach the text "hello"
        And   I attach the JSON value "world"
        Then  the page title is "Mock Page Title"
