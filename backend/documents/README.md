# Documents Directory

This directory contains DOCX files that can be viewed through the WOPI integration.

## Adding Sample Documents

To test the DOCX viewer, please add a DOCX file named `sample.docx` to this directory.

### How to create a sample DOCX file:

1. **Using Microsoft Word:**
   - Open Microsoft Word
   - Create a new document
   - Add some sample content (text, headings, paragraphs, etc.)
   - Type "Welcome to DOCX Viewer! This is a sample document." as a test
   - Save as `sample.docx` in this directory

2. **Using Google Docs:**
   - Create a document in Google Docs
   - Add sample content
   - Go to File → Download → Microsoft Word (.docx)
   - Rename to `sample.docx` and place in this directory

3. **Using LibreOffice Writer:**
   - Create a new document
   - Add content
   - Go to File → Export As → Microsoft Word (.docx)
   - Save as `sample.docx` in this directory

### Quick Test Method:
If you have access to any existing .docx file:
1. Copy any existing DOCX file
2. Rename it to `sample.docx`
3. Place it in this directory

### File Requirements:
- Filename must be exactly: `sample.docx`
- Format: DOCX (Word Document)
- Size: Must be a valid, non-empty DOCX file (any reasonable size up to 10MB)
- The file must contain actual Word document content

### Verification Steps:
After placing the file in this directory:
1. Make sure the file size is greater than 0 bytes
2. Restart the backend server if it was running
3. Access the web application at http://localhost:3000
4. Click the "Open Document" button
5. The document should load in the Office Online viewer

### Troubleshooting:
- If you see an error about file not found or empty, double-check the filename is exactly `sample.docx`
- If the document doesn't load, verify that it's a valid DOCX file by opening it in Microsoft Word
- Check that the backend server is running on port 8080

### Security Note:
Files in this directory are served through the WOPI protocol with access token protection.
Direct access to files is restricted and requires proper authentication.