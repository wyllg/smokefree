# Data Structures Used in Nicotine Withdrawal Web App

This document identifies which data structures from the required list are used in the project.

## Required Data Structure Categories:
1. List
2. Queue
3. Set
4. Dictionary
5. Stack
6. Tree
7. Graph (Optional)

---

## ✅ DATA STRUCTURES USED  (Minimum 3 Required)

### 1. LIST ✅
**Location:** Multiple files throughout the project

**Implementation:**
- **Python Lists:** Used extensively in `server/structures.py` and `server/app.py`
- **JavaScript Arrays:** Used in frontend JavaScript files

**Examples:**
```python
# server/structures.py - Line 7
self.CATEGORIES = ["cravings", "anxiety", "mood", "sleep", "triggers", "coping", "physical", "reflection"]

# server/structures.py - Line 11
errors = []  # List for validation errors

# server/structures.py - Line 105
logs = []  # List to collect all logs from linked list

# server/structures.py - Line 115
self.stack = []  # List used as underlying structure for Stack

# server/app.py - Line 76
export_data[user] = linked_list.get_all_logs()  # Returns list of logs
```

**Usage in Project:**
- Store symptom categories
- Collect validation errors
- Store logs temporarily before JSON conversion
- Used as underlying structure for Stack implementation
- Frontend JavaScript arrays for data manipulation

---

### 2. QUEUE ✅
**Location:** `server/structures.py` - `ProcessingQueue` class

**Implementation:**
- **Class:** `ProcessingQueue` (lines 18-23)
- **Underlying Structure:** Python's `deque` (double-ended queue) from `collections` module
- **Operations:** `enqueue()` and `dequeue()`

**How it works:**
- FIFO (First In First Out) data structure
- `enqueue()` adds items to the back (rear) of the queue
- `dequeue()` removes items from the front of the queue
- Used as a processing buffer for symptom logs before adding to linked list

**Code Example:**
```python
# server/structures.py
from collections import deque

class ProcessingQueue:
    def __init__(self):
        self.queue = deque()  # Queue implementation using deque
    
    def enqueue(self, data): 
        self.queue.append(data)  # Add to back of queue
    
    def dequeue(self): 
        return self.queue.popleft() if self.queue else None  # Remove from front
```

**Usage in Project:**
- **File:** `server/app.py` - Lines 217-219
- When a new symptom log is created, it's first enqueued
- Then dequeued for processing before being added to the linked list
- Acts as a buffer/processing queue for log entries

```python
# server/app.py
queue.enqueue(data)  # Add to queue
processed_data = queue.dequeue()  # Remove from queue for processing
```

---

### 3. DICTIONARY ✅
**Location:** `server/app.py` - Multiple dictionary instances

**Implementation:**
- **Python Dictionaries:** Used for key-value storage
- **Multiple instances:** `user_sessions`, `user_undo_stacks`, `users_db`

**Examples:**
```python
# server/app.py - Line 27
# Key = Username (string), Value = SymptomHistoryLinkedList (object)
user_sessions = {}

# server/app.py - Line 29
# Key = Username (string), Value = UndoStack (object)
user_undo_stacks = {}

# server/app.py - Line 33
# Key = Username (string), Value = {"password_hash": str, "email": str}
users_db = {}

# server/app.py - Line 76
export_data = {}  # Dictionary to export all user data
```

**Usage in Project:**
- **Multi-user storage:** Maps usernames to their symptom history (linked lists)
- **Undo functionality:** Maps usernames to their undo stacks
- **User authentication:** Stores user accounts with password hashes and emails
- **Data export:** Dictionary structure for JSON serialization
- **JSON data:** Symptom data stored as nested dictionaries in JSON files

**Code Example:**
```python
# Accessing user's linked list
user_list, user_stack = get_user_structures(username)

# Storing user account
users_db[username] = {
    "password_hash": password_hash,
    "email": email
}

# Loading from JSON (returns dictionary)
with open(USERS_FILE, 'r') as f:
    users_db = json.load(f)  # Returns dictionary
```

---

