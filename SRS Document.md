## Revision History
| name | date | reason to change | version |
| --- | --- | --- | --- |
| creation | 15.04.22 | - | 0.1 |
| | | |  |

## Document Conventions
* General terms are written in *italic*.
* Key terms are written in **bold**.
* TBD stands for "To be Decided", these are parts that will be written or changed in the future
* IEEE. IEEE Std 830-1998 IEEE Recommended Practice for Software Requirements Specifications. IEEE Computer Society, 1998.


# 1. Introduction

## 1.1 Purpose
This documentation is intended to offer a overview of the WebDriverIO's requirements and specifications.

The aim of WebdriverIO is to simplify the interation between *users* and apps, offering a collection of plugins to assist a user in building scalable, robust, and secure tests for modern online and mobile apps.

In general, the WebdriverIO is considered to be an open source JavaScript-based custom implementation 
of the Selenium webdriver API. It is intended to be a simple but at the same time powerful software 
which improve the user-application interactions and help user to write quick frontend tests. 
WebdriverIO is a tool that may be used to automate both web and mobile apps. Furthermore, it supports 
programming languages such as Angular, Vue.js, React. It is also support working with the native iOS, 
Android mobile applications. By using Webdriver Protocol a user can do the cross browser testing
for his project. 
           
## 1.2 Intended Audience
This documentation may be understood by anybody with a basic understanding of programming. But the focus is on Software Architects, Project Managers, Developers, Documentation Writers and Testers.
       
## 1.3 Product Scope
*Browser automation* is the process of automatically executing instructions in a web browser to reach levels of efficiency and speed that would be difficult to achieve manually. There are many various web browser automation software are available. One of the popular examples is Selenium. Selenium is the most widely used web browser automation tool that has been around the longest (since 2004). Selenium supports most programming languages except JavaScript. While WebdriverIO is considered Webdriver/Selenium 2.0 JavaScript bindings for Node.js. However, it would be a mistake to think that WebdriverIO is a just JavaScript version of Selenium. WebdriverIO is a full test framework with various additional features which lets the users to control online and mobile apps with just a few lines of code.

### Advantages
* It would be easy to start and get used to for beginners.
(The installation process is straightforward and quick. The proccess itself described in the [documentation page](https://webdriver.io/docs/gettingstarted) )
* Built in wait testing (WebdriverIO supports automatic and explicit waiting instuctions)
* Extendable (It's easy to add assistance functions, as well as more complex sets and variations of existing instructions.)
* Integration with CI tools (e.g. Jenkins, Bamboo, Github)
* Readable syntax (WebdriverIO allows the user to run all instruction in sync mode which can improve the readibility.)

## 1.4 Acronyms and Definitions 
| Term | Description |
| --- | --- |
| User | a person who uses WebDriverIO |
| Browser automation |  a process of automatically executing instructions in a web browser to reach levels of efficiency and speed that would be difficult to achieve manually |
| Cross browser testing | a type of testing that allows a user to see if their website works as expected when viewed through various combinations of browsers and/or operating systems |
| Race condition | a condition when two or more threads access a shared variable at the same time |
| LTS | stands for "Long Term Support" and refers to software that is supported for a longer length of time than the standard edition. |
|RESTful|A web API that obeys the REST constraints is informally described as RESTful.|
|Sync mode| A mode where an operation waits for a response out the server in the format of an output parameter|


# 2. Overall Description

## 2.1 Product Perspective
* **JavaScript**: With the support of the WebdriverIO library, the user builds the script.
* **NodeJS**: NodeJS is an open-source project that makes the Javascript runtime environment easier to use.
* **WebdriverIO**: WebdriverIO is a NodeJS-based application that interacts with NodeJS.

![](https://github.com/TemirlanAidarov/Images/blob/main/Diagram.drawio.svg)


WebdriverIO is based on NodeJS, which is considered to be a JSON Wire Protocol implementation. It performs automated testing using a RESTful architecture.

With the support of the WebdriverIO library, the user builds the script in JavaScript. In that case the Service request is transmitted through NodeJS as an HTTP instruction. It apllies the JSON Wire protocol and the service module redirects the request to the webbrowser.

Then the browser executes the user actions after getting the instruction, ensuring that the application functionalities are legitimate.

## 2.2 Product Functions
Using this WebdriverIO, user can automate modern web written in  React, Angular, Polymeror Vue.js as well as native mobile applications for Android and iOS.

* WebDriver Protocol (for cross browser testing)
* Chrome Dev Tools Protocol (for chromium based automation)
* Appium (for mobile automation)

## 2.3 User Classes and Characteristics
In general, WebdriverIO is characterized as a simple and accessible tool for creating web and mobile app tests. It is accessible to anyone who wants to learn and write frontend tests in JavaScript (TypeScript) and needs some assistance.

WebdriverIO is easy to start and get used to for beginners. The installation process is straightforward and quick. Users do not need to install any browser drivers and configure themselves. After installation, the user only needs to write a config command that will perform all the necessary configuration. Further details are described in the [documentation page](https://webdriver.io/docs/gettingstarted) 

## 2.4 Operating Environment
User have to install Node.js. It is suggested to choose LTS version, so it is suggested to choose least 
12.16.1 or above. 
There are no other strict rules regarding system requirements. Nevertheless, in order to work with little problem 
as possible with Node.js and WebdriverIO, it is adviced for users to have:
* Ubuntu version 16.04 or higher for Linux 
* or Windows 7 or newer versions with atleast 2GB RAM (4GB preferable). 

## 2.5 Assumptions and Dependencies
The WebdriverIO community have build full test framework with various additional features (e.g. making CLI tool more powerful, Jest Framework Support). Still, the WebdriverIO community is active and working on continuous improvements. 

There are various projects that are planned in the future such as improving DevTools Service; making more videos as documentation material; making a support for Multiple Environments and etc. A complete list of planned projects, as well as completed projects, can be found at [RoadMap.md](https://github.com/webdriverio/webdriverio/blob/main/ROADMAP.md) file. 
This is not an exhaustive list, and it may be updated if someone recommends something that everyone agrees on. New contributors are welcome to join in discussions and providing new ideas.
           
# 3. System Features and Requirements
## 3.1 External Interface Requirements
### 3.1.1 User Interfaces
Webdriverio is a plugin, so the user needs an IDE to work with it. Hence, the UI which interacts with user would depend on the IDE. 
The interaction can be illustrated with following high-level diagram:

![](https://github.com/TemirlanAidarov/Images/blob/main/User%20Diagram.drawio.svg)

### 3.1.2 Software interfaces
There are various packages in WebdriverIO. The list and details about them can be found in the project [repository](https://github.com/webdriverio/webdriverio/tree/main/packages). Over the years the WebdriverIO community has collected a many great curated resources.

## 3.2 Software quality attributes
* Software should be user friendly
* Software should be open source, where everyone can offer a new idea and contribute in accordance with the rules.
* Software should have accessible product support
* Software should have good documentations and tutorials
* Software should support a variety of community plugins
* Software should be integrable and extensible to be customized according to the user's need.

## 3.3 Software quality attributes
TBD
