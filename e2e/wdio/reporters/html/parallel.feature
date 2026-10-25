Feature: HTML reporter parallel

  Scenario: S1 logs after the other scenarios start
    Given S1 opens ff0000
    When S1 waits 900 and logs
    Then S1 logs a screenshot

  Scenario: S2 fails
    Given S2 opens 0000ff
    When S2 waits 300 and logs
    Then S2 fails

  Scenario: S3 ends first
    Given S3 opens 00ff00
    When S3 waits 100 and logs
    Then S3 logs a screenshot

  @flaky
  Scenario: S4 fails the first time
    Given S4 opens ff00ff
    When S4 waits 200 and logs
    Then S4 fails the first time
