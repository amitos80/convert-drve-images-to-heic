const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const { authorize } = require('./auth'); // Import the authorize function

// Phase 1: Setup and Configuration

// Configuration Constants
const DUPLICATE_REPORT_PATH = path.join(__dirname, '..', 'duplicates.json');
const PROGRESS_LOG_PATH = path.join(__dirname, '..', 'deletion_progress.log');
const EXECUTION_LOG_PATH = path.join(__dirname, '..', 'deletion_execution.log');
const DRY_RUN = true; // Set to true for a dry run, false to actually move files to trash

// Phase 2: Script Initialization

// 2.1 Read Progress
let processedFileIds = new Set();
if (fs.existsSync(PROGRESS_LOG_PATH)) {
    const content = fs.readFileSync(PROGRESS_LOG_PATH, 'utf8');
    content.split('\n').forEach(id => {
        if (id.trim()) {
            processedFileIds.add(id.trim());
        }
    });
    console.log(`Loaded ${processedFileIds.size} processed file IDs from ${PROGRESS_LOG_PATH}`);
}

// 2.2 Setup Logging
function log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}\n`;
    fs.appendFileSync(EXECUTION_LOG_PATH, logMessage, 'utf8');
    console.log(`[${level}] ${message}`);
}

log('Script started.');
if (DRY_RUN) {
    log('DRY RUN mode is ENABLED. No files will be moved to trash.');
} else {
    log('DRY RUN mode is DISABLED. Files will be moved to trash.');
}

/**
 * Moves a file to the trash in Google Drive.
 * @param {OAuth2Client} authClient The authorized OAuth2 client.
 * @param {string} fileId The ID of the file to trash.
 * @param {string} fileName The name of the file (for logging).
 */
async function trashFile(authClient, fileId, fileName) {
    const drive = google.drive({ version: 'v3', auth: authClient });
    try {
        await drive.files.update({
            fileId: fileId,
            resource: {
                trashed: true,
            },
            fields: 'id, trashed',
        });
        log(`SUCCESS: Moved to trash: ${fileName} (ID: ${fileId})`);
        fs.appendFileSync(PROGRESS_LOG_PATH, `${fileId}\n`, 'utf8');
        return true;
    } catch (error) {
        log(`ERROR: Failed to trash file: ${fileName} (ID: ${fileId}). Reason: ${error.message}`, 'ERROR');
        return false;
    }
}

async function main() {
    const authClient = await authorize();
    log('Google Drive API authorized.');

    // Phase 3: Core Deletion Logic

    // 3.1 Parse the Report
    const reportContent = fs.readFileSync(DUPLICATE_REPORT_PATH, 'utf8');
    const duplicateGroups = JSON.parse(reportContent);

    let filesMovedToTrash = 0;
    let filesSkipped = 0;
    let filesFailed = 0;

    for (const group of duplicateGroups) {
        if (group.length < 2) { // Need at least one original and one duplicate
            continue;
        }

        // The first file in the group is the original
        const originalFile = group[0];
        log(`INFO: Keeping original file: ${originalFile.name} (ID: ${originalFile.id})`);

        // Process duplicates
        for (let i = 1; i < group.length; i++) {
            const duplicateFile = group[i];

            if (processedFileIds.has(duplicateFile.id)) {
                log(`INFO: Skipping already processed file: ${duplicateFile.name} (ID: ${duplicateFile.id})`);
                filesSkipped++;
                continue;
            }

            log(`INFO: Preparing to trash duplicate file: ${duplicateFile.name} (ID: ${duplicateFile.id})`);

            if (DRY_RUN) {
                log(`DRY RUN: Would move file to trash: ${duplicateFile.name} (ID: ${duplicateFile.id})`);
                filesMovedToTrash++; // Count as moved for dry run summary
            } else {
                const success = await trashFile(authClient, duplicateFile.id, duplicateFile.name);
                if (success) {
                    filesMovedToTrash++;
                }
                else {
                    filesFailed++;
                }
            }
        }
    }

    log(`Process complete. Summary: ${filesMovedToTrash} files moved to trash (or would be in DRY RUN), ${filesFailed} files failed, ${filesSkipped} files skipped.`);
    log('Script finished.');
}

main().catch(error => {
    log(`FATAL ERROR: ${error.message}`, 'ERROR');
    console.error(error);
    process.exit(1);
});

