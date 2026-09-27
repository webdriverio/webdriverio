export default {
    someScript: (param: string) => {
        function foo() {
            return param
        }

        return 'Hello World! ' + foo()
    },
    someAsyncScript: async (param: string) => {
        function foo() {
            return param
        }

        await new Promise((resolve) => setTimeout(resolve, 10))
        return 'Hello World! ' + foo()
    }
}
