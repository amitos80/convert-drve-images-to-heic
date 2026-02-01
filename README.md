# Google Drive Organizer

This script organizes files in your Google Drive by moving them into folders based on keywords in their names.

## Features

- Categorizes files based on a predefined keyword map.
- Moves files into corresponding folders.
- Creates folders if they don't exist.
- Dry run mode to preview changes without moving files.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/drive-organizer.git
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```

## Authentication

The first time you run the script, it will open a browser window to authenticate with your Google account. After successful authentication, it will save a `token.json` file for future use.

## Hierarchical File Organization

This script can automatically sort your files into a nested folder structure based on a powerful, customizable rule engine. For example, it can take a file named `2023-01-15-electricity-bill.pdf` and automatically move it to a folder path like `Finance/Bills/Electricity/2023`.

### Usage

To run the organization script:
```bash
node src/index.js
```

It is **highly recommended** to perform a dry run first to preview the changes without actually moving any files. Use the `--dry-run` flag to do this:
```bash
node src/index.js --dry-run
```

### Configuration

The sorting logic is controlled by the `categorization_rules.json` file in the root of the project. You can add, remove, or modify rules in this file to customize the organization to your needs.

Each rule is an object with the following properties:

- `name`: A human-readable name for the rule (e.g., "Electricity Bill").
- `keywords`: An array of keywords to look for in the filename. This is case-insensitive and supports multiple languages (including Hebrew).
- `targetPath`: A template for the destination folder path. You can define a nested structure here (e.g., `Finance/Bills/Electricity`).
- `dynamicVariables` (Optional): An object that defines how to extract dynamic parts from the filename to create folders on the fly.

#### Dynamic Variables

You can make your `targetPath` dynamic by adding placeholders like `{year}` or `{month}`. You then define how to find these values in the `dynamicVariables` object using a regular expression.

- The key (e.g., `"year"`) must match the placeholder in the `targetPath`.
- The `regex` value should be a regular expression with at least one capturing group. The first capturing group will be used as the value for the placeholder.

#### Example Rule:

This rule will find any file with "electricity bill" or "חשבון חשמל" in its name, find the four-digit year in the filename, and move it to a corresponding year-based folder.

```json
{
  "name": "Electricity Bill",
  "keywords": ["electricity bill", "חשבון חשמל"],
  "targetPath": "Finance/Bills/Electricity/{year}",
  "dynamicVariables": {
    "year": {
      "regex": "(\\d{4})"
    }
  }
}
```

## Duplicate File Deletion

This script identifies and moves duplicate files in your Google Drive to the trash, helping you reclaim storage space.

**Important Safety Notes:**
*   **Backup Your Data:** Before running this script, especially in non-dry-run mode, it is *highly recommended* to back up your critical Google Drive data.
*   **Files are Moved to Trash:** This script moves duplicate files to your Google Drive trash. It does *not* permanently delete them. You will need to manually empty your Google Drive trash to permanently delete the files and reclaim space. This provides a safety net for review.
*   **Original File Preservation:** For each group of duplicates, the script is designed to keep one file (the first one encountered in the report) and move the rest to trash.

### Usage

To run the duplicate file deletion script:

```bash
node src/deleteDuplicates.js
```

### Dry Run Mode

By default, the script runs in **dry run mode**. In this mode, it will log all actions it *would* take (i.e., which files it *would* move to trash) without actually making any changes to your Google Drive. This allows you to review the planned deletions.

To disable dry run mode and actually move files to trash, you need to modify the `DRY_RUN` constant at the top of `src/deleteDuplicates.js` from `true` to `false`.

### Resuming Interrupted Deletions

The script automatically tracks its progress. If the script is interrupted (e.g., due to network issues or user abortion), you can simply re-run it. It will read `deletion_progress.log` and continue from where it left off, skipping any files already processed.

### Log Files

*   `deletion_execution.log`: This file contains a detailed, timestamped log of all actions taken by the script, including files processed, files moved to trash, and any errors encountered. This log is always appended to.
*   `deletion_progress.log`: This file stores the IDs of files that have been successfully moved to trash. It is used by the script to resume operations and avoid reprocessing files.

