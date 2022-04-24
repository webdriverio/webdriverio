## Revision History
| name | date | reason to change | version |
| --- | --- | --- | --- |
| creation | 15.04.22 | - | 0.1 |
| | | |  |

## Document Conventions
* General terms are written in *italic*.
* Key terms are written in **bold**.
* IEEE. IEEE Std 830-1998 IEEE Recommended Practice for Software Requirements Specifications. IEEE Computer Society, 1998.


# 1. Introduction

## 1.1 Purpose
This documentation is intended to offer a overview of the WebDriverIO's requirements and specifications.

The aim of WebdriverIO is to simplify the interation between users and apps, offering a collection of plugins to assist a user in building scalable, robust, and secure tests for modern online and mobile apps.

In general, the WebdriverIO is considered to be an open source JavaScript-based custom implementation 
of the Selenium webdriver API. It is intended to be a simple but at the same time powerful software 
which improve the user-application interactions and help user to write quick frontend tests. 
WebdriverIO is a tool that may be used to automate both web and mobile apps. Furthermore, it supports 
programming languages such as Angular, Vue.js, React. It is also support working with the native iOS, 
Android mobile applications. By using Webdriver Protocol a user can do the cross browser testing
for his project. 
           
## 1.2 Intended Audience

This documentation may be understood by anybody with a basic understanding of programming. But the focus is on Software Architects, Project Managers, Developers, Documentation Writers and Testers.

In general, WebdriverIO is characterized as a simple and accessible tool for creating web and mobile app tests. It is accessible to anyone who wants to learn how to write frontend tests and needs some assistance.
       
## 1.3 Product Scope
Browser automation is the process of automatically executing instructions in a web browser to reach levels of efficiency and speed that would be difficult to achieve manually. There are many various web browser automation software are available. One of the popular examples is Selenium. Selenium is the most widely used web browser automation tool that has been around the longest (since 2004). Selenium supports most programming languages except JavaScript. While WebdriverIO is considered Webdriver/Selenium 2.0 JavaScript bindings for Node.js. However, it would be a mistake to think that WebdriverIO is a just JavaScript version of Selenium. WebdriverIO is a full test framework with various additional features which lets the users to control online and mobile apps with just a few lines of code.

### Advantages
* It would be easy to start and get used to for beginners.
(The installation process is straightforward and quick. The proccess itself described in the [documentation page](https://webdriver.io/docs/gettingstarted) )
* Built in wait testing (WebdriverIO supports automatic and explicit waiting instuctions)
* Extendable (It's easy to add assistance functions, as well as more complex sets and variations of existing instructions.)
* Integration with CI tools (e.g. Jenkins, Bamboo, Github)
* Readable syntax (WebdriverIO allows the user to run all instruction in sync mode which can improve the readibility.)

## 1.4 Acronyms and Definitions 
- User
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

## 2.1 Product Perspective
* **JavaScript**: With the support of the WebdriverIO library, the user builds the script.
* **NodeJS**: NodeJS is an open-source project that makes the Javascript runtime environment easier to use.
* **WebdriverIO**: WebdriverIO is a NodeJS-based application that interacts with NodeJS.

![](https://github.com/TemirlanAidarov/Images/blob/main/Diagram.drawio.svg)


WebdriverIO is based on NodeJS, which is considered to be a JSON Wire Protocol implementation. It performs automated testing using a RESTful architecture.

With the support of the WebdriverIO library, the user builds the script in JavaScript. In that case the Service request is transmitted through NodeJS as an HTTP instruction. It apllies the JSON Wire protocol and the service module redirects the request to the webbrowser.

Then the browser executes the user actions after getting the instruction, ensuring that the application functionalities are legitimate.

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
