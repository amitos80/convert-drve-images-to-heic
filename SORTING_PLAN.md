# Plan: Comprehensive Google Drive Sorting

This document outlines a strategic plan to sort all files and folders within a Google Drive account based on the existing `categorization_rules.json` and the project's codebase.

### **Phase 1: Pre-computation and Safety**

1.  **Implement a "Super Dry Run" Mode:**
    *   **Objective:** Before any operations (read or write) are performed, create a preliminary report of all proposed changes.
    *   **Action:** Introduce a `--super-dry-run` flag. When active, the script will:
        1.  Recursively list all files and folders.
        2.  For each item, determine its target destination based on the categorization rules.
        3.  Generate a `PRELIMINARY_SORT_REPORT.md` file detailing every planned move (e.g., `MOVE '/folder/file.txt' TO '/Finance/Statements/2023/'`).
        4.  This mode will perform **no write operations**, including folder creation checks.

### **Phase 2: Enhanced Categorization Logic**

1.  **Refine `hierarchicalCategorizer.js`:**
    *   **Objective:** Improve the accuracy and flexibility of the categorization engine.
    *   **Actions:**
        1.  **Add Hebrew Keywords:** Update `categorization_rules.json` to replace `"HEBREW_NEEDED"` placeholders with actual Hebrew translations for financial and work-related terms.
        2.  **Introduce Negative Keywords:** Modify the `determineTargetPath` function to support a `negativeKeywords` array in rules. If a filename matches a negative keyword, that rule is skipped. This prevents incorrect classifications (e.g., a file named `"project_invoice.pdf"` shouldn't be categorized under `"Work/Documents"` if `"invoice"` is a negative keyword for that rule).
        3.  **Prioritize Rules:** Implement a `priority` field in the rules. The categorizer will evaluate rules in ascending order of priority, ensuring that more specific rules are checked before general ones.

### **Phase 3: Folder and File Sorting Strategy**

1.  **Develop a Two-Pass Sorting Approach in `index.js`:**
    *   **Objective:** Efficiently sort both folders and files without conflicts.
    *   **Pass 1: Folder Sorting:**
        1.  Iterate through all folders using `listAllFolders`.
        2.  For each folder, check if all its contents are image files.
        3.  If so, move the entire folder to the `Personal/Photos` directory. This leverages the existing photo sorting logic but enhances it to be the first step.
    *   **Pass 2: File Sorting:**
        1.  Use the `listFiles` generator to iterate through all files.
        2.  For each file, use the enhanced `determineTargetPath` to find its destination.
        3.  If a target path is found, use `getOrCreateNestedFolder` to ensure the destination exists, and then `moveFile` to move the file.

### **Phase 4: Execution and Logging**

1.  **Enhance `index.js` for Robust Execution:**
    *   **Objective:** Provide clear feedback and ensure the process is safe and transparent.
    *   **Actions:**
        1.  **Detailed Logging:** Implement more descriptive logging for each action, clearly distinguishing between "dry run" and "live" operations.
        2.  **Error Handling:** Add robust `try...catch` blocks for all API calls (`moveFile`, `getOrCreateNestedFolder`) to prevent the script from crashing on single-file errors. Log errors to a `SORTING_ERRORS.log` file.
        3.  **Progress Tracking:** Introduce a `SORTING_PROGRESS.log` file to record the IDs of successfully moved items. On subsequent runs, the script will skip these items, making the process resumable.

This plan provides a structured and safe approach to achieving a comprehensive sort of the user's Google Drive.
