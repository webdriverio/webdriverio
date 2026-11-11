Feature: Cucumber JSON reporter e2e

  Scenario: Open the guinea pig page
    Given I open the guinea pig page
    When I click the main title
    Then the page title is "WebdriverJS Testpage"
    But the second page link is shown

  Scenario: Attach a screenshot
    * I open the guinea pig page
    Then I attach a screenshot
