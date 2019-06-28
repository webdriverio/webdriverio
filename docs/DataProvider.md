---
id: dataprovider
title: Data Provider
---

### What is Data Provider
* Data Provider enables test author to inject simple to complex test data into their test programmatically. 
* Can run same spec file with different sets of data in parallel
* Improves the execution time drastically when it comes to run the same test with multiple sets of data

### How to use Data Provider
In order to inject the test data into a particular spec file -
* Create a dataprovider file and populate an array with data as shown below. The array can conatain simple data or complex object
* Register the test data with the spec file by calling global function ```dataProvider(<spec_file_path>, <array_of_data>)```

```
//dataProvider.js

let pages = [
    {
        url :'https://webdriver.io', 
        title : 'WebdriverIO · Next-gen WebDriver test framework for Node.js'
    },
    {
        url :'https://webdriver.io/docs/gettingstarted.html', 
        title : 'Getting Started · WebdriverIO'
    }
]

dataProvider(path.resolve(__dirname, 'mochaWithDataProvider.test.js'), pages) 
```

* Register the data provider file or a whole directory containg all the data providers 
```
// wdio.conf.js

//Registering individual file 

module.exports = {
  // ...
  dataProviders: [path.resolve(__dirname, 'dataProvider.js')],
  // ...
};
```
```
//Registering a directory

module.exports = {
  // ...
  dataProviders: ['dataProviders/**/*.js'],
  // ...
};
```
* We can consume the above test data in test as follows -
```
const assert = require('assert')

describe(`${testData.url} page`, () => {
    it('should be a pending test')

    it('should have the right title', () => {
        browser.url(testData.url)
        const title = browser.getTitle()
        assert.equal(title, testData.title)
    })
})
```

`testData` is the global object holding all the test data for the given spec and for the given run.  
**Note:** In order to utilize this feature efficiently try to keep one describe block per spec file so that the same spec can run completely in parallel with different data sets

[Saucelab meetup video](https://www.youtube.com/watch?v=0YQCVJk8K_Q)


