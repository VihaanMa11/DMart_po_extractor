"""
Web-based PO Extraction Application
Flask application with authentication, admin dashboard, and PO extraction.
"""

import os
import uuid
import shutil
import json
import hashlib
from datetime import datetime
from functools import wraps
from flask import Flask, request, jsonify, send_file, session
from werkzeug.utils import secure_filename

from po_extractor import extract_po_data, format_excel_output

import pandas as pd

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'po-extractor-secret-key-2024')

# CORS support for React frontend
@app.after_request
def after_request(response):
    origin = request.headers.get('Origin', 'http://localhost:5173')
    response.headers.add('Access-Control-Allow-Origin', origin)
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-User-Token')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

# Configuration
# Configuration
IS_VERCEL = os.environ.get('VERCEL') == '1'
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

if IS_VERCEL:
    # On Vercel, we can only write to /tmp
    UPLOAD_FOLDER = os.path.join('/tmp', 'uploads')
    OUTPUT_FOLDER = os.path.join('/tmp', 'outputs')
    # Data folder must be split: read from source, write to tmp
    DATA_FOLDER = os.path.join(BASE_DIR, 'data') # Read source
    TEMP_DATA = os.path.join('/tmp', 'data')     # Write temp
else:
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
    OUTPUT_FOLDER = os.path.join(BASE_DIR, 'outputs')
    DATA_FOLDER = os.path.join(BASE_DIR, 'data')
    TEMP_DATA = DATA_FOLDER

ALLOWED_EXTENSIONS = {'pdf'}
MAX_CONTENT_LENGTH = 50 * 1024 * 1024

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['OUTPUT_FOLDER'] = OUTPUT_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# Ensure writable directories exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)
if IS_VERCEL:
    os.makedirs(TEMP_DATA, exist_ok=True)
else:
    os.makedirs(DATA_FOLDER, exist_ok=True)

# File paths
# Users file needs to be writable if it doesn't exist (creation of defaults)
# On Vercel, since we don't commit users.json, we must generate it in /tmp
if IS_VERCEL:
    USERS_FILE = os.path.join(TEMP_DATA, 'users.json')
else:
    USERS_FILE = os.path.join(DATA_FOLDER, 'users.json')

# Activity and Sessions should be in writable location
ACTIVITY_FILE = os.path.join(TEMP_DATA, 'activity.json')
SESSIONS_FILE = os.path.join(TEMP_DATA, 'sessions.json')

# Initialize data files
def init_data_files():
    # Define default/hardcoded users
    default_users = {
        'admin': {
            'password': hashlib.sha256('admin123'.encode()).hexdigest(),
            'role': 'admin',
            'name': 'Administrator',
            'created': datetime.now().isoformat()
        },
        'user': {
            'password': hashlib.sha256('user123'.encode()).hexdigest(),
            'role': 'user',
            'name': 'Demo User',
            'created': datetime.now().isoformat()
        },
        'arpit': {
            'password': hashlib.sha256('Shareat@2026'.encode()).hexdigest(),
            'role': 'user',
            'name': 'Arpit',
            'created': datetime.now().isoformat()
        },
        'vihaan@1106': {
            'password': hashlib.sha256('vihaan@1106'.encode()).hexdigest(),
            'role': 'admin',
            'name': 'Vihaan',
            'created': datetime.now().isoformat()
        }
    }

    if not os.path.exists(USERS_FILE):
        save_json(USERS_FILE, default_users)
    else:
        # Ensure default users exist in current file
        current_users = load_json(USERS_FILE)
        changed = False
        for username, user_data in default_users.items():
            if username not in current_users:
                current_users[username] = user_data
                changed = True
            # Optional: enforcing password/role updates?
            # For now let's just ensure they exist.
        
        if changed:
            save_json(USERS_FILE, current_users)
    
    if not os.path.exists(ACTIVITY_FILE):
        save_json(ACTIVITY_FILE, [])
    
    if not os.path.exists(SESSIONS_FILE):
        save_json(SESSIONS_FILE, {})

def load_json(filepath):
    try:
        with open(filepath, 'r') as f:
            return json.load(f)
    except:
        return {} if 'users' in filepath or 'sessions' in filepath else []

def save_json(filepath, data):
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)

# In-memory session tokens
active_sessions = {}

def generate_token():
    return str(uuid.uuid4())

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def log_activity(username, action, details=None):
    activity = load_json(ACTIVITY_FILE)
    activity.append({
        'id': str(uuid.uuid4()),
        'username': username,
        'action': action,
        'details': details or {},
        'timestamp': datetime.now().isoformat()
    })
    # Keep last 1000 activities
    activity = activity[-1000:]
    save_json(ACTIVITY_FILE, activity)

def get_user_from_token(token):
    if token in active_sessions:
        session_data = active_sessions[token]
        # Check if session is still valid (24 hour expiry)
        created = datetime.fromisoformat(session_data['created'])
        if (datetime.now() - created).total_seconds() < 86400:
            return session_data
    return None

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('X-User-Token')
        if not token:
            return jsonify({'error': 'Authentication required'}), 401
        
        user = get_user_from_token(token)
        if not user:
            return jsonify({'error': 'Invalid or expired session'}), 401
        
        request.current_user = user
        return f(*args, **kwargs)
    return decorated

