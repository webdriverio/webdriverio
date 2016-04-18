var ConfigParser = require('../../../lib/utils/ConfigParser');
var FIXTURES_PATH = __dirname + '/../../fixtures';

describe('ConfigParser', function() {

    before(function(){
        this.parser = new ConfigParser();
        this.parser.addConfigFile(FIXTURES_PATH + '/exclude.conf.js');
    })

    it('should get specs files for chrome', function() {
        var cap = this.parser.getCapabilities(0);
        var specs = this.parser.getSpecs(cap.specs,cap.exclude);
        expect(specs.length).to.be.equal(2);
        expect(specs[0]).to.contain('./test/spec/mobile/context.js');
        expect(specs[1]).to.contain('./test/spec/mobile/location.js');
    });

    it('should get specs files for firefox', function() {
        var cap = this.parser.getCapabilities(1);
        var specs = this.parser.getSpecs(cap.specs,cap.exclude);
        expect(specs.length).to.be.equal(3);
        expect(specs[0]).to.contain('./test/spec/mobile/location.js');
        expect(specs[1]).to.contain('./test/spec/unit/configparser.js');
        expect(specs[2]).to.contain('./test/spec/addValue.js');
    });

    it('should get specs files for phantomjs', function() {
        var cap = this.parser.getCapabilities(2);
        var specs = this.parser.getSpecs(cap.specs,cap.exclude);
        expect(specs.length).to.be.equal(1);
        expect(specs[0]).to.contain('./test/spec/desktop/chooseFile.js');
    });

})
