# Governance

The WebdriverIO Project wants as much as possible to operate using procedures that are fair, open, inviting, and ultimately good for the community. For that reason, we find it valuable to codify some of the ways that the Project goes about its day-to-day business. We want to make sure that no matter who you are, you have the opportunity to contribute to WebdriverIO. We want to make sure that no corporation can exert undue influence on the community or hold the Project hostage. And likewise, we want to make sure that corporations that benefit from WebdriverIO are also incentivized to give back. This document describes how various types of contributors work within the WebdriverIO project.

## Roles and Responsibilities

### Users

Users are community members who have a need for the project. Anyone can be a User; there are no special requirements. Common User contributions include evangelizing the project (e.g., displaying a link on a website and raising awareness through word-of-mouth), informing developers of strengths and weaknesses from a new user perspective, or providing moral support (a "thank you" goes a long way).

Users who continue to engage with the project and its community will often become more and more involved. Such Users may find themselves becoming Contributors, as described in the next section.

### Contributors

Contributors are community members who contribute in concrete ways to the project, most often in the form of code and/or documentation. Anyone can become a Contributor, and contributions can take many forms. There is no expectation of commitment to the project, no specific skill requirements, and no selection process.

Contributors have read-only access to source code and to submit changes via pull requests. Contributor pull requests have their contribution reviewed and merged by a TSC member. TSC members and Committers work with Contributors to review their code and prepare it for merging.

As Contributors gain experience and familiarity with the project, their profile within, and commitment to, the community will increase. At some stage, they may find themselves being nominated for committer-ship by an existing Committer.

To become a Contributor:

* you have to have at least one pull request proposed, approved and merged or
* you have helped respond to a variety of issues that helped close them

#### Process for Adding Contributors

1. Add the GitHub user to the "Project Contributors" team

### Project Committers

Committers are community members who have shown that they are committed to the continued development of the project through ongoing engagement with the community. Committers are given push access to the project's GitHub repos and must abide by the project's [Contribution Guidelines](/CONTRIBUTING.md).

Committers:

* Are expected to work on public branches of the source repository and submit pull requests from that branch to the `main` branch. Pull requests have to be made as a draft if the work is not ready for a merge or an initial review.
* Proposals for large changes to the project's code (architectural changes, etc...) should be brought forward as a GitHub issue (with the label Proposal), and all committers should be pinged so they can weigh in on the discussion if desired. Substantial changes, whether in the proposal stage or in the pull request stage should be signed off on by 1 TSC member and at least 2 other committers. To assist in the discussion, a small proof of concept can be undertaken on a subset of the WebdriverIO ecosystem and raised as a straw-man PR, to give flesh to the proposal and make discussions more helpfully concrete.
* WebdriverIO has a large ecosystem of repositories. Some are 'core' in the sense of being central sub-packages with a lot of traffic like `webdriverio/webdriverio`. Others are 'peripheral' in the sense of receiving few changes, being maintained by 1 person or no one, etc..., like `webdriverio/jasmine-boilerplate` or `webdriverio/appium-boilerplate`. For 'core' repos, committers should not merge their own code straightaway. Like all contributors, they should open a PR and get a +1 from another committer. For 'peripheral' repos for which they are the sole maintainer or for which they have a good understanding, it is obtuse to insist on another contributor's +1 and this rule should be relaxed in that case. In sum: use good judgment and don't ram code through without a review when you can help it.
* Debates between committers about whether code should be merged should happen in GitHub pull requests.
* In general, any committer can review and merge a PR. Committers should only merge code they are qualified to review, which might entail pinging another committer who has greater ownership over a specific code area.
* Are expected to delete their public branches when they are no longer necessary.
* Must submit pull requests for all changes.
* Have their work reviewed by TSC members before acceptance into the repository.
* May label and close issues
* May merge some pull requests

To become a Committer:

