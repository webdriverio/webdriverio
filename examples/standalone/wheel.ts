import { remote } from 'webdriverio'

/**
 * This example demonstrates how to use the wheel action to scroll a scrollable div
 *
 * The wheel action provides fine-grained control over scrolling behavior,
 * including the ability to scroll specific elements with custom durations.
 */

/**
 * Initiate browser
 * As we use this script in our dev environments which has no
 * browser driver nor xfvb set up we have to make sure to set
 * the headless flag for running with devtools
 */
const browser = await remote({
    logLevel: 'error',
    capabilities: {
        browserName: 'chrome',
    } as any
})

try {
    /**
     * Create a test page with a scrollable div
     */
    const testPage = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    margin: 20px;
                    font-family: Arial, sans-serif;
                }
                #scrollable-div {
                    width: 500px;
                    height: 300px;
                    overflow: auto;
                    border: 2px solid #333;
                    padding: 20px;
                    background-color: #f0f0f0;
                }
                .content {
                    height: 1000px;
                    background: linear-gradient(to bottom, #ffffff, #cccccc);
                }
                .marker {
                    padding: 10px;
                    margin: 10px 0;
                    background-color: #4CAF50;
                    color: white;
                    text-align: center;
                    border-radius: 5px;
                }
            </style>
        </head>
        <body>
            <h1>Wheel Action Example</h1>
            <p>Scroll position: <span id="scroll-pos">0</span>px</p>
            <div id="scrollable-div">
                <div class="content">
                    <div class="marker">Start of scrollable content</div>
                    <div class="marker" style="margin-top: 200px;">Section 1</div>
                    <div class="marker" style="margin-top: 200px;">Section 2</div>
                    <div class="marker" style="margin-top: 200px;">Section 3</div>
                    <div class="marker" style="margin-top: 100px;">End of scrollable content</div>
                </div>
            </div>
            <script>
                const div = document.getElementById('scrollable-div');
                const scrollPos = document.getElementById('scroll-pos');
                div.addEventListener('scroll', () => {
                    scrollPos.textContent = Math.round(div.scrollTop);
                });
            </script>
        </body>
        </html>
    `

    // Navigate to the test page using a data URL
    await browser.url(`data:text/html;charset=utf-8,${encodeURIComponent(testPage)}`)
    console.log('✓ Navigated to test page')

    // Get the scrollable div element
    const scrollableDiv = await browser.$('#scrollable-div')

    // Check initial scroll position
    const initialScroll = await browser.execute((el) => {
        return (el as HTMLElement).scrollTop
    }, scrollableDiv)
    console.log(`Initial scroll position: ${initialScroll}px`)

    // Example 1: Scroll down within the div using wheel action
    console.log('\n--- Example 1: Basic scroll down ---')
    await browser.action('wheel')
        .scroll({
            x: 0,
            y: 0,
            deltaX: 0,
            deltaY: 200,  // Scroll down 200px
            origin: scrollableDiv,
            duration: 100
        })
        .perform()

    await browser.pause(500) // Wait for scroll to complete

    let currentScroll = await browser.execute((el) => {
        return (el as HTMLElement).scrollTop
    }, scrollableDiv)
    console.log(`After scrolling down 200px: ${currentScroll}px`)

    // Example 2: Scroll further down with a longer duration
    console.log('\n--- Example 2: Smooth scroll down ---')
    await browser.action('wheel')
        .scroll({
            x: 0,
            y: 0,
            deltaX: 0,
            deltaY: 300,  // Scroll down another 300px
            origin: scrollableDiv,
            duration: 500  // Slower, smoother scroll
        })
        .perform()

    await browser.pause(600)

    currentScroll = await browser.execute((el) => {
        return (el as HTMLElement).scrollTop
    }, scrollableDiv)
    console.log(`After scrolling down 300px more: ${currentScroll}px`)

    // Example 3: Scroll back up
    console.log('\n--- Example 3: Scroll up ---')
    await browser.action('wheel')
        .scroll({
            x: 0,
            y: 0,
            deltaX: 0,
            deltaY: -250,  // Negative value scrolls up
            origin: scrollableDiv,
            duration: 200
        })
        .perform()

    await browser.pause(300)

    currentScroll = await browser.execute((el) => {
        return (el as HTMLElement).scrollTop
    }, scrollableDiv)
    console.log(`After scrolling up 250px: ${currentScroll}px`)

    // Example 4: Chain multiple scroll actions
    console.log('\n--- Example 4: Chain multiple scrolls ---')
    await browser.action('wheel')
        .scroll({
            deltaX: 0,
            deltaY: 100,
            origin: scrollableDiv,
            duration: 100
        })
        .scroll({
            deltaX: 0,
            deltaY: 100,
            origin: scrollableDiv,
            duration: 100
        })
        .scroll({
            deltaX: 0,
            deltaY: 100,
            origin: scrollableDiv,
            duration: 100
        })
        .perform()

    await browser.pause(500)

    currentScroll = await browser.execute((el) => {
        return (el as HTMLElement).scrollTop
    }, scrollableDiv)
    console.log(`After chained scrolls (3 × 100px): ${currentScroll}px`)

    console.log('\n✓ All wheel action examples completed successfully!')

    /**
     * Tear down session
     */
    await browser.deleteSession()
} catch (err) {
    console.log(`Something went wrong: ${err.stack}`)
    await browser.deleteSession()
}
