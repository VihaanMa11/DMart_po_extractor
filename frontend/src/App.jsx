import { useState, useEffect } from 'react'
import Login from './components/Login'
import FileUpload from './components/FileUpload'
import FileList from './components/FileList'
import ProgressBar from './components/ProgressBar'
import Results from './components/Results'
import AdminDashboard from './components/AdminDashboard'
import './App.css'

const API_BASE = ''

// Icons
const FileTextIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
)

const InfoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
)

const ZapIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
)

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
)

const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)

const LogOutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)

const AlertIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)

function App() {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [showAdmin, setShowAdmin] = useState(false)
  
  const [files, setFiles] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState('')
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const savedToken = localStorage.getItem('po_token')
    const savedUser = localStorage.getItem('po_user')
    
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
      
      fetch(`${API_BASE}/api/auth/me`, {
        headers: { 'X-User-Token': savedToken }
      }).then(res => {
        if (!res.ok) {
          handleLogout()
        }
      }).catch(() => handleLogout())
    }
  }, [])

  const handleLogin = (newToken, userData) => {
    setToken(newToken)
    setUser(userData)
    localStorage.setItem('po_token', newToken)
    localStorage.setItem('po_user', JSON.stringify(userData))
  }

  const handleLogout = async () => {
    if (token) {
      try {
        await fetch(`${API_BASE}/api/auth/logout`, {
          method: 'POST',
          headers: { 'X-User-Token': token }
        })
      } catch (e) {
        // Ignore
      }
    }
    
    setToken(null)
    setUser(null)
    setShowAdmin(false)
    setFiles([])
    setResults(null)
    localStorage.removeItem('po_token')
    localStorage.removeItem('po_user')
  }

  const handleFilesSelected = (newFiles) => {
    const pdfFiles = Array.from(newFiles).filter(
      f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    )
    
    setFiles(prev => {
      const existing = new Set(prev.map(f => `${f.name}-${f.size}`))
      const unique = pdfFiles.filter(f => !existing.has(`${f.name}-${f.size}`))
      return [...prev, ...unique]
    })
    setError(null)
  }

  const handleRemoveFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleClearAll = () => {
    setFiles([])
    setResults(null)
    setError(null)
    setProgress(0)
  }

  const handleProcess = async () => {
    if (files.length === 0) return

    setIsProcessing(true)
    setProgress(0)
    setProgressText('Uploading files...')
    setResults(null)
    setError(null)

    const formData = new FormData()
    files.forEach(file => formData.append('files[]', file))

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const next = prev + Math.random() * 15
        return next > 90 ? 90 : next
      })
      setProgressText(prev => {
        if (prev === 'Uploading files...') return 'Processing PDFs...'
        if (prev === 'Processing PDFs...') return 'Extracting data...'
        return 'Generating Excel...'
      })
    }, 400)

    try {
      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: { 'X-User-Token': token },
        body: formData
      })

      clearInterval(progressInterval)
      setProgress(100)
      setProgressText('Processing complete!')

      if (!response.ok) {
        let errorMessage = 'Upload failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If response is not JSON (e.g. 413 Request Entity Too Large HTML/Text)
          if (response.status === 413) {
            errorMessage = 'Files are too large to upload. Please try fewer files at a time.';
          } else {
            errorMessage = `Server Error (${response.status})`;
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json()

      setTimeout(() => {
        setResults(data)
        setIsProcessing(false)
      }, 600)

    } catch (err) {
      clearInterval(progressInterval)
      setError(err.message)
      setIsProcessing(false)
      setProgress(0)
    }
  }

  const handleDownload = () => {
    if (results?.excel_file) {
      fetch(`${API_BASE}/download/${encodeURIComponent(results.excel_file)}`, {
        headers: { 'X-User-Token': token }
      })
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = results.excel_file.split('_').slice(1).join('_')
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      })
    }
  }

  const handleReset = () => {
    setFiles([])
    setResults(null)
    setError(null)
    setProgress(0)
    setIsProcessing(false)
  }

  if (!user || !token) {
    return <Login onLogin={handleLogin} />
  }

  if (showAdmin && user.role === 'admin') {
    return <AdminDashboard token={token} onBack={() => setShowAdmin(false)} />
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand">
          <div className="brand-icon">
            <FileTextIcon />
          </div>
          <div className="brand-text">
            <h1>PO Data Extractor</h1>
            <p>Extract structured data from Purchase Orders</p>
          </div>
        </div>
        <div className="header-actions">
          <span className="user-info">
            Hello, <strong>{user.name}</strong>
          </span>
          {user.role === 'admin' && (
            <button className="btn-icon" onClick={() => setShowAdmin(true)} title="Admin Dashboard">
              <SettingsIcon />
            </button>
          )}
          <button className="btn-icon logout" onClick={handleLogout} title="Sign Out">
            <LogOutIcon />
          </button>
        </div>
      </header>

      <main className="app-main">
        <div className="info-banner">
          <InfoIcon />
          <span>
            Upload a Purchase Order PDF to automatically extract structured data. 
            The extracted data can be exported to Excel (CSV) format.
          </span>
        </div>

        <div className="main-card">
          {!isProcessing && !results && (
            <>
              <FileUpload onFilesSelected={handleFilesSelected} />
              
              {files.length > 0 && (
                <>
                  <FileList 
                    files={files} 
                    onRemove={handleRemoveFile} 
                  />
                  <div className="actions">
                    <button className="btn btn-primary" onClick={handleProcess}>
                      <ZapIcon />
                      Extract Data
                    </button>
                    <button className="btn btn-secondary" onClick={handleClearAll}>
                      <TrashIcon />
                      Clear All
                    </button>
                  </div>
                </>
              )}

              {error && (
                <div className="error-message">
                  <AlertIcon />
                  <span>{error}</span>
                </div>
              )}
            </>
          )}

          {isProcessing && (
            <ProgressBar progress={progress} text={progressText} />
          )}

          {results && (
            <Results 
              results={results} 
              onDownload={handleDownload}
              onReset={handleReset}
            />
          )}
        </div>

        {!isProcessing && !results && files.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">
              <InfoIcon />
            </div>
            <h3>No data extracted yet</h3>
            <p>Upload a Purchase Order PDF above to begin extracting structured data. You can upload multiple files to batch process.</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