* One must have shown a willingness and ability to participate in the project as a team player. Typically, a potential Committer will need to show that they have an understanding of and alignment with the project, its objectives, and its strategy.
* Committers are expected to be respectful of every community member and to work collaboratively in the spirit of inclusion.
* Have submitted a minimum of 10 qualifying pull requests. What's a qualifying pull request? One that carries significant technical weight and requires little effort to accept because it's well-documented and tested.

New Committers can be nominated by any existing Committer. Once they have been nominated, there will be a vote by the TSC members.

It is important to recognize that a committer-ship is a privilege, not a right. That privilege must be earned and once earned, it can be removed by the TSC members by a standard TSC motion. However, under normal circumstances, a committer-ship exists for as long as the Committer wishes to continue engaging with the project.

A Committer who shows an above-average level of contribution to the project, particularly concerning its strategic direction and long-term health, may be nominated to become a TSC member, as described below.

#### Process for Adding Committers

1. Add the GitHub user to the "Project Committers" team
1. Add person to the list of [Current Project Team Members](/AUTHORS.md)
1. Invite to Discord and assign a user to the role `Project Committers``
1. Tweet congratulations to the new committer from the WebdriverIO Twitter account

### Technical Steering Committee (TSC)

The WebdriverIO project is jointly governed by a Technical Steering Committee (TSC) which is responsible for high-level guidance of the project.

The TSC has final authority over this project including:

* Technical direction
* Project governance and process (including this policy)
* Contribution policy
* GitHub repository hosting

TSC seats are not time-limited. There is no fixed size of the TSC. The TSC should be of such a size as to ensure adequate coverage of important areas of expertise balanced with the ability to make decisions efficiently.

The TSC may add additional members to the TSC by a standard TSC motion.

A TSC member may be removed from the TSC by voluntary resignation, or by a standard TSC motion.

No more than 1/3 of the TSC members may be affiliated with the same employer. If the removal or resignation of a TSC member, or a change of employment by a TSC member, creates a situation where more than 1/3 of the TSC membership shares an employer, then the situation must be immediately remedied by the resignation or removal of one or more TSC members affiliated with the over-represented employer(s).

TSC members have additional responsibilities over and above those of a Committer. These responsibilities ensure the smooth running of the project. TSC members are expected to review code contributions, approve changes to this document, and manage the copyrights within the project outputs.

TSC members fulfill all requirements of Committers, and also:

* May merge external pull requests for accepted issues upon reviewing and approving the changes.
* May merge their pull requests once they have collected the feedback they deem necessary. (No pull request should be merged without at least one Project Committer/TSC member comment stating they've looked at the code.)

To become a TSC member:

* Work in a helpful and collaborative way with the community.
* Have given good feedback on others' submissions and displayed an overall understanding of the code quality standards for the project.
* Commit to being a part of the community for the long term.
* Have submitted a minimum of 30 qualifying pull requests.

A Committer is invited to become a TSC member by existing TSC members. A nomination will result in discussion and then a decision by the TSC.

#### Process for Adding TSC Members

1. Add the GitHub user to the "WebdriverIO TSC" team
1. Set the GitHub user to have the "Owner" role for the WebdriverIO organization
1. Move the person from the list of Project Collaborators into the TSC list in [Current Project Team Members](/AUTHORS.md)
1. Asign Discord user the `Technical Steering Committee` role
1. Add the TSC member as an admin to WebdriverIO Twitter Account
1. Add the TSC member to the NPM organization
1. Tweet congratulations to the new TSC member from the WebdriverIO Twitter account

## Communication Channels

The project maintains various channels for providing information, supporting development and enabling communication between team members. Adherence to the project's [Code of Conduct](/CODE_OF_CONDUCT.md) is strictly mandatory for all types of communication in these channels.

- Twitter Account ([`@webdriverio`](https://twitter.com/webdriverio)): for communicating and promoting news around the project or project-related topics.
- [Discord Support Channel](https://discord.webdriver.io): chat for all WebdriverIO users to seek help and support on problems using the project.
- Project Committers Channel: private channel for members of the Project Committers team to discuss contributions and organize other collaborative efforts.
- TSC Channel: private channel for members of the TSC team to discuss project governance.

## Consensus Seeking Process

The TSC follows a [Consensus-Seeking](https://en.wikipedia.org/wiki/Consensus-seeking_decision-making) decision-making model.

When an agenda item has appeared to reach a consensus, the moderator will ask "Does anyone object?" as a final call for dissent from the consensus.

If an agenda item cannot reach a consensus, a TSC member can call for either a closing vote or a vote to table the issue at the next meeting. The call for a vote must be approved by a majority of the TSC or else the discussion will continue. A simple majority wins.

## Raising Issues Related to Governance

This governance model necessarily leaves many situations unspecified. If questions arise as to how a given situation should proceed according to the overall goals of the project, the best thing to do is to open a GitHub issue and ping the TSC members.

----

This work is a derivative of the [ESLint Project Governance Model](https://github.com/eslint/eslint/blob/main/docs/src/maintainer-guide/governance.md).

This work is licensed under a [Creative Commons Attribution-ShareAlike 2.0 UK: England & Wales License](https://creativecommons.org/licenses/by-sa/2.0/uk/).

## Sponsoring and Donations

The WebdriverIO project offers a variety of [sponsoring tiers](https://webdriver.io/docs/sponsor#tier-benefits) that allow interested companies or individuals to fund the development of the project. Donations to the project can be made through several channels for the convenience of our supporters. These include:

- [Open Collective](https://opencollective.com/webdriverio)
- [GitHub Sponsors](https://github.com/sponsors/webdriverio)
- [Tidelift](https://tidelift.com/subscription/pkg/npm-webdriverio?utm_source=npm-webdriverio&utm_medium=github_sponsor_button)

### Allocation of Funds

We have a structured allocation for the funds we receive:

- __60%__ Project Development
- __20%__ Travel and Event Expenses
- __10%__ Support Systems
- __10%__ Dependencies

#### Project Development

The primary focus of our project funding is channeled into project development, ensuring continuous growth and improvement. By encouraging and accepting expenses for contributions from a broad range of individuals, we aim to expand our pool of long-term contributors. This inclusive approach not only diversifies our funding sources but also fosters a deeper sense of community and ownership among those involved, ultimately contributing to the sustained success and vitality of our project.

Expenses can be submitted by project members (Project Contributors or TSC Members) as well as first-time contributors to the project and everyone in between. Contributions include submitting code, writing documentation, answering questions in our Discord server, and more.

We distribute the funds for project development between Non-Project Members __35%__ and Project Committers and TSC Members __65%__.

##### Expenses from Non-Project Members

Contributors who have made significant and impactful contributions to the project are eligible to submit expenses related to their work. This policy is designed to recognize and support the valuable efforts of our dedicated community members, ensuring they are to some extent compensated for their meaningful contributions to the project's success.

TSC members can trigger [the expense workflow](https://github.com/webdriverio/webdriverio/actions/workflows/expense.yml) with information about the merged PR, submitted by a non-member, that was approved before. A WebdriverIO bot will then send out an email to the PR author with a description of how to claim the funds including a key to authenticate their request. The value chosen by the TSC member is a _rule-of-thumb estimate_ of the complexity and time investment of the contribution.

Once a label is assigned a bot will email the PR author with a token that can be used to verify the author when claiming their expense on OpenCollective. If the author doesn't claim the expense within 30 days, the token will expire and funds will be moved back into the collective.

##### Expenses from Project Committers and TSC Members

Each month, all WebdriverIO Project committers and TSC members can submit an invoice for the number of hours they worked on the project. Anything they do on the project counts, whether that is writing code, writing documentation, triaging issues, participating in our Discord server, attending meetings on behalf of WebdriverIO, contributing to our upstream dependencies, and so on. All contributions to an open-source project are valuable, and we feel like compensating team members for any time they spend on the project is the right thing to do.

Every project committer is responsible for tracking the time they spend directly on the project with information about their activities. At the end of the month, the time sheet needs to be submitted via email to `expenses@webdriver.io`.

The per-hour rate for Technical Steering Committee (TSC) members is $80/hour; the per-hour rate for Committers is $50/hour.

In case all project members have worked on WebdriverIO, and the total time worked exceeds the funding available, the project treasurer will distribute the funds based on the proportion of time each member has contributed. For example, if the total funds are $5000 and _member A_ worked 20% of the total time, _member B_ 30%, _member C_ 25%, and _member D_ 25%, then _member A_ would receive $1000 (20% of $5000), _member B_ $1500 (30% of $5000), _member C_ $1250 (25% of $5000), and _member D_ $1250 (25% of $5000). All members are asked to be honest and respectful to other contributors when keeping track of their work. Every effort that is being tracked needs to be aligned with the project roadmap connected to a release that has been shipped to the user. Unfinished work can't be expensed.

#### Travel and Event Expenses

If you are a member of the _Technical Steering Committee_ team you are eligible to expense flights and hotel accommodations for travel to conferences or meetups as part of a speaking engagement on WebdriverIO, not paid by the event itself or a company. You may expense up to __$1000__. Reimbursement requirements for travel expenses include:

- You must send out a post from your main social media account (e.g. Twitter, LinkedIn or personal blog) thanking all contributors of the collective after the event took place.
- You must use the funds for qualified travel expenses such as ground or air transportation to the event and hotel accommodations.
- You must submit receipts with your reimbursement request.

If you host an event that has a speaker talking about using WebdriverIO and its features you can expense up to $100. Reimbursement requirements for event expenses include:

- You or the event account must share the project on social media (Twitter, Facebook or LinkedIn) at least 3x
- The event page must have the WebdriverIO logo and a link to the project page in your meetup description
- You must use the funds for qualified event expenses such as food, beverage, room or equipment rental.
- You must submit receipts with your reimbursement request.

Our goal with this expense policy is to help the community run events, promote the project and support anyone learning about WebdriverIO. We've already seen project meetups happening in New York and The Netherlands and hope to see more of this in the future.

#### Support Systems

We would like to put some money aside for services and purchases related to the project. Such items can be:

- __Translation Services:__ Funding is available for services that assist in translating project documentation, thereby making our project more accessible to a global audience.
- __Software License Fees:__ We cover the costs of software licenses required by project members for their work on the project. This includes, but is not limited to, licenses for video editing software, Integrated Development Environments (IDEs), and other essential tools.
- __Infrastructure Costs:__ We provide support for essential infrastructure expenses, such as costs incurred for using cloud services like AWS. This ensures the smooth operation and scalability of our project.

#### Dependencies

We use a small amount to help support our project dependencies. We believe that open-source projects who are lucky enough to get funded have a responsibility to help support the smaller projects they rely on. We are working with [thanks.dev](https://thanks.dev/home) to help analyse our dependencies and calculate the amounts we donate back.

The project currently contributes back to the following collectives:

- [Sindre Sorhus](https://opencollective.com/sindresorhus)
- [Lars Kappert](https://github.com/sponsors/webpro)
- [isaacs](https://github.com/sponsors/isaacs)
- [Eslint](https://opencollective.com/eslint)
- [typescript-eslint](https://opencollective.com/typescript-eslint)
- [Vitest](https://opencollective.com/vitest)
- [Mocha](https://opencollective.com/mochajs)
- [Vite](https://opencollective.com/vite)
- [Jest](https://opencollective.com/jest)
- [Husky](https://opencollective.com/husky)
- [Electron](https://opencollective.com/electron)
- [depcheck](https://opencollective.com/depcheck)

### Amendment of Policies
These policies can be amended with a two-thirds majority vote among the TSC members to adapt to the changing needs and structure of our project.

### Donation Refunds
Generally, donations are non-refundable. However, in extraordinary circumstances, exceptions can be considered at the discretion of the project’s governance body.

### Dispute Resolution
Any disputes related to the allocation or use of funds will be addressed by an independent committee, comprising respected members of the open source community.

These policies are established to ensure the effective, transparent, and accountable use of donations, fostering trust within our community and among our donors. Regular reviews and updates of these policies are essential to align them with the evolving dynamics of our project.
