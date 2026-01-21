const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      "default-src": ["'self'"],
      "frame-src": ["'self'", "*.officeapps.live.com", "*.office.com"],
      "script-src": ["'self'", "'unsafe-inline'"],
      "style-src": ["'self'", "'unsafe-inline'"]
    }
  }
}));

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Token management
const activeTokens = new Map();

// Generate secure access token
function generateAccessToken(fileId, userId = 'anonymous') {
  const payload = {
    fileId,
    userId,
    timestamp: Date.now(),
    nonce: uuidv4()
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '1h'
  });

  // Store token metadata for validation
  activeTokens.set(token, {
    fileId,
    userId,
    createdAt: Date.now(),
    expiresAt: Date.now() + (60 * 60 * 1000) // 1 hour
  });

  return token;
}

// Validate access token
function validateAccessToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if token is still active
    const tokenData = activeTokens.get(token);
    if (!tokenData) {
      throw new Error('Token not found');
    }

    // Check expiration
    if (Date.now() > tokenData.expiresAt) {
      activeTokens.delete(token);
      throw new Error('Token expired');
    }

    return { valid: true, decoded };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// Cleanup expired tokens periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of activeTokens.entries()) {
    if (now > data.expiresAt) {
      activeTokens.delete(token);
    }
  }
}, 300000); // Every 5 minutes

// Sample document configuration
const DOCUMENT_ID = 'sample-document';
const DOCUMENT_PATH = path.join(__dirname, 'documents', 'sample.docx');

// Ensure documents directory exists
if (!fs.existsSync(path.join(__dirname, 'documents'))) {
  fs.mkdirSync(path.join(__dirname, 'documents'), { recursive: true });
}

// Main endpoint to get document access
app.get('/wopi/api/document/access', (req, res) => {
  try {
    // Check if document exists and has content
    if (!fs.existsSync(DOCUMENT_PATH) || fs.statSync(DOCUMENT_PATH).size === 0) {
      return res.status(404).json({
        error: 'Document not found or empty',
        message: 'Sample document not found or is empty. Please add a valid DOCX file to the documents folder named sample.docx.'
      });
    }

    // Generate access token
    const accessToken = generateAccessToken(DOCUMENT_ID);
    
    // Create WOPI URL for Office Online
    const wopiSrc = `${process.env.WOPI_BASE_URL}/wopi/files/${DOCUMENT_ID}`;
    // Use WOPISrc and access_token as separate parameters as required by Office Online
    const officeOnlineUrl = `${process.env.OFFICE_ONLINE_URL}?WOPISrc=${encodeURIComponent(wopiSrc)}&access_token_hint=${accessToken}&ui=en-US&rs=en-US`;

    res.json({
      success: true,
      documentUrl: officeOnlineUrl,
      accessToken: accessToken,
      fileId: DOCUMENT_ID
    });
  } catch (error) {
    console.error('Error generating document access:', error);
    res.status(500).json({
      error: 'Failed to generate document access',
      message: error.message
    });
  }
});

// WOPI Endpoints Implementation
// CheckFileInfo endpoint - required by WOPI specification
app.get('/wopi/files/:fileId', (req, res) => {
  const { fileId } = req.params;
  const accessToken = req.query.access_token;

  // Validate token
  const tokenValidation = validateAccessToken(accessToken);
  if (!tokenValidation.valid) {
    return res.status(401).json({ error: 'Invalid or expired access token' });
  }

  // Verify file ID matches
  if (fileId !== DOCUMENT_ID) {
    return res.status(404).json({ error: 'File not found' });
  }

  try {
    // Check if file exists and has content
    if (!fs.existsSync(DOCUMENT_PATH) || fs.statSync(DOCUMENT_PATH).size === 0) {
      return res.status(404).json({ error: 'File not found or empty' });
    }
    
    // Get file stats
    const fileStats = fs.statSync(DOCUMENT_PATH);
    
    // Return WOPI CheckFileInfo response
    const fileInfo = {
      // Required properties
      BaseFileName: 'sample.docx',
      OwnerId: 'admin',
      Size: fileStats.size,
      Version: fileStats.mtime.getTime().toString(),
      
      // Additional required properties for Office Online
      UserId: 'user123',
      UserFriendlyName: 'DOCX Viewer User',
      
      // Permissions
      UserCanWrite: false,
      UserCanNotWriteRelative: true,
      SupportsUpdate: false,
      SupportsLocks: false,
      SupportsGetLock: false,
      ReadOnly: true,
      
      // UI settings
      CloseButtonClosesWindow: true,
      HideExportOption: true,
      HideSaveOption: true,
      HidePrintOption: false,
      
      // Host capabilities
      HostViewUrl: `${process.env.WOPI_BASE_URL}/wopi/api/document/access`,
      HostEditUrl: `${process.env.WOPI_BASE_URL}/wopi/api/document/access`,
      
      // WOPI Actions - specify the supported actions
      Actions: [
        {
          ActionType: 'view',
          Url: `${process.env.WOPI_BASE_URL}/wopi/files/${fileId}/contents?access_token=${req.query.access_token}`
        }
      ],
      
      // Branding
      CompanyTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      IsAnonymousUser: false,
      IsEditRecommended: false,
      
      // File Properties
      BreadcrumbBrandName: 'DOCX Viewer',
      BreadcrumbFolderName: 'Documents',
      BreadcrumbDocName: 'sample.docx'
    };

    res.json(fileInfo);
  } catch (error) {
    console.error('Error in CheckFileInfo:', error);
    res.status(500).json({ error: 'Failed to retrieve file information' });
  }
});

// GetFile endpoint - required by WOPI specification
app.get('/wopi/files/:fileId/contents', (req, res) => {
  const { fileId } = req.params;
  const accessToken = req.query.access_token;

  // Validate token
  const tokenValidation = validateAccessToken(accessToken);
  if (!tokenValidation.valid) {
    return res.status(401).json({ error: 'Invalid or expired access token' });
  }

  // Verify file ID matches
  if (fileId !== DOCUMENT_ID) {
    return res.status(404).json({ error: 'File not found' });
  }

  try {
    // Check if file exists and has content
    if (!fs.existsSync(DOCUMENT_PATH) || fs.statSync(DOCUMENT_PATH).size === 0) {
      return res.status(404).json({ error: 'File not found or empty' });
    }
    
    // Stream the file
    const fileStream = fs.createReadStream(DOCUMENT_PATH);
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename="sample.docx"');
    
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error serving file contents:', error);
    res.status(500).json({ error: 'Failed to serve file contents' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve static files from documents directory (optional - for direct access testing)
app.use('/documents', express.static(path.join(__dirname, 'documents')));

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 WOPI Host Server running on port ${PORT}`);
  console.log(`📄 Document path: ${DOCUMENT_PATH}`);
  console.log(`🔒 JWT Secret configured: ${!!process.env.JWT_SECRET}`);
  console.log(`🌐 Office Online URL: ${process.env.OFFICE_ONLINE_URL}`);
});