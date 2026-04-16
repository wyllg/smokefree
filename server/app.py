from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from structures import (
    SymptomConfig, ProcessingQueue, SymptomHistoryLinkedList,
    UndoStack, RiskDecisionTree, TimelinePhaseDecisionTree, TopMetricsAnalyzer
)
import uuid
import json
import os
from datetime import datetime


app = Flask(__name__, template_folder='../html')
CORS(app)

DATA_FILE = 'symptom_data.json'
USERS_FILE = 'users.json'

# --- GLOBAL STRUCTURES ---
config = SymptomConfig()
queue = ProcessingQueue()
decision_tree = RiskDecisionTree()
timeline_tree = TimelinePhaseDecisionTree()
metrics_analyzer = TopMetricsAnalyzer()

# MULTI-USER STORAGE (The "In-Memory Database")
# Key = Username (string), Value = SymptomHistoryLinkedList (object)
user_sessions = {}
# Key = Username (string), Value = UndoStack (object)
user_undo_stacks = {}

# USER AUTHENTICATION DATABASE
# Key = Username (string), Value = {"password_hash": str, "email": str}
users_db = {}


# --- PERSISTENCE HELPER FUNCTIONS ---

def load_users():
    """Loads user accounts from JSON file."""
    global users_db
    try:
        if os.path.exists(USERS_FILE):
            with open(USERS_FILE, 'r') as f:
                users_db = json.load(f)
            print(f"Users database loaded. {len(users_db)} users found.")
        else:
            print("No users database found. Starting fresh.")
            users_db = {}
    except (json.JSONDecodeError, Exception) as e:
        print(f"Error loading users database: {e}")
        users_db = {}


def save_users():
    """Saves user accounts to JSON file."""
    try:
        with open(USERS_FILE, 'w') as f:
            json.dump(users_db, f, indent=4)
    except Exception as e:
        print(f"Error saving users database: {e}")


def get_user_structures(username):
    """Retrieves or creates the Linked List & Stack for a specific user."""
    if username not in user_sessions:
        user_sessions[username] = SymptomHistoryLinkedList()
        user_undo_stacks[username] = UndoStack()
    return user_sessions[username], user_undo_stacks[username]


def save_all_data():
    """Saves ALL users' linked lists to one JSON file."""
    export_data = {}
    # Convert every user's Linked List into a standard list for JSON
    for user, linked_list in user_sessions.items():
        export_data[user] = linked_list.get_all_logs()

    try:
        with open(DATA_FILE, 'w') as f:
            json.dump(export_data, f, indent=4)
    except Exception as e:
        print(f"Error saving database: {e}")


def load_all_data():
    """Loads the JSON file and rebuilds the Linked Lists for each user."""
    global user_sessions, user_undo_stacks
    try:
        with open(DATA_FILE, 'r') as f:
            raw_data = json.load(f)

            for user, logs in raw_data.items():
                new_list = SymptomHistoryLinkedList()
                # Rebuild the Linked List node by node
                for log in logs:
                    new_list.add_log(log)

                user_sessions[user] = new_list
                user_undo_stacks[user] = UndoStack()

            print(f"Database loaded. Users found: {list(user_sessions.keys())}")
    except (FileNotFoundError, json.JSONDecodeError):
        print("No database file found. Starting fresh.")


# Load data immediately when server starts
load_all_data()
load_users()


# --- ROUTES ---

@app.route('/')
def root(): return render_template('login.html')


@app.route('/<path:filename>')
def serve_page(filename):
    if filename.endswith('.html'): return render_template(filename)
    return send_from_directory('../', filename)


# --- API ---

@app.route('/api/signup', methods=['POST'])
def signup():
    """Register a new user account."""
    data = request.json
    username = data.get('username', '').strip()
    password = data.get('password', '')
    email = data.get('email', '').strip()

    # Validation
    if not username:
        return jsonify({"status": "error", "message": "Username is required"}), 400
    if not password:
        return jsonify({"status": "error", "message": "Password is required"}), 400
    if len(password) < 6:
        return jsonify({"status": "error", "message": "Password must be at least 6 characters"}), 400

    # Check if user already exists
    if username in users_db:
        return jsonify({"status": "error", "message": "Username already exists"}), 409

    # Create new user account
    password_hash = generate_password_hash(password)
    users_db[username] = {
        "password_hash": password_hash,
        "email": email
    }
    save_users()

    # Initialize user's data structures
    get_user_structures(username)

    return jsonify({
        "status": "success",
        "message": "Account created successfully"
    }), 201


@app.route('/api/login', methods=['POST'])
def login():
    """Authenticate a user and verify account exists."""
    data = request.json
    username = data.get('username', '').strip()
    password = data.get('password', '')

    # Validation
    if not username:
        return jsonify({"status": "error", "message": "Username is required"}), 400
    if not password:
        return jsonify({"status": "error", "message": "Password is required"}), 400

    # Check if user exists
    if username not in users_db:
        return jsonify({
            "status": "error",
            "message": "Account not found. Please sign up first.",
            "redirect": "signup"
        }), 404

    # Verify password
    user_data = users_db[username]
    if not check_password_hash(user_data["password_hash"], password):
        return jsonify({
            "status": "error",
            "message": "Invalid password"
        }), 401

    # Initialize user's data structures if not already done
    get_user_structures(username)

    return jsonify({
        "status": "success",
        "message": "Login successful",
        "username": username
    }), 200


