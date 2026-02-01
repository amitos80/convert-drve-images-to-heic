const { categorizeFile } = require('../src/categorizer');

describe('categorizeFile', () => {
    test('should return the correct category for a given keyword', () => {
        expect(categorizeFile('utility_bill.pdf')).toBe('Utility Bills');
        expect(categorizeFile('tax_document.docx')).toBe('Taxes');
        expect(categorizeFile('receipt-2023.jpg')).toBe('Receipts');
    });

    test('should return the default category if no keyword is matched', () => {
        expect(categorizeFile('my_document.pdf')).toBe('General Personal Docs');
    });

    test('should be case-insensitive', () => {
        expect(categorizeFile('UTILITY_BILL.PDF')).toBe('Utility Bills');
        expect(categorizeFile('Tax_Document.docx')).toBe('Taxes');
    });

    test('should handle filenames with multiple keywords', () => {
        // It will match the first keyword found in the CATEGORY_MAP
        expect(categorizeFile('utility_tax_receipt.pdf')).toBe('Utility Bills');
    });
});
