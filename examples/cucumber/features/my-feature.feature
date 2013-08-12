Feature: Example feature
  As a user of webdriverjs
  I should be able to use different commands
  to get informations about elements on the page

  Scenario: Get size of an element
    Given I go on the website "https://github.com/"
    When I use getElementSize() on the element ".header-logo-wordmark"
    Then I should get a width of "89" and height of "32"

  Scenario: Get title of website
    Given I go on the website "https://github.com/"
    When I use getTitle() to get the title of this website
    Then the command should return "GitHub · Build software better, together."

  Scenario: Get CSS property of element
    Given I go on the website "https://github.com/"
    When I use getElementCssProperty() to get the "color" attribute of an element with "css selector" "a[href='/plans']"
    Then the command should return "rgba(65,131,196,1)"