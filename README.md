<p align="center">
    <a href="https://webdriver.io/">
        <img alt="WebdriverIO" src="http://www.christian-bromann.com/wdio.png" width="546">
    </a>
</p>

<p align="center">
    Next-gen WebDriver test automation framework for Node.js
</p>

<p align="center">
    <a href="https://travis-ci.org/webdriverio/webdriverio">
        <img alt="Build Status" src="https://travis-ci.org/webdriverio/webdriverio.svg?branch=master">
    </a>
    <a href="https://codecov.io/gh/webdriverio/webdriverio">
        <img alt="CodeCov" src="https://codecov.io/gh/webdriverio/webdriverio/branch/master/graph/badge.svg">
    </a>
    <a href="https://gitter.im/webdriverio/webdriverio">
        <img alt="Gitter" src="https://badges.gitter.im/webdriverio/webdriverio.svg">
    </a>
</p>

***

<p align="center">
    <a href="https://webdriver.io">Homepage</a> |
    <a href="https://webdriver.io/guide.html">Developer Guide</a> |
    <a href="https://webdriver.io/docs/api.html">API Reference</a> |
    <a href="https://github.com/webdriverio/webdriverio/blob/master/CONTRIBUTING.md">Contribute</a> |
    <a href="https://github.com/webdriverio/webdriverio/blob/master/CHANGELOG.md">Changelog</a> |
    <a href="https://github.com/webdriverio/webdriverio/blob/master/ROADMAP.md">Roadmap</a>
</p>

***

