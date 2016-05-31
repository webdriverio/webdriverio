import mobileDetector from '../../../lib/helpers/mobileDetector';

describe('mobileDetector helper', () => {
    it('should not detect mobile app for browserName===undefined', function () {
        const {isMobile, isIOS, isAndroid} = mobileDetector({});
        expect( isMobile ).to.be.false;
        expect( isIOS ).to.be.false;
        expect( isAndroid ).to.be.false;
    })

    it('should not detect mobile app for browserName==="firefox"', function () {
        const {isMobile, isIOS, isAndroid} = mobileDetector({browserName:"firefox"});
        expect( isMobile ).to.be.false;
        expect( isIOS ).to.be.false;
        expect( isAndroid ).to.be.false;
    })

    it('should not detect mobile app for browserName==="chrome"', function () {
        const {isMobile, isIOS, isAndroid} = mobileDetector({browserName:"chrome"});
        expect( isMobile ).to.be.false;
        expect( isIOS ).to.be.false;
        expect( isAndroid ).to.be.false;
    })

    it('should detect mobile app for browserName===""', function () {
        const {isMobile, isIOS, isAndroid} = mobileDetector({browserName:''});
        expect( isMobile ).to.be.true;
        expect( isIOS ).to.be.false;
        expect( isAndroid ).to.be.false;
    })

    it('should detect Android mobile app', function () {
        const {isMobile, isIOS, isAndroid} = mobileDetector({
                platformName: 'Android',
                platformVersion: '4.4',
                deviceName: 'LGVS450PP2a16334',
                app: 'foo.apk',
            });
        expect( isMobile ).to.be.true;
        expect( isIOS ).to.be.false;
        expect( isAndroid ).to.be.true;
    })

    it('should detect Android mobile app without upload', function () {
        const {isMobile, isIOS, isAndroid} = mobileDetector({
                platformName: 'Android',
                platformVersion: '4.4',
                deviceName: 'LGVS450PP2a16334',
                appPackage: 'com.example',
                appActivity: 'com.example.gui.LauncherActivity',
                noReset: true,
                appWaitActivity: 'com.example.gui.LauncherActivity',
            });
        expect( isMobile ).to.be.true;
        expect( isIOS ).to.be.false;
        expect( isAndroid ).to.be.true;
    })

})
