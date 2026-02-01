const { authorize } = require('./auth');
const { listFiles } = require('./drive');
const fs = require('fs').promises;
const crypto = require('crypto');
const { Readable } = require('stream');
const { google } = require('googleapis');

// Helper function to download file content
async function downloadFile(authClient, fileId) {
    const drive = google.drive({ version: 'v3', auth: authClient });
    const res = await drive.files.get(
        { fileId: fileId, alt: 'media' },
        { responseType: 'stream' }
    );
    return res.data;
}

// Helper function to calculate SHA256 hash of a stream
function calculateSha256Hash(stream) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        stream.on('data', chunk => hash.update(chunk));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', reject);
    });
}

async function main() {
    try {
        const authClient = await authorize();
        const filesBySize = new Map();
        let totalFilesProcessed = 0;
        const startTime = Date.now();

        console.log('Starting to group files by size...');

        // Group files by size
        for await (const file of listFiles(authClient)) {
            totalFilesProcessed++;
            if (file.size !== undefined) {
                if (!filesBySize.has(file.size)) {
                    filesBySize.set(file.size, []);
                }
                filesBySize.get(file.size).push(file);
            }
        }

        console.log(`Finished grouping files by size. Total files processed: ${totalFilesProcessed}`);
        console.log('Starting to find duplicates by content hash...');

        const duplicatesByHash = new Map();
        let filesHashed = 0;
        let potentialDuplicatesCount = 0;

        for (const [size, files] of filesBySize.entries()) {
            if (files.length > 1) { // Only consider groups with more than one file
                potentialDuplicatesCount += files.length;
                console.log(`Processing ${files.length} files of size ${size} bytes...`);
                for (const file of files) {
                    try {
                        const fileStream = await downloadFile(authClient, file.id);
                        const hash = await calculateSha256Hash(fileStream);
                        filesHashed++;

                        if (!duplicatesByHash.has(hash)) {
                            duplicatesByHash.set(hash, []);
                        }
                        duplicatesByHash.get(hash).push(file);
                    } catch (downloadError) {
                        console.error(`Error downloading or hashing file ${file.name} (${file.id}):`, downloadError.message);
                    }
                }
            }
        }

        console.log(`Finished hashing files. Total files hashed: ${filesHashed}`);
        console.log(`Total potential duplicates (same size) processed: ${potentialDuplicatesCount}`);

        let duplicateGroupsFound = 0;
        let totalDuplicateFiles = 0;

        const duplicateReport = [];

        for (const [hash, files] of duplicatesByHash.entries()) {
            if (files.length > 1) {
                duplicateGroupsFound++;
                totalDuplicateFiles += files.length;
                
                const duplicateGroup = files.map(file => ({
                    path: file.path,
                    name: file.name,
                    id: file.id,
                    size: file.size
                }));
                duplicateReport.push(duplicateGroup);
            }
        }

        if (duplicateGroupsFound > 0) {
            console.log(`
Found ${duplicateGroupsFound} groups of duplicate files, totaling ${totalDuplicateFiles} duplicate files.`);
            await fs.writeFile('duplicates.json', JSON.stringify(duplicateReport, null, 2));
            console.log('Duplicate report written to duplicates.json');
        } else {
            console.log(`
No duplicate files found by content.`);
        }

        const totalTime = (Date.now() - startTime) / 1000; // in seconds
        console.log(`Total time taken: ${Math.round(totalTime / 60)} minutes`);

    } catch (error) {
        console.error('An error occurred:', error);
    }
}

main();
