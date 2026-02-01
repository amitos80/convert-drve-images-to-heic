const fs = require('fs').promises;
const path = require('path');
const { authorize } = require('./auth');
const { listFiles, getOrCreateNestedFolder, moveFile, listAllFolders, getFolderContents } = require('./drive');
const { determineTargetPath } = require('./hierarchicalCategorizer');

const RULES_PATH = path.join(__dirname, '..', 'categorization_rules.json');
const PHOTO_DESTINATION_PATH = 'Personal/Photos';

const IMAGE_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/bmp'
]);

/**
 * The main function to organize Google Drive files.
 */
async function main() {
    try {
        const isDryRun = process.argv.includes('--dry-run');
        const authClient = await authorize();

        const processedFileIds = new Set();

        // --- Phase 1: Photo Folder Sorting ---
        console.log(isDryRun ? '\n--- Dry Run: Phase 1 - Photo Folder Sorting ---' : '\n--- Starting Phase 1 - Photo Folder Sorting ---');
        const photoDestinationFolderId = await getOrCreateNestedFolder(authClient, PHOTO_DESTINATION_PATH);
        const allFolders = listAllFolders(authClient);

        for await (const folder of allFolders) {
            const contents = await getFolderContents(authClient, folder.id);
            if (contents.length === 0) {
                continue; // Skip empty folders
            }

            const hasSubfolders = contents.some(item => item.mimeType === 'application/vnd.google-apps.folder');
            if (hasSubfolders) {
                continue; // Skip folders with subfolders
            }

            const allFilesAreImages = contents.every(item => IMAGE_MIME_TYPES.has(item.mimeType));

            if (allFilesAreImages) {
                if (isDryRun) {
                    console.log(`DRY RUN: Would move folder '${folder.name}' to '${PHOTO_DESTINATION_PATH}'`);
                } else {
                    try {
                        await moveFile(authClient, folder.id, photoDestinationFolderId);
                        console.log(`Moved photo folder '${folder.name}' to '${PHOTO_DESTINATION_PATH}'`);
                    } catch (error) {
                        console.error(`Error moving photo folder '${folder.name}': ${error.message}`);
                    }
                }
                // Add file IDs to set to prevent re-processing in phase 2
                contents.forEach(file => processedFileIds.add(file.id));
            }
        }
        console.log('--- Phase 1 Complete ---');


        // --- Phase 2: Rule-Based File Sorting ---
        const rulesContent = await fs.readFile(RULES_PATH, 'utf8');
        const rules = JSON.parse(rulesContent);
        console.log('\nSuccessfully loaded categorization rules.');
        console.log(isDryRun ? '\n--- Dry Run: Phase 2 - Rule-Based File Sorting ---' : '\n--- Starting Phase 2 - Rule-Based File Sorting ---');

        const filesGenerator = listFiles(authClient);

        for await (const file of filesGenerator) {
            if (file.mimeType === 'application/vnd.google-apps.folder' || processedFileIds.has(file.id)) {
                continue; // Skip folders and already processed photo files
            }

            const targetPath = determineTargetPath(file, rules);

            if (targetPath) {
                if (isDryRun) {
                    console.log(`DRY RUN: Would move file '${file.path}' to '${targetPath}'`);
                } else {
                    try {
                        const destinationFolderId = await getOrCreateNestedFolder(authClient, targetPath);
                        await moveFile(authClient, file.id, destinationFolderId);
                        console.log(`Moved file '${file.path}' to '${targetPath}'`);
                    } catch (error) {
                        console.error(`Error processing file '${file.path}': ${error.message}`);
                    }
                }
            }
        }

        console.log('\nFile organization process complete.');

    } catch (error) {
        console.error('Fatal Error:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = main;
