---
id: mock
title: The Mock Object
---

The mock object is an object that represents a network mock and contains information about requests that were matching given `url` and `filterOptions`. It can be received using the [`mock`](/docs/api/browser/mock) command.

:::info

Note that using the `mock` command requires support for Chrome DevTools protocol.
That support is given if you run tests locally in Chromium based browser or if
you use a Selenium Grid v4 or higher. This command can __not__ be used when running
automated tests in the cloud. Find out more in the [Automation Protocols](/docs/automationProtocols) section.

:::

You can read more about mocking requests and responses in WebdriverIO in our [Mocks and Spies](/docs/mocksandspies) guide.

## Properties

A mock object contains the following properties:

| Name | Type | Details |
| ---- | ---- | ------- |
| `url` | `String` | The url passed into the mock command |
| `filterOptions` | `Object` | The resource filter options passed into the mock command |
| `browser` | `Object` | The [Browser Object](/docs/api/browser) used to get the mock object. |
| `matches` | `Object[]` | Information about matching browser requests, containing properties such as `url`, `method`, `headers`, `initialPriority`, `referrerPolic`, `statusCode`, `responseHeaders` and `body` |

## Methods

Mock objects provide various commands, listed in the `mock` section, that allow users to modify the behavior of the request or response.

- [`abort`](/docs/api/mock/abort)
- [`abortOnce`](/docs/api/mock/abortOnce)
- [`clear`](/docs/api/mock/clear)
- [`respond`](/docs/api/mock/respond)
- [`respondOnce`](/docs/api/mock/respondOnce)
- [`restore`](/docs/api/mock/restore)
