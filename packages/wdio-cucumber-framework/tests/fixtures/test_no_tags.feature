Feature: Test Feature

  Background: Background #1
    Given a step passes
    When a step passes

  Scenario: Scenario #1
    Given a step passes
    When a step passes
    Then a step passes

  Scenario: Scenario #2
    Given a step passes
    When a step passes
    Then a step passes

  Scenario: Scenario #3
    Given a step passes
    When a step passes
    Then a step passes

  Scenario Outline: Scenario #4: <param>
    Given a step passes
    When a step passes
    Then a step passes

    Examples: 
      | param |
      | input |

  Rule: Rule #1

    Background: Background #2
      Given a step passes
      When a step passes

    Scenario: Scenario #5
      Given a step passes
      When a step passes
      Then a step passes

    Scenario: Scenario #6
      Given a step passes
      When a step passes
      Then a step passes

    Scenario Outline: Scenario #7: <param>
      Given a step passes
      When a step passes
      Then a step passes

      Examples: 
        | param |
        | input |

  Rule: Rule #2

    Background: Background #3
      Given a step passes
      When a step passes

    Scenario: Scenario #8
      Given a step passes
      When a step passes
      Then a step passes

    Scenario: Scenario #9
      Given a step passes
      When a step passes
      Then a step passes

    Scenario Outline: Scenario #10: <param>
      Given a step passes
      When a step passes
      Then a step passes

      Examples: 
        | param |
        | input |
