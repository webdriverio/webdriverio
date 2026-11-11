@hooks
Feature: Hook status
    @hookSkips
    Scenario: A Before hook returns skipped
        Given I attach the text "hello"

    @hookFails
    Scenario: A Before hook fails
        Given I attach the text "hello"
