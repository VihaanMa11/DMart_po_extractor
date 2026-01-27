import PropTypes from 'prop-types'

// SVG Icons
const PdfIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
)

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const FolderIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#6366f1' }}>
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
)

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function FileList({ files, onRemove }) {
  const totalSize = files.reduce((acc, file) => acc + file.size, 0)

  return (
    <div className="selected-files">
      <h4>
        <FolderIcon />
        <span>Selected Files ({files.length})</span>
        <span style={{ marginLeft: 'auto', fontWeight: 400, fontSize: '0.85rem', color: '#6b7280' }}>
          {formatFileSize(totalSize)} total
        </span>
      </h4>
      <div className="file-list">
        {files.map((file, index) => (
          <div key={`${file.name}-${file.size}-${index}`} className="file-item">
            <div className="file-icon">
              <PdfIcon />
            </div>
            <span className="file-name">{file.name}</span>
            <span className="file-size">{formatFileSize(file.size)}</span>
            <button 
              className="remove-btn" 
              onClick={() => onRemove(index)}
              title="Remove file"
            >
              <CloseIcon />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

FileList.propTypes = {
  files: PropTypes.array.isRequired,
  onRemove: PropTypes.func.isRequired
}

export default FileList