def require_admin(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('X-User-Token')
        if not token:
            return jsonify({'error': 'Authentication required'}), 401
        
        user = get_user_from_token(token)
        if not user:
            return jsonify({'error': 'Invalid or expired session'}), 401
        
        if user.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        request.current_user = user
        return f(*args, **kwargs)
    return decorated

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Initialize data on startup
init_data_files()

# ============== AUTH ENDPOINTS ==============

@app.route('/api/auth/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return '', 204
    
    data = request.get_json()
    username = data.get('username', '').lower().strip()
    password = data.get('password', '')
    
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    
    users = load_json(USERS_FILE)
    user = users.get(username)
    
    if not user or user['password'] != hash_password(password):
        log_activity(username, 'login_failed', {'reason': 'invalid_credentials'})
        return jsonify({'error': 'Invalid username or password'}), 401
    
    # Create session
    token = generate_token()
    session_data = {
        'username': username,
        'name': user['name'],
        'role': user['role'],
        'created': datetime.now().isoformat(),
        'token': token
    }
    active_sessions[token] = session_data
    
    # Log activity
    log_activity(username, 'login', {'ip': request.remote_addr})
    
    return jsonify({
        'success': True,
        'token': token,
        'user': {
            'username': username,
            'name': user['name'],
            'role': user['role']
        }
    })

@app.route('/api/auth/logout', methods=['POST', 'OPTIONS'])
@require_auth
def logout():
    if request.method == 'OPTIONS':
        return '', 204
    
    token = request.headers.get('X-User-Token')
    user = request.current_user
    
    if token in active_sessions:
        del active_sessions[token]
    
    log_activity(user['username'], 'logout')
    
    return jsonify({'success': True})

@app.route('/api/auth/me', methods=['GET', 'OPTIONS'])
@require_auth
def get_current_user():
    if request.method == 'OPTIONS':
        return '', 204
    
    user = request.current_user
    return jsonify({
        'username': user['username'],
        'name': user['name'],
        'role': user['role']
    })

# ============== ADMIN ENDPOINTS ==============

@app.route('/api/admin/stats', methods=['GET', 'OPTIONS'])
@require_admin
def get_admin_stats():
    if request.method == 'OPTIONS':
        return '', 204
    
    activity = load_json(ACTIVITY_FILE)
    users = load_json(USERS_FILE)
    
    # Calculate stats
    total_users = len(users)
    active_session_count = len(active_sessions)
    
    # Get upload stats
    uploads = [a for a in activity if a['action'] == 'upload']
    total_uploads = len(uploads)
    total_files = sum(a['details'].get('file_count', 0) for a in uploads)
    
    # Get today's stats
    today = datetime.now().date().isoformat()
    today_logins = len([a for a in activity if a['action'] == 'login' and a['timestamp'].startswith(today)])
    today_uploads = len([a for a in activity if a['action'] == 'upload' and a['timestamp'].startswith(today)])
    
    # Get per-user stats
    user_stats = {}
    for a in activity:
        username = a['username']
        if username not in user_stats:
            user_stats[username] = {'logins': 0, 'uploads': 0, 'files': 0}
        if a['action'] == 'login':
            user_stats[username]['logins'] += 1
        elif a['action'] == 'upload':
            user_stats[username]['uploads'] += 1
            user_stats[username]['files'] += a['details'].get('file_count', 0)
    
    return jsonify({
        'total_users': total_users,
        'active_sessions': active_session_count,
        'total_uploads': total_uploads,
        'total_files_processed': total_files,
        'today_logins': today_logins,
        'today_uploads': today_uploads,
        'user_stats': user_stats
    })

@app.route('/api/admin/activity', methods=['GET', 'OPTIONS'])
@require_admin
def get_activity_log():
    if request.method == 'OPTIONS':
        return '', 204
    
    activity = load_json(ACTIVITY_FILE)
    limit = request.args.get('limit', 50, type=int)
    
    # Return most recent activities
    recent = sorted(activity, key=lambda x: x['timestamp'], reverse=True)[:limit]
    
    return jsonify({'activities': recent})

@app.route('/api/admin/users', methods=['GET', 'OPTIONS'])
@require_admin
def get_users():
    if request.method == 'OPTIONS':
        return '', 204
    
    users = load_json(USERS_FILE)
    activity = load_json(ACTIVITY_FILE)
    
    user_list = []
    for username, user in users.items():
        # Get last login
        user_logins = [a for a in activity if a['username'] == username and a['action'] == 'login']
        last_login = user_logins[-1]['timestamp'] if user_logins else None
        
        # Get upload count
        user_uploads = [a for a in activity if a['username'] == username and a['action'] == 'upload']
        
        user_list.append({
            'username': username,
            'name': user['name'],
            'role': user['role'],
            'created': user['created'],
            'last_login': last_login,
            'total_uploads': len(user_uploads),
            'is_online': any(s['username'] == username for s in active_sessions.values())
        })
    
    return jsonify({'users': user_list})

# ============== PO EXTRACTION ENDPOINTS ==============

@app.route('/')
def index():
    return jsonify({
        'name': 'PO Extraction API',
        'version': '2.0',
        'auth_required': True
    })

@app.route('/upload', methods=['POST', 'OPTIONS'])
@require_auth
def upload_files():
    if request.method == 'OPTIONS':
        return '', 204
    
    user = request.current_user
    
    if 'files[]' not in request.files:
        return jsonify({'error': 'No files provided'}), 400
    
    files = request.files.getlist('files[]')
    
    if not files or all(f.filename == '' for f in files):
        return jsonify({'error': 'No files selected'}), 400
    
    session_id = str(uuid.uuid4())
    session_folder = os.path.join(app.config['UPLOAD_FOLDER'], session_id)
    os.makedirs(session_folder, exist_ok=True)
    
    results = {
        'session_id': session_id,
        'processed': [],
        'errors': [],
        'total_files': 0,
        'successful': 0
    }
    
    valid_files = []
    
    for file in files:
        if file and file.filename:
            results['total_files'] += 1
            
            if not allowed_file(file.filename):
                results['errors'].append({
                    'filename': file.filename,
                    'error': 'Invalid file format. Only PDF files are allowed.'
                })
                continue
            
            filename = secure_filename(file.filename)
            filepath = os.path.join(session_folder, filename)
            
            try:
                file.save(filepath)
                valid_files.append((filename, filepath))
            except Exception as e:
                results['errors'].append({
                    'filename': file.filename,
                    'error': f'Failed to save file: {str(e)}'
                })
    
    all_data = []
    
    for filename, filepath in valid_files:
        try:
            rows = extract_po_data(filepath)
            first = rows[0] if rows else {}
            for row in rows:
                row['SOURCE_FILE'] = filename
                all_data.append(row)
            
            article_summary = f"{len(rows)} article(s)" if len(rows) != 1 else (first.get('ARTICLE DESCRIPTION') or 'N/A')
            results['processed'].append({
                'filename': filename,
                'status': 'success',
                'po_no': first.get('PO NO', 'N/A'),
                'vendor': first.get('VENDOR NAME', 'N/A'),
                'article': article_summary,
                'total_pcs': first.get('TOTAL PCS', 'N/A') if len(rows) == 1 else f"{len(rows)} lines",
                'basic_price': first.get('BASIC PRICE WITHOUT TAX', 'N/A'),
                'total_value': first.get('TOTAL BASIC PO VALUE WITHOUT TAX', 'N/A')
            })
            results['successful'] += 1
            
        except Exception as e:
            results['errors'].append({
                'filename': filename,
                'error': f'Extraction failed: {str(e)}'
            })
    
    if all_data:
        try:
            df = pd.DataFrame(all_data)
            
            cols = df.columns.tolist()
            if 'SOURCE_FILE' in cols:
                cols.remove('SOURCE_FILE')
                cols = ['SOURCE_FILE'] + cols
            df = df[cols]
            
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            output_filename = f'PO_Extracted_{timestamp}.xlsx'
            output_path = os.path.join(app.config['OUTPUT_FOLDER'], f'{session_id}_{output_filename}')
            
            df.to_excel(output_path, index=False, sheet_name='PO Data')
            format_excel_output(output_path)
            
            results['excel_file'] = f'{session_id}_{output_filename}'
            results['download_ready'] = True
            
        except Exception as e:
            results['errors'].append({
                'filename': 'Excel Generation',
                'error': f'Failed to generate Excel: {str(e)}'
            })
            results['download_ready'] = False
    else:
        results['download_ready'] = False
    
    # Log upload activity
    log_activity(user['username'], 'upload', {
        'file_count': results['total_files'],
        'successful': results['successful'],
        'session_id': session_id
    })
    
    try:
        shutil.rmtree(session_folder)
    except:
        pass
    
    return jsonify(results)

@app.route('/download/<filename>')
@require_auth
def download_file(filename):
    filepath = os.path.join(app.config['OUTPUT_FOLDER'], filename)
    
    if not os.path.exists(filepath):
        return jsonify({'error': 'File not found'}), 404
    
    original_name = '_'.join(filename.split('_')[1:]) if '_' in filename else filename
    
    log_activity(request.current_user['username'], 'download', {'filename': original_name})
    
    return send_file(
        filepath,
        as_attachment=True,
        download_name=original_name,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )

@app.route('/health')
def health_check():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    print("Starting PO Extraction API Server...")
    print(f"Upload folder: {UPLOAD_FOLDER}")
    print(f"Output folder: {OUTPUT_FOLDER}")
    print("API running at: http://localhost:5000")
    print("\nDefault credentials:")
    print("  Admin: admin / admin123")
    print("  User:  user / user123")
    app.run(debug=True, host='0.0.0.0', port=5000)
