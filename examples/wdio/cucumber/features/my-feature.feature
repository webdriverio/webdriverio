Feature: Example feature
  As a user of WebdriverIO
  I should be able to use different commands
  to get informations about elements on the page

  Scenario: Get size of an element
    Given I go on the website "https://github.com/"
    Then  should the element ".header-logged-out a" be 32px wide and 35px high

  Scenario: Get title of website
    Given I go on the website "https://github.com/"
    Then  should the title of the page be "The world’s leading software development platform · GitHub"

  Scenario: Data Tables
    Given I go on the website "http://todomvc.com/examples/react/#/"
    When  I add the following grocieries
        | Item       | Amount |
        | Milk       | 2      |
        | Butter     | 1      |
        | Noodles    | 1      |
        | Schocolate | 3      |
    Then  I should have a list of 4 items
