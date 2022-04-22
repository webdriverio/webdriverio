A software requirements specification (SRS) is a document that explains what the program will accomplish and how it will function. It also specifies the features that the product must have in order to satisfy the requirements of all stakeholders.
## Revision History
| name | date | reason to change | version |
| --- | --- | --- | --- |
| creation | 15.04.22 | - | 0.1 |
| | | |  |


# 1. Introduction

## 1.1 Purpose
This documentation is intended to offer a overview of the WebDriverIO's requirements and specifications.

The aim of WebDriverIO is to simplify the interation between users and apps, offering a collection of plugins to assist a user in building scalable, robust, and secure tests for modern online and mobile apps.

In general, the WebdriverIO is considered to be an open source JavaScript-based custom implementation 
of the Selenium webdriver API. It is intended to be a simple but at the same time powerful software 
which improve the user-application interactions and help user to write quick frontend tests. 
WebdriverIO is a tool that may be used to automate both web and mobile apps. Furthermore, it supports 
programming languages such as Angular, Vue.js, React. It is also support working with the native iOS, 
Android mobile applications. By using Webdriver Protocol a user can do the cross browser testing
for his project. 
           
## 1.2 Intended Audience

This documentation may be understood by anybody with a basic understanding of programming. But the focus is on Software Architects, Project Managers, Developers, Documentation Writers and Testers.

WebdriverIO is characterized as a simple and accessible tool for creating web and mobile app tests. It is accessible to anyone who wants to learn how to write frontend tests and needs some assistance. There are also a brief lessons with documentation to assist new users to get more familiar with the software. Futhermore, there is an active community on the GitHub where anyone can ask some questions regarding WebdriverIO.
           
## 1.3 Intended Usage
WebdriverIO has numerous community plugins that can be smoothly integrated and customized to meet certain needs. There are also options to work in usual synchronous and asynchronous modes. The one of the great features of 
WebdriverIO that it lets you to write in an asynchronous manner, which can be useful in eliminating race 
situations for the user.

## 1.4 Objectives
## 1.4.1 Upcoming Projects (in no particular order)

