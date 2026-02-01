const { categorizeFile } = require('../src/categorizer');

describe('Dry Run Categorization', () => {
  it('should count files in each category', () => {
    // Mock file list
    const mockFiles = [
      'utility_bill_jan.pdf',
      'tax_document_2023.pdf',
      'receipt_grocery.jpg',
      'invoice_freelance.pdf',
      'bank_statement_dec.pdf',
      'photo_vacation.jpg',
      'video_birthday.mp4',
      'resume_amit.pdf',
      'contract_signing.pdf',
      'medical_record.pdf',
      'school_transcript.pdf',
      'manual_blender.pdf',
      'personal_notes.txt',
      'another_utility_bill.pdf',
      'tax_returns_2022.pdf',
      'photo_of_cat.png',
    ];

    const categoryCounts = {};

    mockFiles.forEach(file => {
      const category = categorizeFile(file);
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    // Expected counts
    const expectedCounts = {
      'Utility Bills': 2,
      'Taxes': 2,
      'Receipts': 1,
      'Invoices': 1,
      'Financial Statements': 1,
      'Personal Photos': 2,
      'Personal Videos': 1,
      'Career Documents': 1,
      'Legal Documents': 1,
      'Health Records': 1,
      'Education / School': 1,
      'Product Manuals': 1,
      'General Personal Docs': 1,
    };

    expect(categoryCounts).toEqual(expectedCounts);
  });
});
