const { listFiles, getFolderId, moveFile } = require('../src/drive');
const { google } = require('googleapis');

jest.mock('googleapis');

describe('drive.js', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('listFiles', () => {
        test('should return a list of files', async () => {
            const mockFiles = [{ id: '1', name: 'test.txt' }];
            google.drive.mockReturnValue({
                files: {
                    list: jest.fn().mockResolvedValue({ data: { files: mockFiles } }),
                },
            });

            const files = await listFiles({});
            expect(files).toEqual(mockFiles);
        });

        test('should return an empty array when no files are found', async () => {
            google.drive.mockReturnValue({
                files: {
                    list: jest.fn().mockResolvedValue({ data: { files: [] } }),
                },
            });

            const files = await listFiles({});
            expect(files).toEqual([]);
        });
    });

    describe('getFolderId', () => {
        test('should return the ID of an existing folder', async () => {
            const mockFolderId = 'folder-id';
            google.drive.mockReturnValue({
                files: {
                    list: jest.fn().mockResolvedValue({ data: { files: [{ id: mockFolderId }] } }),
                    create: jest.fn(),
                },
            });

            const folderId = await getFolderId({}, 'test-folder');
            expect(folderId).toBe(mockFolderId);
            expect(google.drive().files.create).not.toHaveBeenCalled();
        });

        test('should create a new folder if it does not exist', async () => {
            const mockFolderId = 'new-folder-id';
            google.drive.mockReturnValue({
                files: {
                    list: jest.fn().mockResolvedValue({ data: { files: [] } }),
                    create: jest.fn().mockResolvedValue({ data: { id: mockFolderId } }),
                },
            });

            const folderId = await getFolderId({}, 'test-folder');
            expect(folderId).toBe(mockFolderId);
            expect(google.drive().files.create).toHaveBeenCalled();
        });
    });

    describe('moveFile', () => {
        test('should move a file to a new folder', async () => {
            const updateFn = jest.fn().mockResolvedValue({});
            google.drive.mockReturnValue({
                files: {
                    update: updateFn,
                },
            });

            await moveFile({}, 'file-id', 'folder-id');
            expect(updateFn).toHaveBeenCalledWith({
                fileId: 'file-id',
                addParents: 'folder-id',
                removeParents: 'root',
                fields: 'id, parents',
            });
        });
    });
});