### 4. STACK ✅
**Location:** `server/structures.py` - `UndoStack` class

**Implementation:**
- **Class:** `UndoStack` (lines 114-118)
- **Underlying Structure:** Python list used as stack
- **Operations:** `push_action()` and `pop_action()`

**How it works:**
- LIFO (Last In First Out) data structure
- `push_action()` adds items to the top of the stack
- `pop_action()` removes items from the top of the stack
- Used for undo functionality - tracks the most recent actions

**Code Example:**
```python
# server/structures.py
class UndoStack:
    def __init__(self): 
        self.stack = []  # List used as stack
    
    def push_action(self, id): 
        self.stack.append(id)  # Push to top (end of list)
    
    def pop_action(self): 
        return self.stack.pop() if self.stack else None  # Pop from top
    
    def is_empty(self): 
        return len(self.stack) == 0
```

**Usage in Project:**
- **File:** `server/app.py` - Lines 228, 253-263
- When a log is added, its ID is pushed onto the undo stack
- When undo is called, the most recent action ID is popped
- Allows users to undo their last log entry

```python
# server/app.py
# Add to Undo Stack
user_stack.push_action(final_data['id'])

# Undo last entry
user_stack.pop_action()
removed = user_list.remove_last_log()
```

---

### 5. TREE ✅
**Location:** `server/structures.py` - Multiple Tree implementations

**Implementation:**
- **Class 1:** `RiskDecisionTree` - Binary Decision Tree for risk assessment
- **Class 2:** `TimelinePhaseDecisionTree` - Binary Decision Tree for timeline phases
- **Node Class:** `TreeNode` (lines 122-127)
- **Type:** Binary Decision Trees

**How it works:**
- Tree structure with nodes containing decision logic
- Each node has a check function and two child nodes (true/false)
- Traverses from root to leaf nodes based on condition checks
- Returns assessment result based on traversal path

#### 5a. RiskDecisionTree (Risk Assessment)

**Code Example:**
```python
# server/structures.py
class TreeNode:
    def __init__(self, check=None, true_node=None, false_node=None, result=None):
        self.check = check  # Decision function
        self.true_node = true_node  # Child if condition is true
        self.false_node = false_node  # Child if condition is false
        self.result = result  # Final result if leaf node

class RiskDecisionTree:
    def __init__(self):
        # Create leaf nodes (results)
        res_high = TreeNode(result={"level": "HIGH", "message": "High Risk!"})
        res_med = TreeNode(result={"level": "MODERATE", "message": "Warning!"})
        res_low = TreeNode(result={"level": "LOW", "message": "Stable!"})
        
        # Create decision nodes
        node_anx = TreeNode(check_anx, res_med, res_low)
        self.root = TreeNode(check_crv, res_high, node_anx)
    
    def analyze(self, data):
        curr = self.root
        while curr.result is None:  # Traverse tree
            if curr.check(data):
                curr = curr.true_node
            else:
                curr = curr.false_node
        return curr.result  # Return leaf node result
```

**Tree Structure:**
```
Root: Check if cravings > 7
├─ True → HIGH RISK (leaf)
└─ False → Check if anxiety > 6
   ├─ True → MODERATE RISK (leaf)
   └─ False → LOW RISK (leaf)
```

**Usage in Project:**
- **File:** `server/app.py` - Lines 282-290
- Analyzes symptom data to determine risk level
- Used in `/api/insights` endpoint to provide risk assessment

#### 5b. TimelinePhaseDecisionTree (Withdrawal Timeline Phases)

