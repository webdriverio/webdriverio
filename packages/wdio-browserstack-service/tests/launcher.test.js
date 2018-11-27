import BrowserstackLauncher from '../src/launcher'
jest.mock('browserstack-local');
import Browserstack from 'browserstack-local';

const error = new Error(`I'm an error!`);

describe('onPrepare', () => {
    const caps = [{}];
    const config = {
        user: 'foobaruser',
        key: '12345',
        browserstackLocal: true
    };

    it('should not call local if browserstackLocal is undefined', () => {
        const service = new BrowserstackLauncher();

        return expect(service.onPrepare({
            user: 'foobaruser',
            key: '12345'
        }, [{}])).resolves.toBe('Browserstack Local is off')
            .then(() => expect(service.browserstackLocal).toBeUndefined());
    });

    it('should not call local if browserstackLocal is false', () => {
        const service = new BrowserstackLauncher();

        return expect(service.onPrepare({
            user: 'foobaruser',
            key: '12345',
            browserstackLocal: false
        },caps)).resolves.toBe('Browserstack Local is off')
            .then(() => expect(service.browserstackLocal).toBeUndefined());
    });

    it('should initialize the opts object, and spawn a new Local instance', () =>{
        const service = new BrowserstackLauncher();

        return service.onPrepare(config,caps)
            .then(() => {
                expect(service.browserstackLocal).toBeDefined();
            });
    });

    it('should add the "browserstack.local" property to a single capability', () => {
        const service = new BrowserstackLauncher();
        global.capabilities = {};

        return service.onPrepare(config, global.capabilities)
            .then( () => expect(global.capabilities).toEqual({"browserstack.local": true}));
    });

    it('should add the "browserstack.local" property to an array of capabilities', () => {
        const service = new BrowserstackLauncher();
        global.capabilities = [{}, {}, {}];

        return service.onPrepare(config, global.capabilities)
            .then( () => expect(global.capabilities).toEqual(
                [{"browserstack.local": true},
                    {"browserstack.local": true},
                    {"browserstack.local": true}
                ]));
    });

    it('should reject if "capabilities" is not an object/array', () => {
        const service = new BrowserstackLauncher();
        global.capabilities = 1;

        return expect(service.onPrepare(config, global.capabilities))
            .rejects.toEqual('Unhandled capabilities type!');
    });

    it('should reject if local.start throws an error', () => {
        const service = new BrowserstackLauncher();
        Browserstack.Local.mockImplementationOnce( function () {
            this.start = jest.fn().mockImplementationOnce((options, cb) => cb(error));
        });

        return expect(service.onPrepare(config, caps)).rejects.toEqual(error)
            .then(() => expect(service.browserstackLocal.start).toHaveBeenCalled());
    });

    it('should successfully resolve if local.start is successful', () => {
        const service = new BrowserstackLauncher();

        return expect(service.onPrepare(config, caps)).resolves.toEqual(undefined)
            .then(() => expect(service.browserstackLocal.start).toHaveBeenCalled());
    });
});

describe('onComplete', () => {
    let service;
    beforeAll(() => {
        service = new BrowserstackLauncher();
        service.browserstackLocal = new Browserstack.Local();
    });

    it('should do nothing if browserstack local is not turned on', () => {
        const noService = new BrowserstackLauncher();
        noService.browserstackLocal = undefined;
        return expect(noService.onComplete(null, {})).resolves.toEqual('Browserstack Local is not running!');
    });

    it('should do nothing if browserstack local is turned on, but not running', () => {
        service.browserstackLocal.isRunning.mockImplementationOnce( () => false);
        return expect(service.onComplete(null, {})).resolves.toEqual('Browserstack Local is not running!');
    });


    it('should kill the process if browserstackLocalForcedStop is true', () => {
        const killSpy = jest.spyOn(process, 'kill').mockImplementationOnce((pid) => pid);
        service.browserstackLocal.pid = 102;
        return expect(service.onComplete(null,{ browserstackLocalForcedStop: true })).resolves.toEqual(102)
            .then(() => {
                expect(killSpy).toHaveBeenCalled();
                expect(service.browserstackLocal.stop).not.toHaveBeenCalled();
            });
    });

    it('should reject with an error, if local.stop throws an error', () => {
        service.browserstackLocal.stop.mockImplementationOnce( (cb) => cb(error) );
        return expect(service.onComplete(null,{})).rejects.toEqual(error)
            .then(() => expect(service.browserstackLocal.stop).toHaveBeenCalled());
    });

    it('should properly resolve if everything works', () => {
        return expect(service.onComplete(null,{})).resolves.toBe(undefined)
            .then(() => expect(service.browserstackLocal.stop).toHaveBeenCalled());

    })
});
