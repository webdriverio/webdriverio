Feature: parallel videos

  Scenario: red test
    Given I open the page of "red test"
    When I wait 600 ms
    And I click the button
    Then I wait 300 ms

  Scenario: blue test
    Given I open the page of "blue test"
    When I wait 100 ms
    And I click the button
    Then I wait 300 ms

  Scenario: green test
    Given I open the page of "green test"
    When I wait 400 ms
    And I click the button
    Then I wait 300 ms

  Scenario: yellow test
    Given I open the page of "yellow test"
    When I click the button of "yellow test" in a new tab
    Then I click the button
