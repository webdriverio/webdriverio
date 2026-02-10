import { expect } from '@wdio/globals'

describe('webdriver.io page', () => {
    it('should be a pending test')
    it('Thrown error should not end test-runner', async () => {
        const foo = {}
        console.log(foo.bar.boo) // This will throw an error.
    })

    it('Failed POST request should not end test-runner', async () => {
        try {
            const response = await fetch('https://nonexistent.com/api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ foo: 'bar' })
            })
            const result = await response.json()
            console.log('RESULT:', result)

        } catch (err) {
            console.error('ERROR:', err)
            // Proceed anyway
        }
    })
    it('next test', async () => {
        // Just wait
        await new Promise((resolve) => setTimeout(resolve, 3000))
    })
    it('should have the right title', async () => {
        // Navigate to the URL
        window.location.href = 'https://webdriver.io'

        // Wait for the page to load
        await new Promise((resolve) => {
            const checkReadyState = () => {
                if (document.readyState === 'complete') {
                    resolve(null) // Resolve the promise when readyState is complete
                } else {
                    setTimeout(checkReadyState, 100) // Retry after 100ms
                }
            }
            checkReadyState() // Start the polling loop
        })

        // Check the title
        const title = document.title
        expect(title).toBe('WebdriverIO Browser Test')
    })
})
