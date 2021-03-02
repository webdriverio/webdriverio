export default {
    renderFile: jest.fn().mockImplementation((...args) => args.pop()())
}
