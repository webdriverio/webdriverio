Feature: Example feature
  As a user of WebdriverIO
  I should be able to use different commands
  to get informations about elements on the page

  Rule: Business rule 2
    Scenario: Data Tables
      Given I go on the website "http://todomvc.com/examples/react/dist/"
      When  I add the following groceries
          | Item       | Amount |
          | Milk       | 2      |
          | Butter     | 1      |
          | Noodles    | 1      |
          | Schocolate | 3      |
      Then  I should have a list of 4 items
