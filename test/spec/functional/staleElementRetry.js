function run(iteration, fn) {
    return fn()
    .catch(function(e) {
        console.log('Iteration ' + iteration + ' failed with error: ' + e);
        throw e;
    });
}

function runInSeries(fn) {
    var iterations = 100;
    var promises = [];

    for (var i = 1; i <= iterations; i++) {
        promises.push(run.bind(null, i, fn));
    }

    return promises.reduce(function(promise, fn) {
        return promise.then(fn);
    }, Promise.resolve());
}

function runInParallel(fns) {
    var promises = fns.map(function(fn) {
        return expect(fn()).to.eventually.be.true;
    });
    return Promise.all(promises)
    .then(function() {
        return true;
    });
}

/**
 * PhantomJS < v2.0 crashes here
 * ToDo manually install phantomjs 2.0
 */
describe.skip('staleElementRetry', function() {

    before(h.setup());

    it('isVisible', function() {
        var fn = this.client.isVisible.bind(this, '.staleElementContainer1 .stale-element-container-row');
        return expect(runInSeries(fn)).to.eventually.be.true;
    });

    it('waitForVisible', function() {
        var fns = [];
        for (var i = 1; i <= 40; i++) {
            fns.push(
                this.client.waitForVisible.bind(this, '.staleElementContainer2 .stale-element-container-row-' + i, 10000, true)
            );
        }
        return expect(runInParallel(fns)).to.eventually.be.true;
    });

});
