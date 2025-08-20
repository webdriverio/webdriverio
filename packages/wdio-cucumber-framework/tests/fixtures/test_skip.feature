Feature: Test Feature

  Background: Background #1
    Given a step passes
    When a step passes

  @skip(browserName="chrome")
  @skip(browserName=["firefox","safari"])
  Scenario: Scenario #1
    Given a step passes
    When a step passes
    Then a step passes

  @skip()
  Scenario: Scenario #2
    Given a step passes
    When a step passes
    Then a step passes
