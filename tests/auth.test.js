const { authorize } = require('../src/auth');
const fs = require('fs').promises;

jest.mock('fs', () => ({
    promises: {
        readFile: jest.fn().mockImplementation((path) => {
            if (path.includes('credentials.json')) {
                return Promise.resolve(JSON.stringify({
                    installed: {
                        client_id: 'test_client_id',
                        client_secret: 'test_client_secret'
                    }
                }));
            }
            return Promise.resolve(JSON.stringify({}));
        }),
        writeFile: jest.fn().mockResolvedValue(),
    },
}));

jest.mock('googleapis', () => {
    class MockOAuth2Client {
        constructor() {
            this.setCredentials = jest.fn();
        }
    }
    return {
        google: {
            auth: {
                fromJSON: jest.fn(() => new MockOAuth2Client()),
            },
        },
    };
});

jest.mock('@google-cloud/local-auth', () => ({
    authenticate: jest.fn(() => ({
        credentials: { refresh_token: 'mock_refresh_token' },
    })),
}));

describe('authorize', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should load saved credentials if they exist', async () => {
        await authorize();
        expect(fs.readFile).toHaveBeenCalledWith(expect.stringContaining('token.json'));
    });

    test('should authenticate if no saved credentials exist', async () => {
        jest.spyOn(fs, 'readFile').mockRejectedValueOnce(new Error('File not found'));
        await authorize();
        expect(fs.writeFile).toHaveBeenCalled();
    });
});
