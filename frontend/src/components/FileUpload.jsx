import { useCallback, useState } from 'react'
import PropTypes from 'prop-types'

// SVG Icons
const UploadIcon = () => (
  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#6366f1' }}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
)

const FileIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ef4444' }}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
)

function FileUpload({ onFilesSelected }) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files)
    }
  }, [onFilesSelected])

  const handleClick = () => {
    document.getElementById('file-input').click()
  }

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      onFilesSelected(e.target.files)
      e.target.value = ''
    }
  }

  return (
    <div
      className={`upload-zone ${isDragging ? 'dragover' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <div className="upload-icon">
        <UploadIcon />
      </div>
      <h3>Drag & Drop PDF Files Here</h3>
      <p>Supports multiple PDF files (e.g., 30+) up to 500MB total</p>
      <input
        type="file"
        id="file-input"
        className="file-input"
        multiple
        accept=".pdf"
        onChange={handleFileChange}
      />
      <button
        className="btn btn-primary"
        onClick={(e) => {
          e.stopPropagation()
          handleClick()
        }}
      >
        <FileIcon />
        Browse Files
      </button>
    </div>
  )
}

FileUpload.propTypes = {
  onFilesSelected: PropTypes.func.isRequired
}

export default FileUpload
