A software requirements specification (SRS) is a document that explains what the program will accomplish and how it will function. It also specifies the features that the product must have in order to satisfy the requirements of all stakeholders.
## Revision History
| name | date | reason to change | version |
| --- | --- | --- | --- |
| creation | 06.04.22 | - | 0.1 |
| | | |  |


# 1. Introduction

## 1.1 Purpose
In general, the WebdriverIO is considered to be an open source JavaScript-based custom implementation 
of the Selenium webdriver API. It is intended to be a simple but at the same time powerful software 
which improve the user-application interactions and help user to write quick frontend tests. 
WebdriverIO is a tool that may be used to automate both web and mobile apps. Furthermore, it supports 
programming languages such as Angular, Vue.js, React. It is also support working with the native iOS, 
Android mobile applications. By using Webdriver Protocol a user can do the cross browser testing
for his project. 
           
## 1.2 Intended Audience
WebdriverIO is characterized as a simple and accessible tool for creating web and mobile app tests. It is accessible to anyone who wants to learn how to write frontend tests and needs some assistance. There are also a brief lessons with documentation to assist new users to get more familiar with the software. Futhermore, there is an active community on the GitHub where anyone can ask some questions regarding WebdriverIO.
           
## 1.3 Intended Usage
WebdriverIO has numerous community plugins that can be smoothly integrated and customized to meet certain needs. There are also options to work in usual synchronous and asynchronous modes. The one of the great features of 
WebdriverIO that it lets you to write in an asynchronous manner, which can be useful in eliminating race 
situations for the user.
           
## 1.4 Acronyms and Definitions 
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
