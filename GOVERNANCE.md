# Governance

The WebdriverIO Project wants as much as possible to operate using procedures that are fair, open, inviting, and ultimately good for the community. For that reason we find it valuable to codify some of the ways that the Project goes about its day-to-day business. We want to make sure that no matter who you are, you have the opportunity to contribute to WebdriverIO. We want to make sure that no corporation can exert undue influence on the community or hold the Project hostage. And likewise we want to make sure that corporations which benefit from WebdriverIO are also incentivized to give back. This document describes how various types of contributors work within the WebdriverIO project.

## Roles and Responsibilities

### Users

Users are community members who have a need for the project. Anyone can be a User; there are no special requirements. Common User contributions include evangelizing the project (e.g., display a link on a website and raise awareness through word-of-mouth), informing developers of strengths and weaknesses from a new user perspective, or providing moral support (a "thank you" goes a long way).

Users who continue to engage with the project and its community will often become more and more involved. Such Users may find themselves becoming Contributors, as described in the next section.

### Contributors

Contributors are community members who contribute in concrete ways to the project, most often in the form of code and/or documentation. Anyone can become a Contributor, and contributions can take many forms. There is no expectation of commitment to the project, no specific skill requirements, and no selection process.

Contributors have read-only access to source code and to submit changes via pull requests. Contributor pull requests have their contribution reviewed and merged by a TSC member. TSC members and Committers work with Contributors to review their code and prepare it for merging.

As Contributors gain experience and familiarity with the project, their profile within, and commitment to, the community will increase. At some stage, they may find themselves being nominated for committership by an existing Committer.

To become a Contributor:

* you have to have at least one pull request proposed, approved and merged or
* you have helped responding to a variety of issues that help close them

#### Process for Adding Contributors

1. Add the GitHub user to the "Project Contributors" team

### Project Committers

Committers are community members who have shown that they are committed to the continued development of the project through ongoing engagement with the community. Committers are given push access to the project's GitHub repos and must abide by the project's [Contribution Guidelines](/CONTRIBUTING.md).

Committers:

* Are expected to work on public branches of the source repository and submit pull requests from that branch to the `main` branch. Pull requests have to be made as a draft if the work is not ready for a merge or an initial review.
* Proposals for large changes to the project's code (architectural changes, etc...) should be brought forward as a GitHub issue (with the label Proposal), and all committers should be pinged so they can weigh in on the discussion if desired. Substantial changes, whether in proposal stage or in pull request stage should be signed off on by 1 TSC member and at least 2 other committers. To assist in the discussion, a small proof of concept can be undertaken on a subset of the WebdriverIO ecosystem and raised as a strawman PR, to give flesh to the proposal and make discussion more helpfully concrete.
* WebdriverIO has a large ecosystem of repositories. Some are 'core' in the sense of being central subpackages with a lot of traffic like `webdriverio/webdriverio`. Others are 'peripheral' in the sense of receiving few changes, being maintained by 1 person or no one, etc..., like `webdriverio/jasmine-boilerplate` or `webdriverio/appium-boilerplate`. For 'core' repos, committers should not merge their own code straightaway. Like all contributors they should open a PR and get a +1 from another committer. For 'peripheral' repos for which they are the sole maintainer or for which they have a good understanding, it is obtuse to insist on another contributor's +1 and this rule should be relaxed in that case. In sum: use good judgment and don't ram code through without a review when you can help it.
* Debates between committers about whether code should be merged should happen in GitHub pull requests.
* In general any committer can review and merge a PR. In general committers should only merge code they are qualified to review, which might entail pinging another committer who has greater ownership over a specific code area.
* Are expected to delete their public branches when they are no longer necessary.
* Must submit pull requests for all changes.
* Have their work reviewed by TSC members before acceptance into the repository.
* May label and close issues
* May merge some pull requests

To become a Committer:

* One must have shown a willingness and ability to participate in the project as a team player. Typically, a potential Committer will need to show that they have an understanding of and alignment with the project, its objectives, and its strategy.
* Committers are expected to be respectful of every community member and to work collaboratively in the spirit of inclusion.
* Have submitted a minimum of 10 qualifying pull requests. What's a qualifying pull request? One that carries significant technical weight and requires little effort to accept because it's well documented and tested.

