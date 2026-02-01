const { authorize } = require('./auth');
const { listFiles } = require('./drive');
const fs = require('fs').promises;

/**
 * Main function to authorize, list all files with progress, and write them to a file.
 */
async function main() {
  try {
    const authClient = await authorize();
    
    const startTime = Date.now();
    let fileCount = 0;
    const allFilePaths = [];

    const progressInterval = setInterval(() => {
      const elapsedTime = (Date.now() - startTime) / 1000; // in seconds
      console.log(`Files processed: ${fileCount}, Time elapsed: ${Math.round(elapsedTime / 60)} minutes`);
    }, 300000); // 5 minutes

    console.log('Starting to list all files from Google Drive...');

    for await (const file of listFiles(authClient)) {
      fileCount++;
      allFilePaths.push(file.path);
    }

    clearInterval(progressInterval);

    if (fileCount === 0) {
      console.log('No files found in your Google Drive.');
      return;
    }

    let fileList = 'Files in your Google Drive:\n\n';
    allFilePaths.forEach(filePath => {
      fileList += `${filePath}\n`;
    });

    await fs.writeFile('all_files.txt', fileList);
    
    const totalTime = (Date.now() - startTime) / 1000; // in seconds
    console.log(`
Finished listing files.
Total files found: ${fileCount}
Total time taken: ${Math.round(totalTime / 60)} minutes

Successfully wrote the list of all files to all_files.txt
`);

  } catch (error) {
    console.error('Error listing files:', error);
  }
}

main();