@app.route('/api/log', methods=['POST'])
def add_log():
    data = request.json
    username = data.get('username')

    if not username:
        return jsonify({"status": "error", "message": "User not logged in"}), 403

    # Validate
    errors = config.validate_entry(data)
    if errors: return jsonify({"status": "error", "errors": errors}), 400

    # Add ID/Timestamp if new
    if 'id' not in data: data['id'] = str(uuid.uuid4())
    if 'timestamp' not in data: data['timestamp'] = datetime.now().isoformat()

    # Queue Processing
    queue.enqueue(data)
    processed_data = queue.dequeue()

    # Get THIS user's specific Linked List
    user_list, user_stack = get_user_structures(username)

    # Add to Linked List
    final_data = user_list.add_or_update_log(processed_data)

    # Add to Undo Stack
    user_stack.push_action(final_data['id'])

    # Save everything to file
    save_all_data()

    return jsonify({"status": "success", "message": "Log saved", "id": final_data['id']})


@app.route('/api/log', methods=['DELETE'])
def delete_log():
    date_to_delete = request.args.get('date')
    username = request.args.get('username')

    if not username: return jsonify({"status": "error", "message": "User required"}), 403

    user_list, _ = get_user_structures(username)
    success = user_list.delete_log_by_date(date_to_delete)

    if success:
        save_all_data()
        return jsonify({"status": "success"})
    return jsonify({"status": "error", "message": "Not found"}), 404


@app.route('/api/undo', methods=['POST'])
def undo_last_entry():
    data = request.json
    username = data.get('username')
    if not username: return jsonify({"status": "error"}), 403

    user_list, user_stack = get_user_structures(username)

    if user_stack.is_empty(): return jsonify({"status": "error", "message": "Nothing to undo"}), 400

    user_stack.pop_action()
    removed = user_list.remove_last_log()

    if removed: save_all_data()
    return jsonify({"status": "success", "data": removed})


@app.route('/api/timeline', methods=['GET'])
def get_timeline():
    username = request.args.get('username')
    if not username: return jsonify([])

    user_list, _ = get_user_structures(username)
    logs = user_list.get_all_logs()

    # Sort for display (Linked List structure remains intact in backend)
    logs.sort(key=lambda x: x['timestamp'], reverse=True)
    return jsonify(logs)


@app.route('/api/insights', methods=['GET'])
def get_insights():
    """Legacy endpoint for risk assessment decision tree."""
    username = request.args.get('username')
    if not username: return jsonify(None)

    user_list, _ = get_user_structures(username)
    if user_list.size == 0: return jsonify(None)

    return jsonify(decision_tree.analyze(user_list.tail.data))


@app.route('/api/insights/timeline', methods=['GET'])
def get_timeline_insights():
    """Get timeline phase insights using decision tree."""
    username = request.args.get('username')
    if not username: return jsonify({"error": "Username required"}), 400

    user_list, _ = get_user_structures(username)
    logs = user_list.get_all_logs()
    
    timeline_insight = timeline_tree.analyze_timeline(logs)
    
    # Also check for high-risk symptoms using risk decision tree
    additional_insights = []
    if logs:
        risk_analysis = decision_tree.analyze(logs[-1])
        if risk_analysis and risk_analysis.get('level') == 'HIGH':
            additional_insights.append({
                "type": "warning",
                "title": "Symptom Alert",
                "tag": "Urgent",
                "desc": risk_analysis.get('message', ''),
                "rec": "Your reported symptoms are high today regardless of your timeline phase."
            })
    
    return jsonify({
        "timeline": timeline_insight,
        "additional": additional_insights
    })


@app.route('/api/insights/top-metrics', methods=['GET'])
def get_top_metrics():
    """Get top 5 metrics (triggers, coping, symptoms) using sorting algorithms."""
    username = request.args.get('username')
    if not username: return jsonify({"error": "Username required"}), 400

    user_list, _ = get_user_structures(username)
    logs = user_list.get_all_logs()
    
    # Get top 5 for each category using sorting algorithm
    top_triggers = metrics_analyzer.get_top_metrics(
        logs, 
        ['triggers', 'trigger'], 
        top_k=5
    )
    
    top_coping = metrics_analyzer.get_top_metrics(
        logs, 
        ['coping', 'copingStrategies', 'coping_strategies'], 
        top_k=5
    )
    
    top_symptoms = metrics_analyzer.get_top_metrics(
        logs, 
        ['physical', 'symptoms', 'physicalSymptoms', 'physical_symptoms'], 
        top_k=5
    )
    
    return jsonify({
        "triggers": top_triggers,
        "coping": top_coping,
        "symptoms": top_symptoms,
        "total_logs": len(logs)
    })


@app.route('/api/progress', methods=['GET'])
def get_progress():
    username = request.args.get('username')
    if not username: return jsonify({})

    user_list, _ = get_user_structures(username)
    logs = user_list.get_all_logs()
    low_cravings = sum(1 for x in logs if int(x.get('cravings', 0)) < 3)

    return jsonify({
        "total_logs": len(logs),
        "milestone_days": low_cravings,
        "current_streak": len(logs)
    })


if __name__ == '__main__':
    app.run(debug=True, port=5000)