**Code Example:**
```python
# server/structures.py
class TimelinePhaseDecisionTree:
    def __init__(self):
        # Create leaf nodes for each phase
        phase_6 = TreeNode(result={"type": "success", "title": "Phase 6: Maintenance", ...})
        phase_5 = TreeNode(result={"type": "success", "title": "Phase 5: Stabilization", ...})
        phase_4 = TreeNode(result={"type": "success", "title": "Phase 4: Habit Breaking", ...})
        phase_3 = TreeNode(result={"type": "warning", "title": "Phase 3: Adjustment", ...})
        phase_2 = TreeNode(result={"type": "danger", "title": "Phase 2: Peak Withdrawal", ...})
        phase_1 = TreeNode(result={"type": "danger", "title": "Phase 1: Immediate Withdrawal", ...})
        
        # Build decision tree based on days thresholds
        node_30 = TreeNode(check_days_30, phase_6, phase_5)
        node_14 = TreeNode(check_days_14, node_30, phase_4)
        node_7 = TreeNode(check_days_7, node_14, phase_3)
        node_3 = TreeNode(check_days_3, node_7, phase_2)
        self.root = TreeNode(check_days_1, node_3, phase_1)
    
    def analyze_timeline(self, logs):
        days = self.calculate_days_smoke_free(logs)
        curr = self.root
        while curr.result is None:
            if curr.check(days):
                curr = curr.true_node
            else:
                curr = curr.false_node
        return curr.result
```

**Tree Structure:**
```
Root: Check if days > 1
├─ True → Check if days > 3
│   ├─ True → Check if days > 7
│   │   ├─ True → Check if days > 14
│   │   │   ├─ True → Check if days > 30
│   │   │   │   ├─ True → Phase 6: Maintenance (leaf)
│   │   │   │   └─ False → Phase 5: Stabilization (leaf)
│   │   │   └─ False → Phase 4: Habit Breaking (leaf)
│   │   └─ False → Phase 3: Adjustment (leaf)
│   └─ False → Phase 2: Peak Withdrawal (leaf)
└─ False → Phase 1: Immediate Withdrawal (leaf)
```

**Usage in Project:**
- **File:** `server/app.py` - Lines 293-315
- Determines user's current withdrawal timeline phase based on days smoke-free
- Uses linear search to find last relapse event
- Used in `/api/insights/timeline` endpoint to provide personalized phase insights
- Calculates days since last relapse or first log entry

```python
# server/app.py
@app.route('/api/insights/timeline', methods=['GET'])
def get_timeline_insights():
    # ...
    timeline_insight = timeline_tree.analyze_timeline(logs)
    return jsonify({"timeline": timeline_insight, ...})
```

---


## Summary

**Data Structures from Required List (Minimum 3):**
1. ✅ **List** - Used extensively throughout the project
2. ✅ **Queue** - `ProcessingQueue` class for log processing
3. ✅ **Dictionary** - Multiple dictionaries for user data storage
4. ✅ **Stack** - `UndoStack` class for undo functionality
5. ✅ **Tree** - Two decision trees: `RiskDecisionTree` (risk analysis) and `TimelinePhaseDecisionTree` (timeline phases)

**Total:** 5 data structures implemented (exceeds minimum requirement of 3)

All data structures are:
- Actively used in the application
- Serve critical functional purposes
- Properly implemented with clear code examples
- Well-integrated into the application architecture

---

## Implementation Details

### List Implementation:
- **Files:** `server/structures.py`, `server/app.py`, JavaScript files
- **Purpose:** General-purpose collections, arrays, temporary storage
- **Examples:** Error lists, log collections, category arrays

### Queue Implementation:
- **File:** `server/structures.py` - `ProcessingQueue` class
- **Purpose:** FIFO buffer for processing symptom logs
- **Operations:** `enqueue()`, `dequeue()`

### Dictionary Implementation:
- **File:** `server/app.py`
- **Purpose:** Key-value storage for users, sessions, and authentication
- **Instances:** `user_sessions`, `user_undo_stacks`, `users_db`

### Stack Implementation:
- **File:** `server/structures.py` - `UndoStack` class
- **Purpose:** LIFO structure for undo functionality
- **Operations:** `push_action()`, `pop_action()`

### Tree Implementation:
- **File:** `server/structures.py` - Two tree classes
- **Class 1:** `RiskDecisionTree` - Binary decision tree for risk assessment
- **Class 2:** `TimelinePhaseDecisionTree` - Binary decision tree for withdrawal timeline phases
- **Type:** Binary Decision Trees with TreeNode nodes
- **Purpose:** 
  - Risk assessment based on symptom severity
  - Timeline phase determination based on days smoke-free