| Project | Description |
|---------|-------------|
|[Better Debugging Capabilities](https://github.com/webdriverio/webdriverio/projects/4)|With WebdriverIO, there are already a few ways to debug test code. However, using native Node.js debugging features, which necessitates particular management of workers and sub processes, is still not straightforward. The goal must be for developers to be able to create breakpoints in their IDEs in order to debug.|
|[Parallelize tests on test block level vs. file level](https://github.com/webdriverio/webdriverio/projects/6)|We received multiple requests to allow parallelization of tests on a block level rather than a file level. Ava as a framework, which comes with that form of parallelization, may be a viable choice.|
|[Improve DevTools Service](https://github.com/webdriverio/webdriverio/projects/7)|The @wdio/devtools-service extends WebDriver's automation features (e.g. get network logs, tracing, performance etc). A number of features may be introduced to aid in the testing of apps (for example, improved mocking/stubbing of browser requests and answers). It would also be desirable if the service worked in the same way on Firefox and Edge.|
|[WebdriverIO Fiddle Platform](https://github.com/webdriverio/webdriverio/projects/8)|One of the community members has already begun working on a WebdriverIO fiddle (try.webdriver.io). It is currently ineffective and requires more development. Sharing test code snippets would be extremely beneficial in identifying flaws in someone's automation script. It's also feasible to integrate Sauce Labs here.|
|[More videos as documentation material](https://github.com/webdriverio/webdriverio/projects/9)|In the documentation, include videos for setting up WebdriverIO, installing plugins, and other use cases.|
|[Network Recording](https://github.com/webdriverio/webdriverio/projects/15)|We aim to make asserting the browser's network behavior as smooth as possible. We may implement similar behavior in WebdriverIO, inspired by Jest and their Snapshot capability.|
|[Improved Frontend Framework Support](https://github.com/webdriverio/webdriverio/projects/16)|Almost all current online apps are created in either React, Angular, Vue, Svelte, or another frontend framework. When it comes to picking elements or introspection of app states and crucial portions, these frameworks might be challenging to work with. WebdriverIO offers the ability to assist the user in better testing these apps.|
|[Support for Multiple Environments](https://github.com/webdriverio/webdriverio/projects/17)|WebdriverIO can currently only run on Node.js, which is the environment in which most users utilize it. However, it would be wonderful if WebdriverIO could be used in other environments as well, such as the browser or Deno. All packages must be ESM compatible in order for this to happen.|

## 1.4.2 Completed Projects
| Project | Description | Date |
|---------|-------------|-----------|
|Make CLI tool more powerful|If the user is unfamiliar with the project or WebDriver in general, adding basic add-ons to the configuration becomes tough. Installing some easy commands to the CLI interface that allow for the addition of services and reporters as well as configuration changes will greatly simplify the process of adding plugins.| 6th June 2019|
|Cucumber Framework Support|Cucumber is a popular framework, and many people ask for help with it. The community has already done some preliminary work on this. The code would subsequently be ready to use if it received adequate unit tests.| 9th July 2019|
|Jest Framework Support|JIn the JS environment, Jest has become one of the most popular unit test frameworks. Even while the most of their features aren't useful in the e2e area, some of them (such as snapshot testing) might help users write better e2e tests. On this, some preliminary work has been done.|20th December 2019|
|Custom Assertion Library|It would be wonderful if WebdriverIO came with a native assertion library (similar to what Jest or Jasmine provide) included in the testrunner to make assertion on components or other objects easier across all frameworks|20th December 2019|
|Autogenerate Sample Files| Allow users to pre-configure an existing boilerplate so they don't have to manually set up these files. We want to allow the configuration wizard or a new 'wdio' command to operate as a baseline for the test setup because the community has amassed a number of helpful boilerplate projects.|13 June 2020|
|Integrating WebdriverIO is common use setup build tools|There are a number of initiatives that can assist you in starting a project from the ground up. WebdriverIO should be added as an e2e testing option, which will aid driver adoption.|18 July 2020|
|Network Primitives| We should move forward and provide improved network primitives for WebdriverIO to let users access the network layer now that Puppeteer has greater cross browser compatibility. Furthermore, once WebDriver adopts the BiDi protocol, these functionalities are expected to be implemented.|16th July 2020|
|TypeScript Rewrite|We are more impacted by type errors that are difficult to discover as our code base grows. We aim to rebuild the code base in TypeScript to eliminate similar issues and make it easier to work with.|08th February 2021|

## 1.5 Acronyms and Definitions 
- Selenium is a library for automating browsers. Selenium is most commonly used for web application testing, 
            however, it may be used for any task that involves automating browser interaction.
- Cross browser testing is a kind of testing that allows you to see if your website works as 
            expected when viewed through various combinations of browsers and/or operating systems.
- Web frameworks is a software framework that helps developers create web applications such as web services, 
            web resources, and web APIs.
- A race condition occurs in software when the proper operation of a computer program is dependent on the order
            or timing of the program's processes or threads.
- From a developer's perspective, Test-Driven Development(TDD) is a testing methodology or a programming 
            discipline.
- The testing strategy Behavioral-Driven Development (BDD) is derived from the (TDD) methodology
            that is more focused on on systems behavior testing.
- Node.js is a runtime software that is mostly used to create server-side JavaScript apps.
- LTS stands for "Long Term Support" and refers to software that is supported for a longer length of time 
            than the standard edition.
            
# 2. Overall Description

## 2.1 User Needs
First of all, the user need to have the basic understanding of WebdriverIO use. Before downloading and working with 
WebdriverIO the programmer is required to have install Node.js. Because  WebdriverIO specifically requires 
LTS (Long Term Support) version, so the programmer need to install version 12.16.1 or above.
It is advised to download NVM first if you don't already installed Node.js. NVM facilitate working numerous active 
Node versions. Furthermore, it is advised to install Python v3 (or above versions) in order to work with WDIO Testrunner 
in synchronous mode.
           
## 2.2 Assumptions and Dependencies
Current WebdriverIO project have already sattisfied its main objectives such as building toolkit which hepls to make tests 
fast and in an organized way, making them much easier to change and manage. The project is headed toward the maintaing 
and bag fixing phase. As it stated there is still room for an imporvement.
           
# 3. System Features and Requirements

## 3.1 Functional Requirements
There is one possibliy option to build test files which is using Babel. Babel is a compiler for JavaScript. if you want 
to develop tests that employ next-generation JavaScript capabilities.
In order to install Babel, first install the its dependencies you'll need:
npm install --save-dev @babel/core @babel/cli @babel/preset-env @babel/register
           
It is important to make sure babel.config.js file is set up correctly.
            
The basic setup is following:
            `module.exports = {
            
                presets: [
                
                    ['@babel/preset-env', {
                    
                        targets: {
                        
                            node: '14'
                            
                        }
                        
                    }]
                    
                ]
                
            }`
            
 The WebdriverIO will then take care of everything else.

## 3.2 System Requirements
Node.js must be installed by the user. Because it is the oldest current LTS version, the user must install at least 
12.16.1 or above. Installing only officially supported releases that are or will become LTS releases is also required.
There are no other strict rules regarding system requirements. Nevertheless, in order to work with little problem 
as possible, it is adviced for users to have Ubuntu version 16.04 or higher for Linux, or Windows 7 or higher with 
2GB RAM (4GB preferable). 