New Committers can be nominated by any existing Committer. Once they have been nominated, there will be a vote by the TSC members.

It is important to recognize that committership is a privilege, not a right. That privilege must be earned and once earned, it can be removed by the TSC members by a standard TSC motion. However, under normal circumstances committership exists for as long as the Committer wishes to continue engaging with the project.

A Committer who shows an above-average level of contribution to the project, particularly with respect to its strategic direction and long-term health, may be nominated to become a TSC member, described below.

#### Process for Adding Committers

1. Add the GitHub user to the "Project Committers" team
1. Add person to the list of [Current Project Team Members](/AUTHORS.md)
1. Invite to Matrix team chatroom (`webdriverio/ProjectCommitters`)
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

No more than 1/3 of the TSC members may be affiliated with the same employer. If removal or resignation of a TSC member, or a change of employment by a TSC member, creates a situation where more than 1/3 of the TSC membership shares an employer, then the situation must be immediately remedied by the resignation or removal of one or more TSC members affiliated with the over-represented employer(s).

TSC members have additional responsibilities over and above those of a Committer. These responsibilities ensure the smooth running of the project. TSC members are expected to review code contributions, approve changes to this document, and manage the copyrights within the project outputs.

TSC members fulfill all requirements of Committers, and also:

* May merge external pull requests for accepted issues upon reviewing and approving the changes.
* May merge their own pull requests once they have collected the feedback they deem necessary. (No pull request should be merged without at least one Project Committer/TSC member comment stating they've looked at the code.)

To become a TSC member:

* Work in a helpful and collaborative way with the community.
* Have given good feedback on others' submissions and displayed an overall understanding of the code quality standards for the project.
* Commit to being a part of the community for the long-term.
* Have submitted a minimum of 20 qualifying pull requests.

A Committer is invited to become a TSC member by existing TSC members. A nomination will result in discussion and then a decision by the TSC.

#### Process for Adding TSC Members

1. Add the GitHub user to the "WebdriverIO TSC" team
1. Set the GitHub user to have the "Owner" role for the WebdriverIO organization
1. Move person from the list of Project Collaborators into the TSC list in [Current Project Team Members](/AUTHORS.md)
1. Invite to the Matrix TSC chatroom (`webdriverio/TSC`)
1. Add the TSC member as an admin to WebdriverIO Twitter Account
1. Add the TSC member to the NPM organization
1. Tweet congratulations to the new TSC member from the WebdriverIO Twitter account

## Communication Channels

The project maintains various channels for providing information, supporting development and enabling communication between team members. Adherence to the project's [Code of Conduct](/CODE_OF_CONDUCT.md) is strictly mandatory for all types of communication in these channels.

- Twitter Account ([`@webdriverio`](https://twitter.com/webdriverio)): for communicating and promoting news around the project or project related topics.
- [Matrix Support Channel](https://matrix.to/#/#webdriver.io:gitter.im): chat for all WebdriverIO users to seek help and support on problems using the project.
- Project Committers Channel (`#webdriverio/projectcommitters:gitter.im`): private channel for members of the Project Committers team to discuss contributions and organize other collaborative efforts.
- TSC Channel (`#webdriverio/tsc:gitter.im`): private channel for members of the TSC team to discuss project governance.

## Consensus Seeking Process

The TSC follows a [Consensus Seeking](https://en.wikipedia.org/wiki/Consensus-seeking_decision-making) decision making model.

When an agenda item has appeared to reach a consensus, the moderator will ask "Does anyone object?" as a final call for dissent from the consensus.

If an agenda item cannot reach a consensus, a TSC member can call for either a closing vote or a vote to table the issue to the next meeting. The call for a vote must be approved by a majority of the TSC or else the discussion will continue. Simple majority wins.

## Raising Issues Related to Governance

This governance model necessarily leaves many situations unspecified. If questions arise as to how a given situation should proceed according to the overall goals of the project, the best thing to do is to open a GitHub issue and ping the TSC members.

----

This work is a derivative of the [ESLint Project Governance Model](https://github.com/eslint/eslint/blob/main/docs/src/maintainer-guide/governance.md).

This work is licensed under a [Creative Commons Attribution-ShareAlike 2.0 UK: England & Wales License](https://creativecommons.org/licenses/by-sa/2.0/uk/).
