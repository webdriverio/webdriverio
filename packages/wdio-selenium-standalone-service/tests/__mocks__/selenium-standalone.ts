export = {
    install : jest.fn(() => new Promise<void>((resolve) => resolve())),

    start : jest.fn(() => new Promise((resolve) => resolve({
        kill : jest.fn(),
        stdout : { pipe: jest.fn().mockReturnValue({ pipe : jest.fn() }) },
        stderr : { pipe: jest.fn().mockReturnValue({ pipe : jest.fn() }) }
    })))
}
