jest.mock('../src/auth', () => ({
    authorize: jest.fn(),
}));

jest.mock('../src/drive', () => ({
    listFiles: jest.fn(),
    getFolderId: jest.fn(),
    moveFile: jest.fn(),
}));

const main = require('../src/index');

describe('main', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should perform a dry run when --dry-run flag is provided', async () => {
        process.argv.push('--dry-run');
        const auth = require('../src/auth');
        const drive = require('../src/drive');
        auth.authorize.mockResolvedValue({});
        drive.listFiles.mockResolvedValue([{ id: '1', name: 'utility_bill.pdf' }]);
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        await main();

        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('DRY RUN'));
        expect(drive.moveFile).not.toHaveBeenCalled();
        consoleSpy.mockRestore();
        process.argv.pop();
    });

    test('should move files when --dry-run flag is not provided', async () => {
        const auth = require('../src/auth');
        const drive = require('../src/drive');
        auth.authorize.mockResolvedValue({});
        drive.listFiles.mockResolvedValue([{ id: '1', name: 'utility_bill.pdf' }]);
        drive.getFolderId.mockResolvedValue('folder-id');
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        await main();

        expect(drive.getFolderId).toHaveBeenCalledWith({}, 'Utility Bills');
        expect(drive.moveFile).toHaveBeenCalledWith({}, '1', 'folder-id');
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Moved'));
        consoleSpy.mockRestore();
    });
});