WebdriverIO is a test automation framework that allows you to run tests based on the [Webdriver](https://w3c.github.io/webdriver/webdriver-spec.html) protocol and [Appium](http://appium.io/) automation technology. It provides support for your favorite BDD/TDD test framework and will run your tests locally or in the cloud using Sauce Labs, BrowserStack or TestingBot.

## Contributing

Check out our [CONTRIBUTING.md](CONTRIBUTING.md) to get started with setting up the repo.

If you're looking for issues to help out with, check out [the issues labelled "good first pick"](https://github.com/webdriverio/webdriverio/issues?q=is%3Aopen+is%3Aissue+label%3A"good+first+pick"). You can also reach out in our [Gitter Channel](https://gitter.im/webdriverio/webdriverio) if you have question on where to start contributing.

## Packages

### Core

- [webdriver](https://github.com/webdriverio/webdriverio/tree/master/packages/webdriver) - A Node.js bindings implementation for the W3C WebDriver and Mobile JSONWire Protocol
- [webdriverio](https://github.com/webdriverio/webdriverio/blob/master/packages/webdriverio) - A next-gen WebDriver test automation framework for Node.js
- [@wdio/cli](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-cli) - A WebdriverIO testrunner command line interface

### Helper

- [@wdio/config](https://github.com/webdriverio/webdriverio/blob/master/packages/wdio-config) - A helper utility to parse and validate WebdriverIO options
- [@wdio/logger](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-logger) - A helper utility for logging of WebdriverIO packages
- [@wdio/reporter](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-reporter) - A WebdriverIO utility to help reporting all events
- [@wdio/runner](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-runner) - A WebdriverIO service that runs tests in arbitrary environments
- [@wdio/sync](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-sync) - A WebdriverIO plugin. Helper module to run WebdriverIO commands synchronously
- [@wdio/repl](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-repl) - A WDIO helper utility to provide a repl interface for WebdriverIO
- [@wdio/utils](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-utils) - A WDIO helper utility to provide several utility functions used across the project

### Reporter

- [@wdio/allure-reporter](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-allure-reporter) - A WebdriverIO reporter plugin to create Allure Test Reports
- [@wdio/concise-reporter](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-concise-reporter) - A WebdriverIO reporter plugin to create concise test reports
- [@wdio/dot-reporter](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-dot-reporter) - A WebdriverIO plugin to report in dot style
- [@wdio/spec-reporter](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-spec-reporter) - A WebdriverIO plugin to report in spec style
- [@wdio/sumologic-reporter](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-sumologic-reporter) - A WebdriverIO reporter that sends test results to Sumologic for data analyses
- [@wdio/junit-reporter](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-junit-reporter) - A WebdriverIO reporter that creates test results in XML format

### Services

- [@wdio/appium-service](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-appium-service) - A WebdriverIO service to start & stop Appium Server
- [@wdio/applitools-service](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-applitools-service) - A WebdriverIO service for visual regression testing using Applitools
- [@wdio/devtools-service](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-devtools-service) - A WebdriverIO service that allows you to run Chrome DevTools commands in your tests
- [@wdio/firefox-profile-service](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-firefox-profile-service) - A WebdriverIO service that lets you define your Firefox profile in your wdio.conf.js
- [@wdio/sauce-service](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-sauce-service) - A WebdriverIO service that provides a better integration into SauceLabs
- [@wdio/testingbot-service](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-testingbot-service) - A WebdriverIO service that provides a better integration into TestingBot
- [@wdio/selenium-standalone-service](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-selenium-standalone-service) - A WebdriverIO service that automatically sets up a selenium standalone server
- [@wdio/browserstack-service](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-browserstack-service) - A WebdriverIO service that provides a better integration into Browserstack
- [@wdio/crossbrowsertesting-service](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-crossbrowsertesting-service) - A WebdriverIO service that provides a better integration into CrossBrowserTesting

### Runner

- [@wdio/local-runner](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-local-runner) - A WebdriverIO runner to run tests locally
- [@wdio/lambda-runner](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-lambda-runner) - A WebdriverIO plugin that allows you to run tests on Lambda functions (experimental)

### Framework Adapters

- [@wdio/mocha-framework](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-mocha-framework) - Adapter for [Mocha](https://mochajs.org/) testing framework.
- [@wdio/jasmine-framework](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-jasmine-framework) - Adapter for [Jasmine](https://jasmine.github.io/) testing framework
- [@wdio/cucumber-framework](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-cucumber-framework) - Adapter for [Cucumber](https://cucumber.io/) testing framework

### Others

- [eslint-plugin-wdio](https://github.com/webdriverio/webdriverio/tree/master/packages/eslint-plugin-wdio) - Eslint rules for WebdriverIO
- [@wdio/webdriver-mock-service](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-webdriver-mock-service) - A WebdriverIO service to stub all endpoints for internal testing purposes
- [@wdio/smoke-test-service](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-smoke-test-service) - A WebdriverIO utility to smoke test services for internal testing purposes

## Project Governance

This project is maintained by [awesome people](/AUTHORS.md) following a common [set of rules](/GOVERNANCE.md) and treating each other with [respect and appreciation](/CODE_OF_CONDUCT.md).




     Apache License
                           Version 2.0, January 2004
                        https://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.

      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.

      "Licensor" shall mean the copyright owner or entity authorized by
      the copyright owner that is granting the License.

      "Legal Entity" shall mean the union of the acting entity and all
      other entities that control, are controlled by, or are under common
      control with that entity. For the purposes of this definition,
      "control" means (i) the power, direct or indirect, to cause the
      direction or management of such entity, whether by contract or
      otherwise, or (ii) ownership of fifty percent (50%) or more of the
      outstanding shares, or (iii) beneficial ownership of such entity.

      "You" (or "Your") shall mean an individual or Legal Entity
      exercising permissions granted by this License.

      "Source" form shall mean the preferred form for making modifications,
      including but not limited to software source code, documentation
      source, and configuration files.

      "Object" form shall mean any form resulting from mechanical
      transformation or translation of a Source form, including but
      not limited to compiled object code, generated documentation,
      and conversions to other media types.

      "Work" shall mean the work of authorship, whether in Source or
      Object form, made available under the License, as indicated by a
      copyright notice that is included in or attached to the work
      (an example is provided in the Appendix below).

      "Derivative Works" shall mean any work, whether in Source or Object
      form, that is based on (or derived from) the Work and for which the
      editorial revisions, annotations, elaborations, or other modifications
      represent, as a whole, an original work of authorship. For the purposes
      of this License, Derivative Works shall not include works that remain
      separable from, or merely link (or bind by name) to the interfaces of,
      the Work and Derivative Works thereof.

      "Contribution" shall mean any work of authorship, including
      the original version of the Work and any modifications or additions
      to that Work or Derivative Works thereof, that is intentionally
      submitted to Licensor for inclusion in the Work by the copyright owner
      or by an individual or Legal Entity authorized to submit on behalf of
      the copyright owner. For the purposes of this definition, "submitted"
      means any form of electronic, verbal, or written communication sent
      to the Licensor or its representatives, including but not limited to
      communication on electronic mailing lists, source code control systems,
      and issue tracking systems that are managed by, or on behalf of, the
      Licensor for the purpose of discussing and improving the Work, but
      excluding communication that is conspicuously marked or otherwise
      designated in writing by the copyright owner as "Not a Contribution."

      "Contributor" shall mean Licensor and any individual or Legal Entity
      on behalf of whom a Contribution has been received by Licensor and
      subsequently incorporated within the Work.

   2. Grant of Copyright License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      copyright license to reproduce, prepare Derivative Works of,
      publicly display, publicly perform, sublicense, and distribute the
      Work and such Derivative Works in Source or Object form.

   3. Grant of Patent License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      (except as stated in this section) patent license to make, have made,
      use, offer to sell, sell, import, and otherwise transfer the Work,
      where such license applies only to those patent claims licensable
      by such Contributor that are necessarily infringed by their
      Contribution(s) alone or by combination of their Contribution(s)
      with the Work to which such Contribution(s) was submitted. If You
      institute patent litigation against any entity (including a
      cross-claim or counterclaim in a lawsuit) alleging that the Work
      or a Contribution incorporated within the Work constitutes direct
      or contributory patent infringement, then any patent licenses
      granted to You under this License for that Work shall terminate
      as of the date such litigation is filed.

   4. Redistribution. You may reproduce and distribute copies of the
      Work or Derivative Works thereof in any medium, with or without
      modifications, and in Source or Object form, provided that You
      meet the following conditions:

      (a) You must give any other recipients of the Work or
          Derivative Works a copy of this License; and

      (b) You must cause any modified files to carry prominent notices
          stating that You changed the files; and

      (c) You must retain, in the Source form of any Derivative Works
          that You distribute, all copyright, patent, trademark, and
          attribution notices from the Source form of the Work,
          excluding those notices that do not pertain to any part of
          the Derivative Works; and

      (d) If the Work includes a "NOTICE" text file as part of its
          distribution, then any Derivative Works that You distribute must
          include a readable copy of the attribution notices contained
          within such NOTICE file, excluding those notices that do not
          pertain to any part of the Derivative Works, in at least one
          of the following places: within a NOTICE text file distributed
          as part of the Derivative Works; within the Source form or
          documentation, if provided along with the Derivative Works; or,
          within a display generated by the Derivative Works, if and
          wherever such third-party notices normally appear. The contents
          of the NOTICE file are for informational purposes only and
          do not modify the License. You may add Your own attribution
          notices within Derivative Works that You distribute, alongside
          or as an addendum to the NOTICE text from the Work, provided
          that such additional attribution notices cannot be construed
          as modifying the License.

      You may add Your own copyright statement to Your modifications and
      may provide additional or different license terms and conditions
      for use, reproduction, or distribution of Your modifications, or
      for any such Derivative Works as a whole, provided Your use,
      reproduction, and distribution of the Work otherwise complies with
      the conditions stated in this License.

   5. Submission of Contributions. Unless You explicitly state otherwise,
      any Contribution intentionally submitted for inclusion in the Work
      by You to the Licensor shall be under the terms and conditions of
      this License, without any additional terms or conditions.
      Notwithstanding the above, nothing herein shall supersede or modify
      the terms of any separate license agreement you may have executed
      with Licensor regarding such Contributions.

   6. Trademarks. This License does not grant permission to use the trade
      names, trademarks, service marks, or product names of the Licensor,
      except as required for reasonable and customary use in describing the
      origin of the Work and reproducing the content of the NOTICE file.

   7. Disclaimer of Warranty. Unless required by applicable law or
      agreed to in writing, Licensor provides the Work (and each
      Contributor provides its Contributions) on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
      implied, including, without limitation, any warranties or conditions
      of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
      PARTICULAR PURPOSE. You are solely responsible for determining the
      appropriateness of using or redistributing the Work and assume any
      risks associated with Your exercise of permissions under this License.

   8. Limitation of Liability. In no event and under no legal theory,
      whether in tort (including negligence), contract, or otherwise,
      unless required by applicable law (such as deliberate and grossly
      negligent acts) or agreed to in writing, shall any Contributor be
      liable to You for damages, including any direct, indirect, special,
      incidental, or consequential damages of any character arising as a
      result of this License or out of the use or inability to use the
      Work (including but not limited to damages for loss of goodwill,
      work stoppage, computer failure or malfunction, or any and all
      other commercial damages or losses), even if such Contributor
      has been advised of the possibility of such damages.

   9. Accepting Warranty or Additional Liability. While redistributing
      the Work or Derivative Works thereof, You may choose to offer,
      and charge a fee for, acceptance of support, warranty, indemnity,
      or other liability obligations and/or rights consistent with this
      License. However, in accepting such obligations, You may act only
      on Your own behalf and on Your sole responsibility, not on behalf
      of any other Contributor, and only if You agree to indemnify,
      defend, and hold each Contributor harmless for any liability
      incurred by, or claims asserted against, such Contributor by reason
      of your accepting any such warranty or additional liability.

   END OF TERMS AND CONDITIONS

   APPENDIX: How to apply the Apache License to your work.

      To apply the Apache License to your work, attach the following
      boilerplate notice, with the fields enclosed by brackets "[]"
      replaced with your own identifying information. (Don't include
      the brackets!)  The text should be enclosed in the appropriate
      comment syntax for the file format. We also recommend that a
      file or class name and description of purpose be included on the
      same "printed page" as the copyright notice for easier
      identification within third-party archives.

   Copyright 2019 Rolando Gopez Lacuata.

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       https://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
