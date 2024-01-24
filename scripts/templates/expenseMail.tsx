import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
    CodeInline,
    CodeBlock,
    a11yDark
} from '@react-email/components'
import { Tailwind } from '@react-email/tailwind'
import * as React from 'react'

interface ExpenseEmailProps {
    username: string
    prNumber: number
    prURL: string
    expenseAmount: number
    secretKey: string
}

export const ExpenseEmail = ({
    username,
    prNumber,
    prURL,
    expenseAmount,
    secretKey
}: ExpenseEmailProps) => {
    const previewText = `Thank you for your work on PR #${prNumber}. You are eligible to expense your work.`
    const date = new Date()
    const formattedDate = (
        `${date.getMonth() + 1}`.padStart(2, '0') + '/' +
        `${date.getDate()}`.padStart(2, '0') + '/' +
        date.getFullYear()
    )
    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Tailwind>
                <Body className="bg-white my-auto mx-auto font-sans px-2">
                    <Container style={container} className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
                        <Section className="mt-[32px]">
                            <Img
                                src="https://webdriver.io/assets/images/robot-3677788dd63849c56aa5cb3f332b12d5.svg"
                                width="120"
                                alt="WebdriverIO"
                                className="my-0 mx-auto"
                            />
                        </Section>
                        <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                            Thank you for <strong>contributing</strong> to <strong>WebdriverIO</strong>!
                        </Heading>
                        <Text className="text-black text-[14px] leading-[24px]">
                            Hello <strong>{username}</strong>,
                        </Text>
                        <Text className="text-black text-[14px] leading-[24px]">
                            The WebdriverIO team would like to thank you deeply for your contribution on pull request <Link
                                href={prURL}
                                className="text-blue-600 no-underline"
                            >
                                <CodeInline>#{prNumber}</CodeInline>
                            </Link>.
                            This project thrives on the invaluable involvement of our community and we would like to
                            give back to everyone who has taken time to improve the project.
                        </Text>
                        <Text className="text-black text-[14px] leading-[24px]">
                            The reviewer of your pull request has granted you an expense of <strong>${expenseAmount}</strong> 💸
                        </Text>
                        <Text className="text-black text-[14px] leading-[24px]">
                            Submit your expense via OpenCollective by clicking the button below. Create an account,
                            select <strong>Invoice</strong>, enter your address, select a payment method, and click <strong>Next</strong>.
                            Fill in expense details on the next page, including your pull request URL in the <strong>Expense
                            title</strong> and the pull request title in the <strong>Expense description</strong>. Set the
                            date to <strong>{formattedDate}</strong> and the amount to <strong>${expenseAmount}</strong>. Finally, paste
                            the provided key into the notes section on the last page.
                        </Text>
                        <CodeBlock theme={a11yDark} code={secretKey} language="markdown" />
                        <Text className="text-black text-[14px] leading-[24px]">
                            With this key we ensure that the author of the pull request (you) can authenticate this expense, so please
                            don't share it with anyone. Lastly, make sure all your data is correct and click <strong>Submit expense</strong>.
                            Once your expense has been approved, you will receive the money within 1-2 weeks.
                        </Text>
                        <Section className="text-center mt-[32px] mb-[32px]">
                            <Button
                                className="bg-[#EA5907] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                                href={'https://opencollective.com/webdriverio/expenses/new'}
                            >
                                Submit Expense on OpenCollective
                            </Button>
                        </Section>
                        <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
                        <Text className="text-[#666666] text-[12px] leading-[24px]">
                            Your are eligible to expense your work within the next <strong>30 days</strong>. If you
                            have any questions, please reply to this email. You can find more information
                            about our expense policy in our{' '}
                            <Link
                                href={'https://github.com/webdriverio/webdriverio/blob/main/GOVERNANCE.md#sponsoring-and-donations'}
                                className="text-blue-600 no-underline"
                            >
                                governance documentation
                            </Link>.
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    )
}

const container = {
    border: '1px solid #eee',
    borderRadius: '5px',
    boxShadow: '0 5px 10px rgba(20,50,70,.2)',
    marginTop: '20px',
}

export default ExpenseEmail
