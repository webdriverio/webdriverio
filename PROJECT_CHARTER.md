# WebdriverIO Charter

## Section 0: Guiding Principles

The WebdriverIO project is part of the OpenJS Foundation which operates transparently, openly, collaboratively, and ethically. Project proposals, timelines, and status must not merely be open, but also easily visible to outsiders.

## Section 1: Scope

The project tries to provide users a variety of building blocks to create a highly customizable, maintainable and scalable framework to build and run end-to-end (e2e) tests for web and mobile applications. While it is focused on running these tests in accordance with the [WebDriver](https://w3c.github.io/webdriver/) standard, it also leverages other interfaces to provide as much control of the automated user agent as possible.

With that, the project offers not only the ability of automating user agents using open standards, it also enforces a common set of good practices that help to avoid pitfalls. These practices, along with solutions provided by the WebdriverIO community, serve to resolve well-defined problem spaces in dynamic and complex world of e2e testing.

### 1.1: In-scope

- automation of modern web browsers
- automation of mobile devices (web as well as native applications)
- testing applications from end-to-end at scale (including parallelisation and reporting)
- integration into 3rd party services and vendors (e.g. [Sauce Labs](https://saucelabs.com/) or [BrowserStack](https://browserstack.com/))
- support of functional as well as non functional testing aspects (e.g. visual regression or frontend performance testing)
- automated debugging in the browser (e.g. using the [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/))
- scraping of websites
- providing technical content and best practices in form of [boilerplates](https://webdriver.io/) and [blog posts](https://webdriver.io/blog/)
- providing technical help in form of a [community channel](https://matrix.to/#/#webdriver.io:gitter.im)

### 1.2: Out-of-Scope

- API testing
- Load testing

## Section 2: Relationship with the OpenJS Foundation CPC

Most large, complex open source communities have both a business and a technical governance model. Technical leadership for the projects within the OpenJS Foundation is delegated to the projects through their project charters by the OpenJS Cross Project Council (“CPC”). In the case of the WebdriverIO project, it is delegated to the WebdriverIO Technical Steering Committee (“TSC”). The OpenJS Foundation’s business leadership is the Board of Directors (the “Board”).

This Technical Steering Committee Charter reflects a carefully constructed and balanced role for the TSC and the CPC in the governance of the OpenJS Foundation. The charter amendment process is for the TSC to propose changes using simple majority of the full TSC, the proposed changes being subject to review and approval by the CPC. The CPC may additionally make amendments to the TSC charter at any time, though the CPC will not interfere with day-to-day discussions, votes or meetings of the TSC.

### 2.1 Other Formal Project Relationships

Given this project's dependency on the WebDriver specification, the members of this project work together with the [W3C](https://www.w3.org/) and its working groups, e.g. [Browser Testing and Tools Working Group](https://www.w3.org/testing/browser/).

## Section 3: WebdriverIO Governing Body

See also [GOVERNANCE.md](/GOVERNANCE.md).

## Section 4: Roles & Responsibilities

See also [GOVERNANCE.md](/GOVERNANCE.md).

### Section 4.1 Project Operations & Management

The TSC will establish and maintain a development process for the WebdriverIO project. The development process will establish guidelines for how the developers and community will operate.

The TSC and entire technical community will follow any processes as may be specified by the OpenJS Foundation Board relating to the intake and license compliance review of contributions, including the OpenJS Foundation IP Policy.

### Section 4.2: Decision-making, Voting, and/or Elections

Leadership roles in the WebdriverIO project will be peer elected representatives of the community. For more see [GOVERNANCE.md](/GOVERNANCE.md).

### Section 4.3: Other Project Roles

The WebdriverIO git repository is maintained by the TSC and additional Collaborators who are added by the TSC on an ongoing basis.

Individuals making significant and valuable contributions, “Contributor(s)”, are made Collaborators and given commit-access to the project. These individuals are identified by the TSC and their addition as Collaborators is discussed in the TSC Matrix channel. Modifications of the contents of the git repository are made on a collaborative basis as defined in the development process.

Collaborators may opt to elevate significant or controversial modifications, or modifications that have not found consensus to the TSC for discussion. The TSC should serve as the final arbiter where required. The TSC will maintain and publish a list of current Collaborators, as well as a development process guide for Collaborators and Contributors looking to participate in the development effort.

## Section 5: Definitions

Definitions on `Collaborators` and `TSC` can be found in the [Governance](/GOVERNANCE.md) document.

* **Contributors**: contribute code or other artifacts, but do not have the right to commit to the code base. Contributors work with the project’s Collaborators to have code committed to the code base. A Contributor may be promoted to a Collaborator by the TSC. Contributors should rarely be encumbered by the TSC and never by the CPC or OpenJS Foundation Board.
* **Project**: a technical collaboration effort, e.g. a subsystem, that is organized through the project creation process and approved by the TSC.
