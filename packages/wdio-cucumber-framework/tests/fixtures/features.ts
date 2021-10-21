export const featureWithRules = {
    children: [
        {
            background: {
                keyword: 'Background',
                steps: [
                    {
                        keyword: 'Given ',
                        text: 'I have a background',
                    }
                ],
            }
        },
        {
            scenario: {
                id: '1',
                keyword: 'Scenario',
                steps: [
                    {
                        keyword: 'Given ',
                        text: 'I have 42 cukes in my belly',
                    }
                ]
            }
        },
        {
            rule: {
                keyword: 'Rule',
                name: 'Rule for scenario 2',
                children: [
                    {
                        scenario: {
                            id: '2',
                            name: 'rule outline',
                            steps: [
                                {
                                    keyword: 'Given ',
                                    text: 'I am on the login page',
                                }
                            ]
                        }
                    }
                ],
            }
        },
        {
            rule: {
                keyword: 'Rule',
                name: 'Rule for scenario 3 and 4',
                children: [
                    {
                        scenario: {
                            id: '3',
                            name: 'rule outline',
                            steps: [
                                {
                                    keyword: 'Given ',
                                    text: 'I am on the sign up page',
                                }
                            ]
                        }
                    },
                    {
                        scenario: {
                            id: '4',
                            name: 'rule outline',
                            steps: [
                                {
                                    keyword: 'Given ',
                                    text: 'I am on the checkout page'
                                }
                            ]
                        }
                    }
                ]
            }
        }
    ]
}