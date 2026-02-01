const { google } = require('googleapis');
const path = require('path');

/**
 * Retrieves the ID of a folder by name, creating it if it doesn't exist.
 * @param {OAuth2Client} authClient An authorized OAuth2 client.
 * @param {string} folderName The name of the folder.
 * @returns {Promise<string>} The ID of the folder.
 */
async function getFolderId(authClient, folderName) {
    const drive = google.drive({ version: 'v3', auth: authClient });
    const res = await drive.files.list({
        q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
        fields: 'files(id)',
    });

    if (res.data.files.length > 0) {
        return res.data.files[0].id;
    } else {
        const fileMetadata = {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
        };
        const folder = await drive.files.create({
            resource: fileMetadata,
            fields: 'id',
        });
        return folder.data.id;
    }
}

/**
 * Moves a file to a new parent folder.
 * @param {OAuth2Client} authClient An authorized OAuth2 client.
 * @param {string} fileId The ID of the file to move.
 * @param {string} folderId The ID of the new parent folder.
 */
async function moveFile(authClient, fileId, folderId) {
    const drive = google.drive({ version: 'v3', auth: authClient });
    await drive.files.update({
        fileId: fileId,
        addParents: folderId,
        removeParents: 'root',
        fields: 'id, parents',
    });
}

/**
 * Recursively lists all files in the user's Google Drive using an async generator.
 * @param {OAuth2Client} authClient An authorized OAuth2 client.
 * @yields {object} A file object.
 */
async function* listFiles(authClient) {
  const drive = google.drive({version: 'v3', auth: authClient});

  async function* getFiles(folderId, currentPath) {
    let pageToken = null;
    do {
      const res = await drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'nextPageToken, files(id, name, mimeType, size)',
        pageToken: pageToken,
        pageSize: 1000,
      });

      for (const file of res.data.files) {
        const newPath = path.posix.join(currentPath, file.name);
        if (file.mimeType === 'application/vnd.google-apps.folder') {
          yield* getFiles(file.id, newPath);
        } else {
          yield { ...file, path: newPath };
        }
      }
      pageToken = res.data.nextPageToken;
    } while (pageToken);
  }

  yield* getFiles('root', '/');
}

/**
 * Gets the ID of a nested folder by path, creating it if it doesn't exist.
 * @param {OAuth2Client} authClient An authorized OAuth2 client.
 * @param {string} nestedPath The nested path of the folder (e.g., "Finance/Bills/Electricity").
 * @returns {Promise<string>} The ID of the final folder in the path.
 */
async function getOrCreateNestedFolder(authClient, nestedPath) {
    const drive = google.drive({ version: 'v3', auth: authClient });
    const parts = nestedPath.split('/');
    let parentId = 'root';

    for (const part of parts) {
        const res = await drive.files.list({
            q: `mimeType='application/vnd.google-apps.folder' and name='${part}' and '${parentId}' in parents and trashed=false`,
            fields: 'files(id)',
            pageSize: 1,
        });

        if (res.data.files.length > 0) {
            parentId = res.data.files[0].id;
        } else {
            const fileMetadata = {
                name: part,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [parentId],
            };
            const folder = await drive.files.create({
                resource: fileMetadata,
                fields: 'id',
            });
            parentId = folder.data.id;
        }
    }
    return parentId;
}

/**
 * Lists all folders in the user's Google Drive.
 * @param {OAuth2Client} authClient An authorized OAuth2 client.
 * @yields {object} A folder object.
 */
async function* listAllFolders(authClient) {
    const drive = google.drive({ version: 'v3', auth: authClient });
    let pageToken = null;
    do {
        const res = await drive.files.list({
            q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
            fields: 'nextPageToken, files(id, name, parents)',
            pageToken: pageToken,
            pageSize: 1000,
        });
        for (const folder of res.data.files) {
            yield folder;
        }
        pageToken = res.data.nextPageToken;
    } while (pageToken);
}

/**
 * Retrieves the contents of a specific folder.
 * @param {OAuth2Client} authClient An authorized OAuth2 client.
 * @param {string} folderId The ID of the folder.
 * @returns {Promise<Array<object>>} A list of file and folder objects within the specified folder.
 */
async function getFolderContents(authClient, folderId) {
    const drive = google.drive({ version: 'v3', auth: authClient });
    const res = await drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id, name, mimeType)',
    });
    return res.data.files;
}

module.exports = { listFiles, getFolderId, moveFile, getOrCreateNestedFolder, listAllFolders, getFolderContents };
