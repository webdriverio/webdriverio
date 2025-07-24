export default {
    someScript: (param: string) => {
        function foo() {
            return param
        }

        return 'Hello World! ' + foo()
    },
    someAsyncScript: (param: string, cb: (res: string) => void) => {
        function foo() {
            return param
        }

        setTimeout(() => {
            cb('Hello World! ' + foo())
        }, 1000)
    }
}
