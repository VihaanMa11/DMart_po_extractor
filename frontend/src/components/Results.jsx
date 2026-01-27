import PropTypes from 'prop-types'

// SVG Icons
const FileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
)

const CheckCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

const AlertCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)

const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

const RefreshIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
)

function truncate(str, len) {
  if (!str) return '-'
  return str.length > len ? str.substring(0, len) + '...' : str
}

function Results({ results, onDownload, onReset }) {
  const { total_files, successful, processed, errors, download_ready } = results

  return (
    <div className="results-section">
      <div className="results-summary">
        <div className="summary-item">
          <div className="number">{total_files}</div>
          <div className="label">Total Files</div>
        </div>
        <div className="summary-item success">
          <div className="number">{successful}</div>
          <div className="label">Successful</div>
        </div>
        <div className="summary-item error">
          <div className="number">{errors.length}</div>
          <div className="label">Errors</div>
        </div>
      </div>

      {processed.length > 0 && (
        <div className="table-container">
          <div className="table-scroll">
            <table className="results-table">
              <thead>
                <tr>
                  <th>File</th>
                  <th>PO Number</th>
                  <th>Vendor</th>
                  <th>Article</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {processed.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileIcon />
                        {truncate(item.filename, 20)}
                      </div>
                    </td>
                    <td><strong>{item.po_no || '-'}</strong></td>
                    <td>{truncate(item.vendor, 25)}</td>
                    <td title={item.article}>{truncate(item.article, 25)}</td>
                    <td>{item.total_pcs || '-'}</td>
                    <td>{item.basic_price || '-'}</td>
                    <td><strong>{item.total_value || '-'}</strong></td>
                    <td>
                      <span className="status-badge success">
                        <CheckCircleIcon />
                        Success
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {errors.length > 0 && (
        <div className="errors-section">
          <h4>
            <AlertCircleIcon />
            Processing Errors
          </h4>
          <div className="errors-list">
            {errors.map((err, index) => (
              <div key={index} className="error-item">
                <div className="error-file">{err.filename}</div>
                <div className="error-msg">{err.error}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="download-section">
        {download_ready && (
          <button className="btn btn-success" onClick={onDownload}>
            <DownloadIcon />
            Download Excel File
          </button>
        )}
        <button className="btn btn-secondary" onClick={onReset}>
          <RefreshIcon />
          Process More Files
        </button>
      </div>
    </div>
  )
}

Results.propTypes = {
  results: PropTypes.shape({
    total_files: PropTypes.number,
    successful: PropTypes.number,
    processed: PropTypes.array,
    errors: PropTypes.array,
    download_ready: PropTypes.bool,
    excel_file: PropTypes.string
  }).isRequired,
  onDownload: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired
}

export default Results
