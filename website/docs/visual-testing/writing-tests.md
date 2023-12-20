---
id: writing-tests
title: Writing Tests
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## Testrunner Framework Support

_wdio-image-comparison-service_ is test-runner framework agnostic, which means that you can use it with all the frameworks WebdriverIO supports like

-   [`Mocha`](https://webdriver.io/docs/frameworks#using-mocha)
-   [`Jasmine`](https://webdriver.io/docs/frameworks#using-jasmine)
-   [`CucumberJS`](https://webdriver.io/docs/frameworks#using-cucumber)

:::note IMPORTANT
This service provides `save` and `check` methods. If you run your tests for the first time you **SHOULD NOT** combine `save` and `compare` methods, the `check`-methods will automatically reject your promise if there is no baseline image with the following warning.

```sh
#####################################################################################
 Baseline image not found, save the actual image manually to the baseline.
 The image can be found here:
 /Users/wswebcreation/sample/.tmp/actual/desktop_chrome/examplePage-chrome-latest-1366x768.png
 If you want the module to auto save a non existing image to the baseline you
 can provide 'autoSaveBaseline: true' to the options.
#####################################################################################

```

This means that the current screenshot is saved in the actual folder and you **manually need to copy it to your baseline**.
If you instantiate `wdio-image-comparison-service` with [`autoSaveBaseline: true`](./service-options#autosavebaseline) the image will automatically be saved into the baseline folder.

:::

<Tabs
defaultValue="mocha"
values={[
{label: 'Mocha', value: 'mocha'},
{label: 'Jasmine', value: 'jasmine'},
{label: 'CucumberJS', value: 'cucumberjs'},
]
}>
<TabItem value="mocha">

```ts
describe("Mocha Example", () => {
    beforeEach(async () => {
        await browser.url("https://webdriver.io");
    });

    it("should save some screenshots", async () => {
        // Save a screen
        await browser.saveScreen("examplePaged", {
            /* some options */
        });

        // Save an element
        await browser.saveElement(
            await $("#element-id"),
            "firstButtonElement",
            {
                /* some options */
            }
        );

        // Save a full page screenshot
        await browser.saveFullPageScreen("fullPage", {
            /* some options */
        });

        // Save a full page screenshot with all tab executions
        await browser.saveTabbablePage("save-tabbable", {
            /* some options, use the same options as for saveFullPageScreen */
        });
    });

    it("should compare successful with a baseline", async () => {
        // Check a screen
        await expect(
            await browser.checkScreen("examplePaged", {
                /* some options */
            })
        ).toEqual(0);

        // Check an element
        await expect(
            await browser.checkElement(
                await $("#element-id"),
                "firstButtonElement",
                {
                    /* some options */
                }
            )
        ).toEqual(0);

        // Check a full page screenshot
        await expect(
            await browser.checkFullPageScreen("fullPage", {
                /* some options */
            })
        ).toEqual(0);

        // Check a full page screenshot with all tab executions
        await expect(
            await browser.checkTabbablePage("check-tabbable", {
                /* some options, use the same options as for checkFullPageScreen */
            })
        ).toEqual(0);
    });
});
```

</TabItem>
<TabItem value="jasmine">

```ts
describe("Jasmine Example", () => {
    beforeEach(async () => {
        await browser.url("https://webdriver.io");
    });

    it("should save some screenshots", async () => {
        // Save a screen
        await browser.saveScreen("examplePaged", {
            /* some options */
        });

        // Save an element
        await browser.saveElement(
            await $("#element-id"),
            "firstButtonElement",
            {
                /* some options */
            }
        );

        // Save a full page screenshot
        await browser.saveFullPageScreen("fullPage", {
            /* some options */
        });

        // Save a full page screenshot with all tab executions
        await browser.saveTabbablePage("save-tabbable", {
            /* some options, use the same options as for saveFullPageScreen */
        });
    });

    it("should compare successful with a baseline", async () => {
        // Check a screen
        await expect(
            await browser.checkScreen("examplePaged", {
                /* some options */
            })
        ).toEqual(0);

        // Check an element
        await expect(
            await browser.checkElement(
                await $("#element-id"),
                "firstButtonElement",
                {
                    /* some options */
                }
            )
        ).toEqual(0);

        // Check a full page screenshot
        await expect(
            await browser.checkFullPageScreen("fullPage", {
                /* some options */
            })
        ).toEqual(0);

        // Check a full page screenshot with all tab executions
        await expect(
            await browser.checkTabbablePage("check-tabbable", {
                /* some options, use the same options as for checkFullPageScreen */
            })
        ).toEqual(0);
    });
});
```

</TabItem>
<TabItem value="cucumberjs">

```ts
import { When, Then } from "@wdio/cucumber-framework";

When("I save some screenshots", async function () {
    // Save a screen
    await browser.saveScreen("examplePaged", {
        /* some options */
    });

    // Save an element
    await browser.saveElement(await $("#element-id"), "firstButtonElement", {
        /* some options */
    });

    // Save a full page screenshot
    await browser.saveFullPageScreen("fullPage", {
        /* some options */
    });

    // Save a full page screenshot with all tab executions
    await browser.saveTabbablePage("save-tabbable", {
        /* some options, use the same options as for saveFullPageScreen */
    });
});

Then(
    "I should be able to compare some screenshots with a baseline",
    async function () {
        // Check a screen
        await expect(
            await browser.checkScreen("examplePaged", {
                /* some options */
            })
        ).toEqual(0);

        // Check an element
        await expect(
            await browser.checkElement(
                await $("#element-id"),
                "firstButtonElement",
                {
                    /* some options */
                }
            )
        ).toEqual(0);

        // Check a full page screenshot
        await expect(
            await browser.checkFullPageScreen("fullPage", {
                /* some options */
            })
        ).toEqual(0);

        // Check a full page screenshot with all tab executions
        await expect(
            await browser.checkTabbablePage("check-tabbable", {
                /* some options, use the same options as for checkFullPageScreen */
            })
        ).toEqual(0);
    }
);
```

</TabItem>
</Tabs>
