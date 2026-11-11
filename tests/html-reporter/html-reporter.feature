Feature: Count
    Scenario: First scenario with three steps
        Given step one
        When step two
        Then step three

    Scenario: Flaky scenario that passes on the second try
        Given step one
        Then a flaky step
