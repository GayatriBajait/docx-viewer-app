# DOCX Viewer with WOPI Integration

A web application built with React (frontend) and Node.js (backend) that opens DOCX files stored locally on the server and displays them inside an iframe using Microsoft Office Online. The document is opened using WOPI (Web Application Open Platform Interface) so that a pre-installed Office Add-in is available when the document loads.

## 🧰 Tech Stack

- **Frontend**: React (using Vite) with JavaScript
- **Backend**: Node.js with Express.js
- **Document Integration**: WOPI (Web Application Open Platform Interface)
- **Security**: JWT-based access tokens
- **Additional**: CORS, Helmet for security headers

## 📋 Features

- Secure DOCX file viewing through WOPI protocol
- Embedding Office Online in an iframe
- Access token-based authentication
- Pre-installed Office Add-in support
- Responsive UI with loading and error states
- Secure file access controls

## 🚀 Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm (or yarn)

### Installation

1. Clone or download the repository
2. Navigate to the project directory

3. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

4. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

5. Return to backend directory and set up environment:
   ```bash
   cd ../backend
   ```

### Configuration

1. Copy the `.env` file in the backend directory to customize environment variables if needed:
   ```
   PORT=8080
   NODE_ENV=development
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ACCESS_TOKEN_EXPIRY=1h
   WOPI_BASE_URL=http://localhost:8080
   OFFICE_ONLINE_URL=https://word-edit.officeapps.live.com/we/wordeditorframe.aspx
   ```

2. Add a sample DOCX file to the `backend/documents/` directory:
   - Place a DOCX file named `sample.docx` in the `backend/documents/` directory
   - The file must be a valid, non-empty DOCX document
   - See `backend/documents/README.md` for detailed instructions on creating a sample document

### Running the Application

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```
   The backend server will run on `http://localhost:8080`

2. In a new terminal, start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will run on `http://localhost:3000`

3. Open your browser and navigate to `http://localhost:3000`

## 🔐 How the Security Works

### Document Access Control

- DOCX files are stored locally on the server in the `backend/documents/` directory
- Files are not accessible via public URLs
- Access is granted only through application-generated access tokens
- All file access goes through WOPI endpoints

### Token System

- When the user clicks "Open Document", the frontend makes a request to the backend
- The backend generates a JWT-based access token with file ID and user information
- The token is valid for a limited time (1 hour by default)
- The WOPI URL includes the access token as a query parameter
- All WOPI requests validate the token before serving file content

### WOPI Implementation

- The backend implements required WOPI endpoints:
  - `GET /wopi/files/{fileId}` - CheckFileInfo endpoint
  - `GET /wopi/files/{fileId}/contents` - GetFile endpoint
- Each endpoint validates the access token before processing
- Proper response formats according to WOPI specification

## 📄 How the DOCX File is Stored and Served

- DOCX files are stored in the `backend/documents/` directory
- The application reads files from this directory only through the WOPI protocol
- Direct file access is prevented by the application's routing
- Files are served through the `/wopi/files/{fileId}/contents` endpoint with token validation

## 🌐 How Iframe Integration Works

1. User clicks the "Open Document" button in the React UI
2. Frontend requests document access from the backend
3. Backend generates access token and creates Office Online URL with WOPI parameters
4. Frontend receives the URL and embeds it in an iframe
5. Office Online loads the document through the WOPI protocol
6. The document renders inside the iframe with Office Online UI

## 🔄 WOPI Flow (Step-by-Step)

1. **User Action**: User clicks "Open Document" button in React UI
2. **Token Request**: Frontend makes GET request to `/wopi/api/document/access`
3. **Token Generation**: Backend generates JWT access token and stores metadata
4. **WOPI URL Creation**: Backend constructs Office Online URL with WOPI source and access token
5. **Response**: Backend returns the Office Online URL to frontend
6. **Iframe Load**: Frontend sets the URL as iframe source
7. **WOPI Handshake**: Office Online makes CheckFileInfo request to `/wopi/files/{fileId}`
8. **Token Validation**: Backend validates access token and returns file metadata
9. **File Content Request**: Office Online makes GetFile request to `/wopi/files/{fileId}/contents`
10. **File Serving**: Backend validates token and streams file content
11. **Document Display**: Office Online renders the document in the iframe

## 🔌 Office Add-in Requirement

The document is opened using WOPI + Office Online, which enables pre-installed Office Add-ins to load automatically:

- When Office Online loads the document via WOPI, it recognizes the document context
- If Office Add-ins are configured for the Office Online environment, they automatically load
- The add-ins have access to the document through the Office JavaScript APIs
- This happens because Office Online maintains the proper document context when loaded through WOPI

### Why Office Online is Required for Add-in Availability

- Office Online provides the complete Office application environment
- Add-ins are designed to work within the Office application context
- WOPI protocol maintains document identity and context needed by add-ins
- Browser-based DOCX renderers typically don't support Office Add-ins
- Only the official Office Online applications support the full add-in ecosystem

## 🛠️ Project Structure

```
docx-viewer/
├── backend/
│   ├── documents/           # Store DOCX files here
│   │   └── sample.docx     # Example document file
│   ├── index.js            # Main server file with WOPI implementation
│   ├── .env               # Environment variables
│   └── package.json       # Backend dependencies
└── frontend/
    ├── src/
    │   ├── App.jsx        # Main React component
    │   ├── App.css        # Styles for the app
    │   ├── main.jsx       # React entry point
    │   └── index.css      # Global styles
    ├── public/
    ├── package.json       # Frontend dependencies
    └── vite.config.js     # Vite configuration with proxy
```

## ⚠️ Assumptions Made

1. Office Online is accessible (requires internet connection)
2. The Office Online environment has pre-installed add-ins configured
3. The user has access to Microsoft Office Online services
4. The DOCX file is properly formatted and not corrupted
5. The sample document is named `sample.docx` and placed in the correct directory

## 🚧 Limitations of the Implementation

1. **Office Online Dependency**: Requires Microsoft Office Online services to be available
2. **Internet Connection**: Needs constant internet connection for Office Online
3. **Browser Compatibility**: Depends on Office Online's browser support
4. **File Size Limits**: Office Online may have file size limitations
5. **Security Context**: Cross-origin restrictions apply when embedding Office Online
6. **Authentication**: Simplified authentication model (can be enhanced with OAuth)

## 🧪 Testing

1. Make sure the backend server is running on `http://localhost:8080`
2. Make sure the frontend server is running on `http://localhost:3000`
3. Ensure `sample.docx` is present in `backend/documents/`
4. Navigate to `http://localhost:3000`
5. Click "Open Document" button
6. The DOCX file should load in the iframe using Office Online
7. Verify that the document renders correctly and any pre-installed add-ins appear

## 📝 Notes

- This implementation demonstrates a complete WOPI host
- The token system ensures secure document access
- The iframe integration maintains the document in the same page
- Office Add-ins will load automatically if pre-configured in the Office Online environment
- For production use, ensure proper JWT secret management and HTTPS configuration

## 💡 Bonus Features Implemented

- TypeScript ready structure (can be easily converted)
- Robust error handling in both frontend and backend
- Clean and user-friendly UI with loading states
- Proper security headers with Helmet
- CORS configuration for development
- Comprehensive documentation