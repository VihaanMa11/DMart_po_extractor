import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'

const UsersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const ActivityIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
)

const FileIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
)

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const RefreshIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
)

const ArrowLeftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
)

function AdminDashboard({ token, onBack }) {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [activities, setActivities] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const headers = { 'X-User-Token': token }

      const [statsRes, usersRes, activityRes] = await Promise.all([
        fetch('/api/admin/stats', { headers }),
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/activity?limit=100', { headers })
      ])

      const statsData = await statsRes.json()
      const usersData = await usersRes.json()
      const activityData = await activityRes.json()

      setStats(statsData)
      setUsers(usersData.users || [])
      setActivities(activityData.activities || [])
    } catch (err) {
      console.error('Failed to fetch admin data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [token])

  const formatDate = (isoString) => {
    if (!isoString) return 'Never'
    const date = new Date(isoString)
    return date.toLocaleString()
  }

  const getActionLabel = (action) => {
    const labels = {
      'login': 'Logged in',
      'logout': 'Logged out',
      'upload': 'Uploaded files',
      'download': 'Downloaded file',
      'login_failed': 'Login failed'
    }
    return labels[action] || action
  }

  const getActionColor = (action) => {
    const colors = {
      'login': '#10b981',
      'logout': '#6b7280',
      'upload': '#3b82f6',
      'download': '#8b5cf6',
      'login_failed': '#ef4444'
    }
    return colors[action] || '#6b7280'
  }

  if (isLoading && !stats) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeftIcon />
          Back to Extractor
        </button>
        <h1>Admin Dashboard</h1>
        <button className="refresh-btn" onClick={fetchData}>
          <RefreshIcon />
          Refresh
        </button>
      </div>

      <div className="admin-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button
          className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          Activity Log
        </button>
      </div>

      {activeTab === 'overview' && stats && (
        <div className="admin-content">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon blue"><UsersIcon /></div>
              <div className="stat-info">
                <span className="stat-value">{stats.total_users}</span>
                <span className="stat-label">Total Users</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green"><ActivityIcon /></div>
              <div className="stat-info">
                <span className="stat-value">{stats.active_sessions}</span>
                <span className="stat-label">Active Sessions</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon purple"><FileIcon /></div>
              <div className="stat-info">
                <span className="stat-value">{stats.total_files_processed}</span>
                <span className="stat-label">Files Processed</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon orange"><FileIcon /></div>
              <div className="stat-info">
                <span className="stat-value">{stats.total_uploads}</span>
                <span className="stat-label">Total Uploads</span>
              </div>
            </div>
          </div>

          <div className="stats-row">
            <div className="stat-card wide">
              <h3>Today&apos;s Activity</h3>
              <div className="today-stats">
                <div className="today-stat">
                  <span className="today-value">{stats.today_logins}</span>
                  <span className="today-label">Logins Today</span>
                </div>
                <div className="today-stat">
                  <span className="today-value">{stats.today_uploads}</span>
                  <span className="today-label">Uploads Today</span>
                </div>
              </div>
            </div>
          </div>

          <div className="user-stats-section">
            <h3>User Statistics</h3>
            <div className="user-stats-table">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Logins</th>
                    <th>Uploads</th>
                    <th>Files Processed</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(stats.user_stats || {}).map(([username, data]) => (
                    <tr key={username}>
                      <td>{username}</td>
                      <td>{data.logins}</td>
                      <td>{data.uploads}</td>
                      <td>{data.files}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="admin-content">
          <div className="users-table">
            <table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Total Uploads</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.username}>
                    <td><strong>{user.username}</strong></td>
                    <td>{user.name}</td>
                    <td>
                      <span className={`role-badge ${user.role}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span className={`status-indicator ${user.is_online ? 'online' : 'offline'}`}>
                        {user.is_online ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td>
                      <span className="date-cell">
                        <ClockIcon />
                        {formatDate(user.last_login)}
                      </span>
                    </td>
                    <td>{user.total_uploads}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="admin-content">
          <div className="activity-list">
            {activities.map(activity => (
              <div key={activity.id} className="activity-item">
                <div
                  className="activity-indicator"
                  style={{ backgroundColor: getActionColor(activity.action) }}
                />
                <div className="activity-content">
                  <div className="activity-main">
                    <strong>{activity.username}</strong>
                    <span>{getActionLabel(activity.action)}</span>
                    {activity.details?.file_count && (
                      <span className="activity-detail">
                        ({activity.details.file_count} files)
                      </span>
                    )}
                  </div>
                  <div className="activity-time">
                    <ClockIcon />
                    {formatDate(activity.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

AdminDashboard.propTypes = {
  token: PropTypes.string.isRequired,
  onBack: PropTypes.func.isRequired
}

export default AdminDashboard
