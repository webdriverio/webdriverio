---
title: WebdriverIO v5 Released
author: Christian Bromann
authorURL: http://twitter.com/bromann
authorImageURL: https://s.gravatar.com/avatar/d98b16d7c93d15865f34a225dd4b1254?s=80
---

We are pleased to announce that a new major version of WebdriverIO has finally been released! I never thought that it would take this long (it's been over a year), but we can finally say that the new version of WebdriverIO is ready for use (and better than ever). There has been over 800 commits, from over [34 different contributors](https://github.com/webdriverio/webdriverio/graphs/contributors); and I am truly grateful to everyone who participated in this collective effort. With that being said...

## <center>🎉 🎉 🎉 Time to celebrate! 🎉 🎉 🎉</center>
<div style={{ width: '100%', height: 0, paddingBottom: '56%', position: 'relative' }}>
    <iframe
        src="https://giphy.com/embed/l0MYt5jPR6QX5pnqM"
        width="100%"
        height="100%"
        style={{ position: 'absolute' }}
        frameBorder="0"
        class="giphy-embed"
        allowFullScreen
    ></iframe>
</div>

<br />

When I began to practically rewrite this project from scratch [one year ago](https://github.com/webdriverio/webdriverio/commit/e375d2e3a664da087a6494c3ae381f762031303a), I knew there would be problems here and there. However, I was confident that the WebdriverIO community in the support channels would work collectively to help each other out; and I'm proud to say, I was right!

## The Goal

Looking into the history of the project, it is humbling to see how much it has been grown within just a few years. From a handful of downloads a day, to now almost 50k; as well as the knowledge that big companies are relying on this tool to ship their software on daily basis, it became obvious that the next big feature had to be sustainability. The first step was made by [joining the JS.Foundation](https://twitter.com/webdriverio/status/908013968861655040) at of 2017.

<br /><blockquote class="twitter-tweet" data-lang="de"><p lang="en" dir="ltr">Proud to announce that <a href="https://twitter.com/webdriverio?ref_src=twsrc%5Etfw">@webdriverio</a> is joining <a href="https://twitter.com/the_jsf?ref_src=twsrc%5Etfw">@the_jsf</a> to continue to grow as project and community 🎉 👏 <a href="https://t.co/N58Iv5oC9r">https://t.co/N58Iv5oC9r</a></p>&mdash; WebdriverIO (@webdriverio) <a href="https://twitter.com/webdriverio/status/908013968861655040?ref_src=twsrc%5Etfw">13. September 2017</a></blockquote><br />

The next step was to implement a technical infrastructure that would allow the project to grow. By reviewing other successful open source projects such as e.g. [Jest](https://jestjs.io/) or [Babel](https://babeljs.io/), we adapted a monolithic project structure to simplify the process of contributing to WebdriverIO.<br />
<br />
We wanted to start this effort completely community driven, and began to gather [feedback](https://github.com/webdriverio/webdriverio/issues/2403) from everyone who was using WebdriverIO on daily basis. We created a [Matrix channel](https://matrix.to/#/#webdriver.io:gitter.im) in order to discuss architectural changes, and to organize the work of porting the packages into the new tech stack that was [Lerna](https://lernajs.io/).

## New Package Structure

As we moved to a monolithic system we scoped all WebdriverIO packages into the [`@wdio`](https://www.npmjs.com/org/wdio) NPM organization. This would make it simpler to onboard contributors to release new package versions, and better clarifies which packages are "officially" maintained by the organization or are 3rd party community packages.<br />
<br />
If you have been using `wdio-mocha-framework` or `wdio-spec-reporter` in your project please update the packages to use the ones built for v5: `@wdio/mocha-framework` or `@wdio/spec-reporter`. Going forward the version number of all packages are now pinned to each other; meaning that you should always have the same versions for all "official" WebdriverIO packages that you use.

## We Did Some Spring Cleaning

When people proposed new commands to the API, we contributors became more and more hesitant to introduce them. There were a vast number of existing commands; and many of these requested commands provided very little difference from existing commands. This was beginning to become a maintenance nightmare.<br />
<br />
Starting with v5 we created a "base" WebdriverIO package called [`webdriver`](https://www.npmjs.com/package/webdriver). It contains the bare logic to make a HTTP request to a WebDriver endpoint; and includes all of the commands from [various specifications](https://github.com/webdriverio/webdriverio/tree/main/packages/webdriver/protocol) (including the [WebDriver](https://w3c.github.io/webdriver/) spec as well as Appium's [Mobile JSONWire protocol](https://github.com/SeleniumHQ/mobile-spec/blob/master/spec-draft.md)) defined in a simple to maintain JSON object.<br />
<br />
As part of that effort we've renamed many of the commands in order to align them closer to the pattern that has been used in the protocol. The base WebDriver client now also returns the `value` property of all protocol command responses, so that we were able to get rid of a lot of redundancy (e.g. `title` is now called with `getTitle`).<br />
<br />
Additionally, we have seen significant confusion regarding the WebdriverIO API, and the fact that it sometimes took selectors as a first argument, and sometimes not. This was causing various problems e.g. building a consistent and useful TypeScript definition for it. In the new version __we got rid of selectors as command parameters__, and enforced the difference between commands only accessible from the browser/client instance, and those from the element instance. In order to click on an element, you must now first fetch it, and then call the click command on that instance, e.g.

```js
browser.click('#elem') // throws 'browser.click is not a function'

const elem = $('#elem')
elem.click() // clicks successfully on the element
// or
$('#elem').click()

elem.url('https://webdriver.io') // throws because the url command is scoped on the browser object
```

## Website Changes

We already had an automated system that generated the docs for our website. As part of the new architecture and tech stack we however ported this from [Hexo](https://hexo.io/) to [Docusaurus](https://docusaurus.io/).<br />
<br />
We are still in the process of finalizing this effort, as we want to continue providing everyone a way to easily [change the version](https://github.com/webdriverio/webdriverio/issues/3147) of the docs. We are also looking into [providing multiple translations](https://github.com/webdriverio/webdriverio/issues/3148) of the docs so that people who don't speak english can better understand and use WebdriverIO. Please reach out to us on [Twitter](https://twitter.com/webdriverio), or directly on the issue thread if you want to help out. This is probably one of the best ways to get involved into an open source project.

## How To Upgrade To v5

There are significantly more things that we have been working on over the last year that you might like to read about. Check out the official [changelog](https://github.com/webdriverio/webdriverio/blob/main/CHANGELOG.md#v500-2018-12-20) to find all of the changes that describe the new version. We will probably continue to update this over time, as we weren't able to keep a list of every detail that changed. We would also like to ask you to have a look into the new [guide section](https://webdriver.io/docs/gettingstarted.html) and our updated docs in general.<br />
<br />
There is unfortunately no easy upgrade tool that you can download and run to update your test suites from v4 to v5 (even though we would love to have such a thing, PRs are welcome 😉). If you run into any issues upgrading to v5 please join our support [![Matrix](https://img.shields.io/badge/Join-on%20Matrix-4FB898)](https://matrix.to/#/#webdriver.io:gitter.im) and reach out to us.<br />
<br />
Every project is different, so it is impossible to have one single guide for everyone. However, the following step by step description will help you get closer to where you need to be:<br />
<br />
- read the [changelog](https://github.com/webdriverio/webdriverio/blob/main/CHANGELOG.md#v500-2018-12-20) to understand all breaking changes
- remove all `wdio-*` packages from your `package.json`
- remove your `node_modules` directory
- install the latest version of webdriverio: `$ npm install webdriverio@latest`
- install the new wdio testrunner: `$ npm install @wdio/cli --save-dev`
- if you have a `wdio.conf.js` in your root directory, create a backup: `$ cp wdio.conf.js wdio_backup.conf.js`
- rerun the configuration wizard: `$ npx wdio config`
- merge custom modifications of your old `wdio_backup.conf.js` into your new config file. Don't merge everything at once - just begin with the basic setup using no services and just the e.g. spec reporter to run tests locally and work towards a full migration
- take the simplest test in your suite and rename the commands according to the changelog
- have your log directory set in your config (e.g. `outputDir: __dirname`) to ensure you can see everything that is going on including errors (you can later set it to a proper log directory)
- attempt to run the the test suite you modified `$ npx wdio wdio.conf.js --spec ./path/to/modified/test.js`
- repeat on your remaining test files
- add reporters and services back into your `wdio.conf.js`, and see if they work as expected (__Note:__ it is possible that services or reporters that you have used aren't ported to v5 yet, if so, please raise an issue in the repository of that community package or try to port it)

<br />If you have issues porting your test suite, check the issues thread to see if someone has already reported the same problem; and then reach out to us on our Matrix channel. We may have missed porting / not yet ported a functionality that you have been using in your test. Thanks to the new project structure, we can quickly fix this and provide an update version for you!<br />
<br />
We will release further blog articles in our new blog with tutorials on how to upgrade WebdriverIO to v5 soon. You can also checkout the excellent [video series](https://www.youtube.com/watch?v=MO8xeC-w2Og&list=PL8HowI-L-3_9Ep7lxVrRDF-az5ku4sur_) from our beloved [Will Brock](https://twitter.com/willbrock) on the new release. An update to the [WebdriverIO Learning Course](https://learn.webdriver.io/) is also already in work.

## What Is Next

We didn't put put all this hard work into the project to end here. Instead, we just get started. We truly believe that [WebDriver](https://www.w3.org/TR/webdriver1/) is and always will be the automation standard of the industry. Therefore we are actively engaged in contributing to the standard to ensure that all commands are compliant to the protocols. We also will take your common problems and general feedback back to the [W3C Working Groups](https://www.w3.org/testing/browser/) in order to ensure that we can address major issues at the core of the technology.

<br /><blockquote class="twitter-tweet" data-lang="de"><p lang="en" dir="ltr">To ensure that <a href="https://twitter.com/webdriverio?ref_src=twsrc%5Etfw">@webdriverio</a> is always conforming to the <a href="https://twitter.com/hashtag/WebDriver?src=hash&amp;ref_src=twsrc%5Etfw">#WebDriver</a> standard, it will sends its representatives directly to the <a href="https://twitter.com/w3c?ref_src=twsrc%5Etfw">@w3c</a> TPAC meetings so you can use the latest features as soon as they are available 🙌🏻 <a href="https://t.co/oJbHPn99Oc">pic.twitter.com/oJbHPn99Oc</a></p>&mdash; WebdriverIO (@webdriverio) <a href="https://twitter.com/webdriverio/status/1055813210480238593?ref_src=twsrc%5Etfw">26. October 2018</a></blockquote><br />

After the release, we will be begin working on a detailed roadmap for the next year that allows you to participate in the progress and help us prioritizing features.

## An Open Source Project Made With ❤️

Before I close up this blog post, I want to address that WebdriverIO is an open source project maintained by dedicated people who love open source. Often, I get the feeling that people take this work for granted and forget that there are real humans spending their free time to provide some piece of software to everyone for free. As [@left_pad](https://twitter.com/left_pad) stated in the official Babel7 release:

<blockquote>"[...] I can only describe it as dread when seeing a message from someone online wondering why something hasn't been released while another asks why this bug isn't fixed yet. I want to just rush it out and be done with it but I also have a desire to take this seriously."</blockquote>

Please always be reminded that when you open an issue or ask for a feature that you are basically asking someone to spend his time on something to give you exactly that for free! Open source project can only work and survive if everyone participates and helps out with something. We are all humans and bugs happen, if you find them, please let us know in a way that we can easily work with the information and quickly fix it. It's even better if everyone once in a while takes some time of his day to contribute back. We are maintaining [a list](https://github.com/webdriverio/webdriverio/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc+label%3A%22good+first+pick%22) of well described issues that anyone can claim and start working on.<br />
<br />
Again, this project is not sponsored nor owned by any company. It is a collaborative effort of an inclusive community that loves to help each other out. Let's continue to stay exactly that!

## Thank You

Finally, I want to thank a few people that have helped to make this release happen; and/or for being such great people in the community. First, I want to thank all [34](https://github.com/webdriverio/webdriverio/graphs/contributors) contributors that participated in making this happen, as well as all the other [328](https://github.com/webdriverio-boneyard/v4/graphs/contributors) people that have been collaborating since the beginning.<br />
<br />
I personally want to thank [Kevin Lamping](https://twitter.com/klamping) for making a stellar [online learning course](https://learn.webdriver.io/) as well as so so much other great content on [YouTube](https://t.co/WX6flUsZ8e) over the last few years. As mentioned above - also a big thank you to [Will Brock](https://twitter.com/willbrock) for his [video course](https://www.youtube.com/watch?v=MO8xeC-w2Og&list=PL8HowI-L-3_9Ep7lxVrRDF-az5ku4sur_) on the new release.

I want to thank everyone who has been deeply involved in the support channel helping people out on daily basis. With over 3500 users it became impossible for me to answer everyone on the level I did before. Thank you [Erwin Heitzman](https://github.com/erwinheitzman), [Tu Huynh](https://github.com/TuHuynhVan), [Jim Davis](https://twitter.com/fijijavis), [Xu Cao](https://github.com/caoxu2000), [Boris Osipov](https://github.com/BorisOsipov) and [Wim Selles](https://twitter.com/wswebcreation).

Big shoutout to [Daniel Chivescu](https://twitter.com/iamdanchiv) and [Josh Cypher](https://twitter.com/joshuacypher) who have been giving talks on WebdriverIO around the world.<br />
<br />
And last but not least thank you [Adam Bjerstedt](https://github.com/abjerstedt), who has not only been helping out in the community channel; but also for helping to push out the v5 release at the end.<br />
<br />
🙏

<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
