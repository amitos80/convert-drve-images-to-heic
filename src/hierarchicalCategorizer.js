/**
 * Determines the target path for a file based on a set of categorization rules.
 *
 * @param {object} file - The file object from the Google Drive API. Must have a 'name' property.
 * @param {Array<object>} rules - An array of categorization rules from `categorization_rules.json`.
 * @returns {string|null} The resolved target path (e.g., "Finance/Bills/Electricity/2023") or null if no rule matches.
 */
function determineTargetPath(file, rules) {
    for (const rule of rules) {
        // Check if any keyword matches the file name
        const lowerCaseFilename = file.name.toLowerCase();
        const hasMatchingKeyword = rule.keywords.some(keyword => lowerCaseFilename.includes(keyword.toLowerCase()));

        if (hasMatchingKeyword) {
            let targetPath = rule.targetPath;
            let allVariablesFound = true;

            // If the path has dynamic variables, resolve them
            if (rule.dynamicVariables) {
                for (const varName in rule.dynamicVariables) {
                    const variable = rule.dynamicVariables[varName];
                    const regex = new RegExp(variable.regex);
                    const match = file.name.match(regex);

                    if (match && match[1]) {
                        targetPath = targetPath.replace(`{${varName}}`, match[1]);
                    } else {
                        allVariablesFound = false;
                        break; // A required variable was not found in the filename
                    }
                }
            }

            if (allVariablesFound) {
                return targetPath;
            }
        }
    }

    return null; // No matching rule found
}

module.exports = { determineTargetPath };
