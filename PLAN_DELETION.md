### Analysis and Key Considerations

Before detailing the steps, here are the core principles and additional considerations that shape the plan:

1.  **Safety is the #1 Priority:** Your data is important. The plan is designed to prevent accidental deletion of original files. The primary safety mechanism is to **move duplicates to the Google Drive trash** instead of deleting them permanently. This gives you a final chance to review and recover any file if needed.
2.  **Resumability and Interruption:** The process must be able to stop (due to user abortion, network issues, or errors) and restart from exactly where it left off. This will be achieved by creating a "progress file" that logs every single file that is successfully trashed. On startup, the script will read this file and skip any files it has already processed.
3.  **Clear, Appended Logging:** A separate, human-readable log file will record every action the script takes—what it's about to do, what it succeeded in doing, and any errors it encountered. This log will always be appended to, creating a complete history of all executions.
4.  **Identifying the "Original":** Within each group of duplicates listed in your `duplicate_files_report.txt`, we need a consistent rule to determine which file to keep. The safest and simplest rule is to **designate the first file listed in each group as the original** and target all others for deletion.
5.  **Dry Run Mode:** Before you commit to deleting anything, you should be able to see exactly what the script *would* do. The plan includes a "dry run" mode that simulates the entire process, writing to the log file what would be deleted without actually deleting anything.

### Additional Advice & Considerations

*   **Backups:** Before running any automated file deletion script for the first time, it is *highly recommended* to have a separate backup of your most critical data. This is the ultimate safety net.
*   **API Rate Limits & Errors:** The script will be making many requests to the Google Drive API, which has usage limits. The plan must include logic to handle these limits gracefully (e.g., waiting and retrying the request) to avoid failures.
*   **File Permissions:** The script might encounter files it doesn't have permission to delete (e.g., files owned by someone else but shared with you). It should handle these cases by logging the issue and skipping the file.
*   **Emptying the Trash:** This process will not immediately free up storage space; it only moves files to the trash. You will need to manually go into Google Drive and empty the trash to reclaim the space. This is an intentional, final manual checkpoint for you.

---

### The Plan for `deleteDuplicates.js`

Here is the step-by-step implementation plan.

**Phase 1: Setup and Configuration**

1.  **Create the Script File:** Create a new file named `src/deleteDuplicates.js`.
2.  **Configuration:** At the top of the script, define constants for configuration:
    *   `DUPLICATE_REPORT_PATH`: Path to `duplicate_files_report.txt`.
    *   `PROGRESS_LOG_PATH`: Path to a new state-tracking file, e.g., `deletion_progress.log`. This file will only contain the IDs of successfully trashed files.
    *   `EXECUTION_LOG_PATH`: Path to the human-readable log file, e.g., `deletion_execution.log`.
    *   `DRY_RUN`: A boolean flag (e.g., `true` or `false`), which could be controlled by a command-line argument, to determine if the script should run in simulation mode.

**Phase 2: Script Initialization**

1.  **Read Progress:** When the script starts, it must first read all file IDs from `deletion_progress.log` (if it exists) into a JavaScript `Set` for fast lookups. This `Set` will represent all the files that have already been dealt with.
2.  **Setup Logging:** Configure a simple logging function that appends a timestamped message to `EXECUTION_LOG_PATH`.

**Phase 3: Core Deletion Logic**

1.  **Parse the Report:** Read and parse the `duplicate_files_report.txt` file. The script should process the file group by group. A group of duplicates is assumed to be a block of text separated by a dividing line like `--------------------`.
2.  **Iterate Through Groups:** For each group of duplicates:
    a. Identify the first file in the group as the "original" and log it: `INFO: Keeping original file: [FileName] (ID: [FileID])`.
    b. For every other file in the group (the duplicates):
        i. **Check Progress:** Check if the file's ID is already in the progress `Set` from step 2.1. If it is, log `INFO: Skipping already processed file: [FileName]` and move to the next file.
        ii. **Log Intent:** Log the action you are about to take: `INFO: Preparing to trash duplicate file: [FileName] (ID: [FileID])`.
        iii. **Execute or Simulate:**
            *   **If `DRY_RUN` is `true`:** Log `DRY RUN: Would move file to trash: [FileName]`. Do not make any API calls.
            *   **If `DRY_RUN` is `false`:**
                1.  Make a Google Drive API call to update the file's metadata, setting `trashed: true`.
                2.  **Handle API Response:**
                    *   **On Success:** Log `SUCCESS: Moved to trash: [FileName]`. Then, immediately append the file's ID to `deletion_progress.log`. This is the critical step that ensures resumability.
                    *   **On Failure:** Log `ERROR: Failed to trash file: [FileName]. Reason: [Error from API]`. Do *not* add the ID to the progress log. The script will retry this file on the next run. Include logic to handle specific errors like rate limits (wait and retry) vs. permission errors (log and skip).

**Phase 4: Finalization and User Guidance**

1.  **Completion Message:** After iterating through all groups, log a final summary message: `INFO: Process complete. Summary: [X] files moved to trash, [Y] files failed, [Z] already processed.`.
2.  **Update Documentation:** Update the `README.md` to include instructions for this new, powerful script. Explain the dry run vs. real run, the purpose of the log files, and the safety warnings mentioned above.