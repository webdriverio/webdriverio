[![Stand With Ukraine](https://raw.githubusercontent.com/vshymanskyy/StandWithUkraine/main/banner2-direct.svg)](https://vshymanskyy.github.io/StandWithUkraine)

<p align="center">
    <a href="https://webdriver.io/">
        <img alt="WebdriverIO" src="https://webdriver.io/assets/images/robot-3677788dd63849c56aa5cb3f332b12d5.svg" width="146">
    </a>
</p>

<p align="center">
    Next-gen browser and mobile automation test framework for Node.js.
</p>

<p align="center">
    <a href="https://github.com/webdriverio/webdriverio/actions/workflows/test.yml">
        <img alt="Build Status" src="https://github.com/webdriverio/webdriverio/actions/workflows/test.yml/badge.svg">
    </a>
    <a href="https://snyk.io/advisor/npm-package/webdriverio">
        <img alt="Package Health" src="https://snyk.io/advisor/npm-package/webdriverio/badge.svg">
    </a>
    <a href="https://bestpractices.coreinfrastructure.org/en/projects/5589">
        <img alt="OpenSSF Best Practices" src="https://bestpractices.coreinfrastructure.org/projects/5589/badge">
    </a>
    <br />
    <a href="https://discord.webdriver.io">
        <img alt="Support Channel" src="https://img.shields.io/discord/1097401827202445382?color=%234FB898&label=Join%20us%20on%20Discord">
    </a>
    <a href="https://github.com/webdriverio/webdriverio/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc">
        <img alt="Issue Resolution time" src="https://isitmaintained.com/badge/resolution/webdriverio/webdriverio.svg">
    </a>
    <a href="https://github.com/webdriverio/webdriverio/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc">
        <img alt="Open issues" src="https://isitmaintained.com/badge/open/webdriverio/webdriverio.svg">
    </a>
</p>

***

<p align="center">
    <a href="https://webdriver.io">Homepage</a> |
    <a href="https://webdriver.io/docs/gettingstarted.html">Developer Guide</a> |
    <a href="https://webdriver.io/docs/api.html">API Reference</a> |
    <a href="https://github.com/webdriverio/webdriverio/blob/main/CONTRIBUTING.md">Contribute</a> |
    <a href="https://github.com/webdriverio/webdriverio/blob/main/CHANGELOG.md">Changelog</a> |
    <a href="https://github.com/webdriverio/webdriverio/blob/main/ROADMAP.md">Roadmap</a>
</p>

***

WebdriverIO is a test automation framework, for e2e as well as unit and component testing in the browser, that allows you to run tests based on the [WebDriver](https://w3c.github.io/webdriver/webdriver-spec.html) and [WebDriver BiDi](https://github.com/w3c/webdriver-bidi) as well as [Appium](https://appium.io/) automation technology. It provides support for your favorite BDD/TDD test framework and will run your tests locally or in the cloud using Sauce Labs, BrowserStack, TestingBot or TestMu AI (Formerly LambdaTest).

## :woman_technologist: :man_technologist: Contributing

Do you like WebdriverIO and want to help make it better? Awesome! Have a look into our [Contributor Documentation](CONTRIBUTING.md) to get started and find out what contributions can be and how to make them.

### Getting started with GitHub Codespaces

To get started, create a codespace for this repository by clicking this 👇

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://github.com/codespaces/new?hide_repo_select=true&ref=main&repo=2296970)

A codespace will open in a web-based version of Visual Studio Code. The [dev container](.devcontainer/devcontainer.json) is fully configured with the software needed for this project.

**Note**: Dev containers are an open spec that is supported by [GitHub Codespaces](https://github.com/codespaces) and [other tools](https://containers.dev/supporting).

### Getting started with Gitpod

You can also just click on:

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/webdriverio/webdriverio)

to get a ready-to-use development environment for you to start working on this code base.

If you're looking for issues to help out with, check out [the issues labeled "good first pick"](https://github.com/webdriverio/webdriverio/issues?q=is%3Aopen+is%3Aissue+label%3A"good+first+pick"). You can also reach out to our [Matrix Channel](https://discord.webdriver.io) if you have questions on where to start contributing.

## :office: WebdriverIO for Enterprise

Available as part of the Tidelift Subscription.

The maintainers of WebdriverIO and thousands of other packages are working with Tidelift to deliver commercial support and maintenance for the open-source dependencies you use to build your applications. Save time, reduce risk, and improve code health, while paying the maintainers of the exact dependencies you use. [Learn more.](https://tidelift.com/subscription/pkg/npm-webdriverio?utm_source=npm-webdriverio&utm_medium=referral&utm_campaign=enterprise&utm_term=repo)

## :package: Packages

This repository contains some of the core packages of the WebdriverIO project. There are many wonderful [curated resources](https://github.com/webdriverio-community/awesome-webdriverio) the WebdriverIO community has put together.

**Did you build a WebdriverIO service or reporter?** That's awesome! Please add it to our configuration wizard and docs (e.g. like in [this example commit](https://github.com/webdriverio/webdriverio/commit/3cb5937b968dfe93cf78871589019736a6c98d9e)) as well as to our [awesome-webdriverio](https://github.com/webdriverio-community/awesome-webdriverio) list. Thank you! 🙏 ❤️

### Core

- [webdriver](https://github.com/webdriverio/webdriverio/tree/main/packages/webdriver) - A Node.js bindings implementation for the W3C WebDriver and Mobile JSONWire Protocol
- [webdriverio](https://github.com/webdriverio/webdriverio/blob/main/packages/webdriverio) - Next-gen browser and mobile automation test framework for Node.js
- [@wdio/cli](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-cli) - A WebdriverIO testrunner command line interface

### Helper

- [@wdio/config](https://github.com/webdriverio/webdriverio/blob/main/packages/wdio-config) - A helper utility to parse and validate WebdriverIO options
- [@wdio/logger](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-logger) - A helper utility for logging WebdriverIO packages
- [@wdio/protocols](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-protocols) - Utility package providing information about automation protocols
- [@wdio/repl](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-repl) - A WDIO helper utility to provide a repl interface for WebdriverIO
- [@wdio/reporter](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-reporter) - A WebdriverIO utility to help report all events
- [@wdio/runner](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-runner) - A WebdriverIO service that runs tests in arbitrary environments
- [@wdio/utils](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-utils) - A WDIO helper utility to provide several utility functions used across the project
- [@wdio/globals](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-globals) - A WDIO helper utility for importing global variables directly

### Reporter

- [@wdio/allure-reporter](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-allure-reporter) - A WebdriverIO reporter plugin to create Allure Test Reports
- [@wdio/concise-reporter](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-concise-reporter) - A WebdriverIO reporter plugin to create concise test reports
- [@wdio/dot-reporter](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-dot-reporter) - A WebdriverIO plugin to report in dot style
- [@wdio/junit-reporter](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-junit-reporter) - A WebdriverIO reporter that creates test results in XML format
- [@wdio/spec-reporter](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-spec-reporter) - A WebdriverIO plugin to report in spec style
- [@wdio/sumologic-reporter](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-sumologic-reporter) - A WebdriverIO reporter that sends test results to Sumologic for data analyses

### Services

- [@wdio/appium-service](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-appium-service) - A WebdriverIO service to start & stop Appium Server
- [@wdio/lighthouse-service](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-lighthouse-service) - A WebdriverIO service that integrates Google Lighthouse commands to use it for automate tests
- [@wdio/firefox-profile-service](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-firefox-profile-service) - A WebdriverIO service that lets you define your Firefox profile in your wdio.conf.js
- [@wdio/sauce-service](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-sauce-service) - A WebdriverIO service that provides a better integration into Sauce Labs
- [@wdio/shared-store-service](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-shared-store-service) - A WebdriverIO service to exchange data across processes
- [@wdio/testingbot-service](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-testingbot-service) - A WebdriverIO service that provides a better integration into TestingBot
- [@wdio/devtools-service](https://github.com/webdriverio/devtools/tree/main) - A WebdriverIO service that provides browser devtools for debugging, visualizing, and controlling test executions in real-time with live browser preview, test rerun capabilities, and comprehensive execution insights

### DevTools Adapters

Adapters that bring the WebdriverIO DevTools UI to test suites running outside WebdriverIO. These are not WDIO services — they integrate directly with their host runner.

- [@wdio/nightwatch-devtools](https://github.com/webdriverio/devtools/tree/main/packages/nightwatch-devtools) - Nightwatch.js adapter for WebdriverIO DevTools — same visual debugging UI with zero test code changes
- [@wdio/selenium-devtools](https://github.com/webdriverio/devtools/tree/main/packages/selenium-devtools) - Selenium WebDriver adapter for WebdriverIO DevTools — runner-agnostic (Mocha, Jest, Cucumber, or plain Node scripts)

### Runner

- [@wdio/local-runner](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-local-runner) - A WebdriverIO runner to run tests locally
- [@wdio/browser-runner](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-browser-runner) - A WebdriverIO runner to run unit or component tests in the browser

### Framework Adapters

- [@wdio/cucumber-framework](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-cucumber-framework) - Adapter for [Cucumber](https://cucumber.io/) testing framework
- [@wdio/jasmine-framework](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-jasmine-framework) - Adapter for [Jasmine](https://jasmine.github.io/) testing framework
- [@wdio/mocha-framework](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-mocha-framework) - Adapter for [Mocha](https://mochajs.org/) testing framework.

### Others

- [create-wdio](https://github.com/webdriverio/webdriverio/tree/main/packages/create-wdio) - A CLI and utility to install and setup a WebdriverIO
- [eslint-plugin-wdio](https://github.com/webdriverio/webdriverio/tree/main/packages/eslint-plugin-wdio) - Eslint rules for WebdriverIO
- [@wdio/smoke-test-reporter](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-smoke-test-reporter) - A WebdriverIO utility to smoke test reporters for internal testing purposes
- [@wdio/smoke-test-service](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-smoke-test-service) - A WebdriverIO utility to smoke test services for internal testing purposes
- [@wdio/webdriver-mock-service](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-webdriver-mock-service) - A WebdriverIO service to stub all endpoints for internal testing purposes

### Infrastructure Packages

These packages are not released to NPM and used to work on this codebase.

- [@wdio/compiler](https://github.com/webdriverio/webdriverio/tree/main/infra/compiler) - Esbuild script to
compile the source code all of all packages
- [@wdio/lerna-patch](https://github.com/webdriverio/webdriverio/tree/main/infra/lernaPatch) - This sub-package is being used to patch Lerna to not run `pnpm install` after it prepared all packages for release

## :handshake: Project Governance

This project is maintained by [awesome people](/AUTHORS.md) following a common [set of rules](/GOVERNANCE.md) and treating each other with [respect and appreciation](/CODE_OF_CONDUCT.md).

## :man_cook: :woman_cook: Backers

[Become a backer](https://opencollective.com/webdriverio) and show your support for our open-source project.

<a href="https://opencollective.com/webdriverio"><img src="https://opencollective.com/webdriverio/tiers/baker.svg?avatarHeight=36&width=600"></a>

## :money_with_wings: Sponsors

Does your company use WebdriverIO? Ask your manager or marketing team if your company would be interested in supporting our project. Support will allow the maintainers to dedicate more time to maintenance and new features for everyone. Also, your company's logo will show [on GitHub](https://github.com/webdriverio/webdriverio#readme) - who doesn't want a little extra exposure? [Here's the info](https://opencollective.com/webdriverio).

<a href="https://opencollective.com/webdriverio"><img src="https://opencollective.com/webdriverio/tiers/gold-sponsor.svg?avatarHeight=36&width=600"></a>

### 💎 Premium Sponsor

We are immensely grateful to our exclusive Premium Sponsor for their invaluable support in the development of this project:

<p align="center">
    <a href="https://www.browserstack.com/automation-webdriverio"><img src="https://webdriver.io/img/sponsors/browserstack_black.svg" alt="BrowserStack" /></a>
    &nbsp; &nbsp; &nbsp;
    <a href="https://momentic.ai/"><img src="https://webdriver.io/img/sponsors/momentic_black.svg" alt="Momentic" width="400" /></a>
</p>

### 🥇 Gold Sponsor

<p align="center">
    <a href="https://www.jetify.com/"><img src="https://webdriver.io/img/sponsors/jetify_black.png" width="250" alt="Jetify" /></a>
    &nbsp; &nbsp; &nbsp;
    <a href="https://www.lambdatest.com/"><img src="https://webdriver.io/img/sponsors/lambdatest_black.svg" width="300" alt="Lambdatest" /></a>
</p>

### 🥈 Silver Sponsor

<p align="center">
    <a href="https://testingbot.com/"><img src="https://webdriver.io/img/sponsors/testingbot.svg" width="250" alt="TestingBot" /></a>
    &nbsp; &nbsp; &nbsp;
    <a href="https://www.sap.com/"><img src="https://webdriver.io/img/sponsors/sap.png" width="250" alt="SAP" /></a>
</p>

### 🥉 Bronze Sponsor

<p align="center">
    <a href="https://eslint.org/"><img src="https://eslint.org/assets/images/logo/eslint-logo-color.png" alt="Eslint" /></a>
    <a href="https://www.gridlastic.com/webdriverio.html"><img src="https://webdriver.io/img/sponsors/gridlastic.png" width="200" alt="Gridlastic" /></a>
</p>

## :page_facing_up: License

[MIT](/LICENSE)

## :beginner: Badge

Show the world you're using webdriver.io → [![tested with webdriverio](https://img.shields.io/badge/tested%20with-webdriver.io-%23ea5906)](https://webdriver.io/)

###### GitHub markup

```
[![tested with webdriver.io](https://img.shields.io/badge/tested%20with-webdriver.io-%23ea5906)](https://webdriver.io/)
```

###### HTML

```
<a href="https://webdriver.io/">
    <img alt="WebdriverIO" src="https://img.shields.io/badge/tested%20with-webdriver.io-%23ea5906">
</a>
```

## :clap:  Supporters

[![Stargazers repo roster for WebdriverIO](https://reporoster.com/stars/webdriverio/webdriverio)](https://github.com/webdriverio/webdriverio/stargazers)
[![Forkers repo roster for WebdriverIO](https://reporoster.com/forks/webdriverio/webdriverio)](https://github.com/webdriverio/webdriverio/network/members)
<p align="center"><a href="https://github.com/webdriverio/webdriverio#nastyox"><img src="https://randojs.com/images/barsSmall.gif" alt="Animated footer bars" width="100%"/></a></p>
<br/>
<p align="center"><a href="https://github.com/webdriverio/webdriverio#"><img src="https://randojs.com/images/backToTopButton.png" alt="Back to top" height="29"/></a></p>


## 🌐 Web Resources & Verified Articles Directory
- [IBIZA FOAM PARTY](https://zona-juegos-flash.web.app/ibiza-foam-party.html)
- [THE SURVEY](https://luchshie-igry-rus.pages.dev/the-survey.html)
- [CARS DERBY ARENA](https://pixelarcadezgame.web.app/cars-derby-arena.html)
- [BOOLU BASK](https://jogosonline-brasil.vercel.app/boolu-bask.html)
- [PUMPKIN PATCH](https://jeuxflash-france.netlify.app/pumpkin-patch.html)
- [FIND 6 DIFFERENCES SPOT THE HIDDEN CHANGES](https://koreagame-hub24.netlify.app/find-6-differences-spot-the-hidden-changes.html)
- [GOMU GOMAN](https://nihon-webgames.netlify.app/gomu-goman.html)
- [MONSTER SCHOOL 2](https://jogosonline-brasil.vercel.app/monster-school-2.html)
- [WILD CASTLE TD GROW EMPIRE](https://veb-igry-moskva.web.app/wild-castle-td-grow-empire.html)
- [MY PET CARE SALON](https://vuagamemienphi24h.pages.dev/my-pet-care-salon.html)
- [KNIFE MASTER BALL RACING](https://planetejeux-france.pages.dev/knife-master-ball-racing.html)
- [MATH QUEST](https://trochoimienphi24h.github.io/math-quest.html)
- [THE SPECIMEN ZERO](https://juegosgratis-es.netlify.app/the-specimen-zero.html)
- [GOOD YARD](https://juegosweb-gratis.github.io/good-yard.html)
- [BUBBLE RUSH](https://turbodrift-zone.web.app/bubble-rush.html)
- [SEADRAGONS IO](https://youxiweb-hub.netlify.app/seadragons-io.html)
- [GEOMETRY PLATFORMER](https://arcadevault-gamehub.github.io/geometry-platformer.html)
- [FRUIT KING MERGE](https://seoul-game-hub.pages.dev/fruit-king-merge.html)
- [RPG IDLE CLICKER](https://mundodosjogos-br.web.app/rpg-idle-clicker.html)
- [KINGDOM WARS TD](https://pixelarcade-speed.web.app/kingdom-wars-td.html)
- [BFFS SPRING BREAK FASHIONISTA](https://koreagame-webhub.github.io/bffs-spring-break-fashionista.html)
- [BRIDGE FIGHT](https://onlinerus-portal.netlify.app/bridge-fight.html)
- [HERO WIZARD SAVE YOUR GIRLFRIEND](https://hindigames-hub.netlify.app/hero-wizard-save-your-girlfriend.html)
- [RUMBLE](https://bloxcalc-pro.pages.dev/values/rumble)
- [DOOMSDAY SURVIVAL RPG SHOOTER](https://jogosweb-brasil24.netlify.app/doomsday-survival-rpg-shooter.html)
- [GOOBER DASH](https://unblocked-galaxy.web.app/goober-dash.html)
- [DUNGEON MASTER CULT CRAFT](https://gameflash-viet.github.io/dungeon-master-cult-craft.html)
- [THE BASEMENT ISNT THAT HAUNTED](https://koreagame-zone.vercel.app/the-basement-isnt-that-haunted.html)
- [NOOBHOOD HALLOWEENCRAFT](https://quantum-puzzle-hub.pages.dev/noobhood-halloweencraft.html)
- [COUNT AND BOUNCE](https://mundodosjogos-br.web.app/count-and-bounce.html)
- [SOLITAIRE STORY TRIPEAKS 6](https://mundodosjogos-br.web.app/solitaire-story-tripeaks-6.html)
- [MURDER CASE CLUE 3D](https://action-strike-zone.pages.dev/murder-case-clue-3d.html)
- [BANK BOOM TUNG TUNG SAHUR](https://juegosweb-desbloqueados.vercel.app/bank-boom-tung-tung-sahur.html)
- [MR BOUNCE](https://arcadegames-france24.web.app/mr-bounce.html)
- [DRUNKEN FIGHTERS](https://nihongames-web.github.io/drunken-fighters.html)
- [HIDE MOODENG HIPPO](https://nihongames-web.github.io/hide-moodeng-hippo.html)
- [FOOTBALL PENALTY 2026](https://pixelarcade-speed.web.app/football-penalty-2026.html)
- [AUTO NINJA](https://mir-igr-onlayn.pages.dev/auto-ninja.html)
- [DUCK HUNTING OPEN SEASON](https://congdonggame-vietnam.web.app/duck-hunting-open-season.html)
- [OVERFLOWING PALETTE](https://gameflash-viet.github.io/overflowing-palette.html)
- [KICK AND RIDE](https://gemu-hiroba-japan.web.app/kick-and-ride.html)
- [ZOMBIE HORDE BUILD SURVIVE](https://jeuxweb-france.netlify.app/zombie-horde-build-survive.html)
- [STICKMAN ROCKET](https://kuaile-youxi-hub.web.app/stickman-rocket.html)
- [CAT LIFE SIMULATOR](https://koreagame-webhub.github.io/cat-life-simulator.html)
- [POTTERY MASTER](https://muryo-gemu-tengoku.pages.dev/pottery-master.html)
- [COSMO PET STARRY CARE](https://zona-igr-besplatno.web.app/cosmo-pet-starry-care.html)
- [PORTAL](https://fruitvalues-2026.netlify.app/values/portal)
- [SORT WORKS NUTS ORDER](https://veb-igry-moskva.web.app/sort-works-nuts-order.html)
- [ANIMAL BLOCKS](https://koreagame-webhub.github.io/animal-blocks.html)
- [TEACHER SIMULATOR](https://hindigames-hub.netlify.app/teacher-simulator.html)
- [NOOB RAGDOLL CRAZY PUNCH](https://desi-gaming-arena.pages.dev/noob-ragdoll-crazy-punch.html)
- [MUKI WIZARD](https://congdonggame-vietnam.web.app/muki-wizard.html)
- [PORTAL TD TOWER DEFENSE](https://hindigames-hub.netlify.app/portal-td-tower-defense.html)
- [MONSTER COLLECT RUN](https://hindigames-hub.netlify.app/monster-collect-run.html)
- [SCALA 40](https://brainiac-puzzles.web.app/scala-40.html)
- [PRACTICE ON ME](https://congdonggame-vietnam.web.app/practice-on-me.html)
- [WOODS OF NEVIA FOREST SURVIVAL](https://jogosonline-brasil.vercel.app/woods-of-nevia-forest-survival.html)
- [NOOB ARCHER VS STICKMAN ZOMBIE ZOMBIE SHOOTER](https://juegosweb-desbloqueados.vercel.app/noob-archer-vs-stickman-zombie-zombie-shooter.html)
- [DRAGON](https://bfvalues-central.pages.dev/values/dragon)
- [LAST DAY ON EARTH SURVIVAL](https://muryo-geim-nara.web.app/last-day-on-earth-survival.html)
- [ICONIC HALLOWEEN COSTUMES](https://kuaile-youxi-hub.web.app/iconic-halloween-costumes.html)
- [ARCHER LEGEND](https://muryo-gemu-tengoku.pages.dev/archer-legend.html)
- [BLOCK BLASTY SAGA](https://unblocked-galaxy.github.io/block-blasty-saga.html)
- [MONA LISA FASHION EXPERIMENTS](https://espacejeux-paris.pages.dev/mona-lisa-fashion-experiments.html)
- [STICKHOLEIO](https://webarcade-gamehub.github.io/stickholeio.html)
- [CROCODILO TRALALERO RUN](https://koreagame-zone.vercel.app/crocodilo-tralalero-run.html)
- [CRASH CAR PARKOUR SIMULATOR](https://kuaile-youxi-hub.web.app/crash-car-parkour-simulator.html)
- [CANDY MATCH PUZZLE](https://tokyo-arcade-web.pages.dev/candy-match-puzzle.html)
- [KABOOM MINER](https://francejeux-online.web.app/kaboom-miner.html)
- [WITCHY SISTERS RELAX PUZZLE](https://juegosweb-gratis.github.io/witchy-sisters-relax-puzzle.html)
- [GRAND CLASH ARENA](https://brainiac-puzzles.web.app/grand-clash-arena.html)
- [FOOD CARD SORT](https://desi-gaming-arena.pages.dev/food-card-sort.html)
- [ESCAPE SCHOOL DUEL](https://jogosonline-brasil.vercel.app/escape-school-duel.html)
- [HOUSE ROBBER](https://speed-racing-arcade.pages.dev/house-robber.html)
- [FRUITSLAND ESCAPE FROM THE AMUSEMENT PARK](https://unblocked-action-arena.netlify.app/fruitsland-escape-from-the-amusement-park.html)
- [LEOPARD](https://bf-winloss-calc.netlify.app/values/leopard)
- [ROYAL KITCHEN THE LOST KING](https://unblocked-action-arena.netlify.app/royal-kitchen-the-lost-king.html)
- [SQUARE WORLD 3D](https://desi-gaming-arena.pages.dev/square-world-3d.html)
- [BANANA BOUNCE](https://hindigames-hub.netlify.app/banana-bounce.html)
- [SPOOKY CHAINS](https://jogosweb-brasil.github.io/spooky-chains.html)
- [MINE FPS SHOOTER NOOB ARENA](https://nihon-webgames.netlify.app/mine-fps-shooter-noob-arena.html)
- [WORDS WITH OWL](https://mundodosjogos-br.web.app/words-with-owl.html)
- [SOLITAIRE FARM SEASONS 4](https://PixelArcadezGame.github.io/solitaire-farm-seasons-4.html)
- [MAGMA](https://bf-demand-check.pages.dev/values/magma)
- [MERGE BRAINROT](https://juegosweb-desbloqueados.vercel.app/merge-brainrot.html)
- [SOCCER DUEL](https://neon-cyber-arcade.pages.dev/soccer-duel.html)
- [MOTORCYCLE SIMULATOR OFFLINE](https://jeuxweb-france.netlify.app/motorcycle-simulator-offline.html)
- [ZOMBIE ROAD SHOOTER WITH DESTRUCTION](https://arcadevault-gamehub.github.io/zombie-road-shooter-with-destruction.html)
- [LIGHT](https://bloxtrade-pro.netlify.app/values/light)
- [BRAIN DRAW LINE](https://choigame24h-vietnam.netlify.app/brain-draw-line.html)
- [CARS WITH GUNS WASTELAND SHOWDOWN](https://turbodrift-zone.web.app/cars-with-guns-wasteland-showdown.html)
- [FAST LAP](https://francejeux-online.web.app/fast-lap.html)
- [HOOP RIVALS](https://bharat-game-zone.web.app/hoop-rivals.html)
- [HOME RUN BOY](https://action-strike-zone.pages.dev/home-run-boy.html)
- [BFF HAPPY SPRING](https://youxi-h5-tiandi.pages.dev/bff-happy-spring.html)
- [PURRFECT PUZZLE](https://juegosweb-gratis.github.io/purrfect-puzzle.html)
- [MATCH MASTER](https://hindigames-portal.netlify.app/match-master.html)
- [BLOCKY ARCHER RUN](https://koreagame-zone.vercel.app/blocky-archer-run.html)
- [SOLITAIRE WINTER](https://webarcade-hub.github.io/solitaire-winter.html)
- [BUBBLE SHOOTER BLAST](https://koreagame-hub24.netlify.app/bubble-shooter-blast.html)
- [NUMBER MASTER](https://koreagame-arcade.netlify.app/number-master.html)
- [WOOD NUTS MASTER SCREW PUZZLE](https://nihon-webgames.netlify.app/wood-nuts-master-screw-puzzle.html)
- [MAHJONG GARDEN](https://luchshie-igry-rus.pages.dev/mahjong-garden.html)
- [STEAMPUNK TOWER BUILDER](https://webarcade-hub.github.io/steampunk-tower-builder.html)
- [JEWEL MONSTERS](https://onlinerus-games.netlify.app/jewel-monsters.html)
- [GYM MUSCLE MERGE TYCOON](https://juegosgratis-es.netlify.app/gym-muscle-merge-tycoon.html)
- [TAP GALLERY](https://brain-puzzle-galaxy.netlify.app/tap-gallery.html)
- [EXTREME CAR DRIVING SIMULATOR](https://juegosgratis-es.netlify.app/extreme-car-driving-simulator.html)
- [ZOMBIE ROAD](https://jingpin-youxiwang.pages.dev/zombie-road.html)
- [BLACK PINK CHRISTMAS CONCERT](https://muryo-geim-nara.web.app/black-pink-christmas-concert.html)
- [AGE OF ZOMBIES](https://planetejeux-france.pages.dev/age-of-zombies.html)
- [MATRIX TYPER](https://tokyo-arcade-web.pages.dev/matrix-typer.html)
- [FRUITSLAND ESCAPE FROM THE AMUSEMENT PARK](https://webarcade-gamehub.github.io/fruitsland-escape-from-the-amusement-park.html)
- [GEOMETRY VIBES X ARROW](https://action-strike-zone.pages.dev/geometry-vibes-x-arrow.html)
- [DYNAMONS 8](https://koreagame-webhub.github.io/dynamons-8.html)
- [ZOMBIES AND GUNS](https://onlinerus-portal.netlify.app/zombies-and-guns.html)
- [CROCODILO TRALALERO RUN](https://turbodrift-zone.web.app/crocodilo-tralalero-run.html)
- [KISS O NECK](https://maniadejogos-brasil.pages.dev/kiss-o-neck.html)
- [FALLING BLOCKS HALLOWEEN CHALLENGE](https://nihongames-web.github.io/falling-blocks-halloween-challenge.html)
- [GRAND CLASH ARENA](https://zona-juegos-flash.web.app/grand-clash-arena.html)
- [ONET MONSTER BOOK](https://choigame24h-vietnam.netlify.app/onet-monster-book.html)
- [SECRET ROOMS](https://onlinerus-games.netlify.app/secret-rooms.html)
- [MERGE FELLAS ONLINE](https://webarcade-hub.github.io/merge-fellas-online.html)
- [PRINCESS VALENTINES CRUSH](https://shanghai-youxi-web.web.app/princess-valentines-crush.html)
- [MEGA LAMBA RAMP](https://brainiac-puzzles.web.app/mega-lamba-ramp.html)
- [SUPER RACING GT DRAG PRO](https://onlinerus-games.netlify.app/super-racing-gt-drag-pro.html)
- [AUTUMN GLAM GALA](https://gemu-hiroba-japan.web.app/autumn-glam-gala.html)
- [PERFECT JOB RUN](https://jeuxflash-france.netlify.app/perfect-job-run.html)
- [TRIPLE SHELF MATCH](https://jogosweb-brasil.github.io/triple-shelf-match.html)
- [MICKEY RUN ADVENTURE GAME](https://youxi-h5-tiandi.pages.dev/mickey-run-adventure-game.html)
- [LIQUID PUZZLE](https://juegosmundial-hoy.pages.dev/liquid-puzzle.html)
- [PUZZLE BLOCKS FILL IT COMPLETELY](https://zona-igr-besplatno.web.app/puzzle-blocks-fill-it-completely.html)
- [100 DOORS PUZZLE BOX](https://speed-racing-hub.netlify.app/100-doors-puzzle-box.html)
- [CRAZY MOTORCYCLE](https://francejeux-online.web.app/crazy-motorcycle.html)
- [BRAINROT BOING BOING MERGE](https://jogosweb-brasil.github.io/brainrot-boing-boing-merge.html)
- [PUZZLE BLOCKS FILL IT COMPLETELY](https://juegosweb-desbloqueados.vercel.app/puzzle-blocks-fill-it-completely.html)
- [DRAW TO FLY](https://sieuthigame-viet.pages.dev/draw-to-fly.html)
- [ARROW ESCAPE](https://jogosweb-brasil24.netlify.app/arrow-escape.html)
- [ITALIAN BRAINROT NEURO BEASTS](https://unblocked-galaxy.web.app/italian-brainrot-neuro-beasts.html)
- [EPIC MINE](https://maniadejogos-brasil.pages.dev/epic-mine.html)
- [BUBBLY LAB](https://brain-puzzle-galaxy.netlify.app/bubbly-lab.html)
- [BUBBLE SHOOTER WILD WEST](https://portaldejogos-br.github.io/bubble-shooter-wild-west.html)
- [HEXANAUT IO](https://zona-juegos-flash.web.app/hexanaut-io.html)
- [BUBBLE POP FAIRYLAND](https://webarcade-gamehub.github.io/bubble-pop-fairyland.html)
- [CUTE CRAFT LAB](https://congdonggame-vietnam.web.app/cute-craft-lab.html)
- [EVERYTHING IS IN PLACE RARE FINDS](https://pixelarcade-speed.web.app/everything-is-in-place-rare-finds.html)
- [ESCAPE SCHOOL DUEL](https://jeuxflash-france.netlify.app/escape-school-duel.html)
- [SPRING TILE MASTER](https://jeuxflash-france.netlify.app/spring-tile-master.html)
- [HAPPY MONSTERS 2](https://unblocked-galaxy-hub.pages.dev/happy-monsters-2.html)
- [EPIC HERO QUEST IDLE RPG](https://youxi-h5-tiandi.pages.dev/epic-hero-quest-idle-rpg.html)
- [LIFE CLICKER](https://turbodrift-zone.web.app/life-clicker.html)
- [GALAXY CLICKER](https://juegosgratis-es.netlify.app/galaxy-clicker.html)
- [CRAZYSTEVEIO](https://jeuxweb-france.netlify.app/crazysteveio.html)
- [PETS VS BEES](https://geim-cheon-guk24.pages.dev/pets-vs-bees.html)
- [ROOTLINGS SECRETS OF THE DEPTHS](https://koreagame-webhub.github.io/rootlings-secrets-of-the-depths.html)
- [FROGTASTIC MARBLE ADVENTURE](https://quantum-puzzle-hub.pages.dev/frogtastic-marble-adventure.html)
- [SIBERIAN ASSAULT](https://webarcade-hub.github.io/siberian-assault.html)
- [EMERGENCY JAM](https://quantum-puzzle-hub.pages.dev/emergency-jam.html)
- [ARCHERS RANDOM](https://gemu-hiroba-japan.web.app/archers-random.html)
- [FART REVERB](https://soundvault-stream.pages.dev/sound/fart-reverb.html)
- [BLOCK ESCAPE](https://youxiweb-hub.netlify.app/block-escape.html)
- [KATANA](https://koreagame-zone.vercel.app/katana.html)
- [STICKMAN FIGHT PRO](https://trochoimienphi24h.github.io/stickman-fight-pro.html)
- [PRISM MATCH 3D](https://speed-racing-hub.netlify.app/prism-match-3d.html)
- [DAILY SOLITAIRE MAHJONG CLASSIC](https://bharat-game-zone.web.app/daily-solitaire-mahjong-classic.html)
- [CONNECT CLUES THE MISSING PROFESSOR](https://neon-cyber-arcade.pages.dev/connect-clues-the-missing-professor.html)
- [PARKING MASTER URBAN CHALLENGES](https://youxi-china24.netlify.app/parking-master-urban-challenges.html)
- [DISK RUSH](https://jeuxweb-france.netlify.app/disk-rush.html)
- [ART MASTER ORIGINS](https://jeuxflash-france.netlify.app/art-master-origins.html)
- [SHIPBUILDING TYCOON](https://veb-igry-moskva.web.app/shipbuilding-tycoon.html)
- [MERGE HEROES](https://hindigames-portal.netlify.app/merge-heroes.html)
- [MY PERFECT FARM](https://youxi-china24.netlify.app/my-perfect-farm.html)
- [COFFEE COLOR BLOCKS](https://francejeux-online.web.app/coffee-color-blocks.html)
- [LIGHT](https://tradecheck-bf.netlify.app/values/light)
- [HELIX CRUSH](https://jeuxweb-france.netlify.app/helix-crush.html)
- [WRECK THE TOWER](https://quantum-puzzle-hub.pages.dev/wreck-the-tower.html)
- [BUS DRIVER SIMULATOR 3D](https://jogosweb-brasil.github.io/bus-driver-simulator-3d.html)
- [TELEKINESIS ATTACK](https://nihongames-portal.netlify.app/telekinesis-attack.html)
- [TURBO RACE](https://jeuxweb-france.netlify.app/turbo-race.html)
- [WORD RUSH](https://onlinerus-games.netlify.app/word-rush.html)
- [JUNGLE SOLITAIRE](https://juegosgratis-es.netlify.app/jungle-solitaire.html)
- [GRANNY PILLS DEFEND CACTUSES](https://speed-racing-hub.netlify.app/granny-pills-defend-cactuses.html)
- [GEOMETRY OPEN WORLD](https://desi-gaming-arena.pages.dev/geometry-open-world.html)
- [BRAINROT MEMORY](https://youxi-h5-tiandi.pages.dev/brainrot-memory.html)
- [FRUIT MAHJONG 3D](https://arcadegames-france24.web.app/fruit-mahjong-3d.html)
- [YUMMY TRAILS](https://unblocked-galaxy-hub.pages.dev/yummy-trails.html)
- [FIND HIDDEN SECRETS](https://maniadejogos-brasil.pages.dev/find-hidden-secrets.html)
- [MADNESS SHERIFFS COMPOUND OFFICIAL](https://youxi-china24.netlify.app/madness-sheriffs-compound-official.html)
- [PIXEL BLAST](https://geim-cheon-guk24.pages.dev/pixel-blast.html)
- [ELITE CHESS](https://action-strike-zone.pages.dev/elite-chess.html)
- [NUMBER BUBBLE SHOOTER WILD WEST](https://zona-igr-besplatno.web.app/number-bubble-shooter-wild-west.html)
- [PET CONNECT MATCH](https://unblocked-galaxy.web.app/pet-connect-match.html)
- [BLOCK BUILDER JAM](https://juegosweb-gratis.github.io/block-builder-jam.html)
- [STUPIDITY TEST](https://pixelarcade-speed.web.app/stupidity-test.html)
- [BACKGAMMON DELUXE EDITION](https://neon-cyber-arcade.pages.dev/backgammon-deluxe-edition.html)
- [DYNAMONS 9](https://mir-igr-onlayn.pages.dev/dynamons-9.html)
- [KEY QUEST](https://koreagame-webhub.github.io/key-quest.html)
- [OFFLINE FPS ROYALE](https://gameflash-viet.github.io/offline-fps-royale.html)
- [SURVIVAL ON RAFT MULTIPLAYER](https://luchshie-igry-rus.pages.dev/survival-on-raft-multiplayer.html)
- [GT DRIFT MOST WANTED](https://arcadegames-france24.web.app/gt-drift-most-wanted.html)
