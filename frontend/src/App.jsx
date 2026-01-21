import React, { useState } from 'react';
import './App.css';

function App() {
  const [documentUrl, setDocumentUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleOpenDocument = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const response = await fetch('/wopi/api/document/access');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get document access');
      }
      
      setDocumentUrl(data.documentUrl);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
      console.error('Error opening document:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setDocumentUrl('');
    setError(null);
    setSuccess(false);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>📄 DOCX Viewer with WOPI Integration</h1>
        <p>Securely view and interact with DOCX files using Microsoft Office Online</p>
        
        <div className="document-info">
          <h3>📋 Document Information</h3>
          <p>• Files are securely stored on the server and accessed via WOPI protocol<br/>
             • Pre-installed Office Add-ins will load automatically<br/>
             • Documents are displayed in an embedded Office Online viewer</p>
        </div>
        
        <div className="controls">
          <button 
            onClick={handleOpenDocument} 
            disabled={loading}
            className="open-btn"
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Opening Document...
              </>
            ) : 'Open Document'}
          </button>
          
          {error && (
            <div className="error-message">
              <strong>❌ Error:</strong> {error}
            </div>
          )}
          
          {success && !error && !loading && (
            <div className="success-message">
              <strong>✅ Success:</strong> Document loaded successfully!
            </div>
          )}
        </div>
      </header>
      
      {loading && !documentUrl && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading document from server...</p>
        </div>
      )}

      {documentUrl && !error && (
        <div className="iframe-container">
          <iframe
            src={documentUrl}
            title="Document Viewer"
            allowFullScreen
          ></iframe>
        </div>
      )}
      
      {documentUrl && !error && (
        <div className="controls">
          <button 
            onClick={handleReset}
            className="open-btn"
            style={{background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)'}}
          >
            Close Document
          </button>
        </div>
      )}
    </div>
  );
}

export default App;