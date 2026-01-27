import PropTypes from 'prop-types'

const SpinnerIcon = () => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    style={{ animation: 'spin 1s linear infinite' }}
  >
    <line x1="12" y1="2" x2="12" y2="6" />
    <line x1="12" y1="18" x2="12" y2="22" />
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
    <line x1="2" y1="12" x2="6" y2="12" />
    <line x1="18" y1="12" x2="22" y2="12" />
    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
  </svg>
)

function ProgressBar({ progress, text }) {
  return (
    <div className="progress-section">
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        marginBottom: '24px',
        color: '#6366f1'
      }}>
        <SpinnerIcon />
      </div>
      <div className="progress-bar-container">
        <div 
          className="progress-bar" 
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="progress-text">{text}</p>
      <p style={{ 
        textAlign: 'center', 
        color: '#9ca3af', 
        fontSize: '0.85rem',
        marginTop: '8px'
      }}>
        {Math.round(progress)}% complete
      </p>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

ProgressBar.propTypes = {
  progress: PropTypes.number.isRequired,
  text: PropTypes.string.isRequired
}

export default ProgressBar
