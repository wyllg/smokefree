# Algorithms Implemented in Nicotine Withdrawal Web App

This document identifies which algorithms from the required list are used in the project.

## Required Algorithm Categories:
1. Searching (Linear / Binary)
2. Sorting (Bubble, Selection, Merge, Quick Sort)
3. Graph Algorithms (BFS/DFS)
4. Hashing
5. Shortest Path (Dijkstra)

---

## ✅ ALGORITHMS USED (Minimum 2 Required)

### 1. LINEAR SEARCH Algorithm ✅
**Category:** Searching (Linear / Binary)

**Location:** `server/structures.py` - `SymptomHistoryLinkedList` class

**Implementation:**
- **Method:** `add_or_update_log()` (lines 39-59)
- **Method:** `delete_log_by_date()` (lines 82-102)

**How it works:**
- Searches through the linked list sequentially from head to tail
- Compares each node's date field with the target date
- Time Complexity: O(n) where n is the number of logs
- Space Complexity: O(1)
- Used to find existing logs by date before updating or deleting

**Code Example:**
```python
def add_or_update_log(self, data):
    """
    Linear Search: Sequentially search through linked list
    to find a log entry by date.
    """
    current = self.head
    while current:  # Linear search - check each node one by one
        if current.data.get('date') == data.get('date'):
            # Found existing log - update it
            existing_id = current.data.get('id')
            existing_timestamp = current.data.get('timestamp')
            current.data = data
            current.data['id'] = existing_id
            current.data['timestamp'] = existing_timestamp
            return current.data
        current = current.next  # Move to next node
    
    # Not found - add new log
    self.add_log(data)
    return data
```

**Usage in Project:**
- When a user logs symptoms, the system searches for an existing log for that date
- If found, it updates the existing entry; if not, it creates a new one
- Also used when deleting logs by date

---

### 2. HASHING Algorithm ✅
**Category:** Hashing

**Location:** `server/app.py` - Authentication system

**Implementation:**
- **Import:** `from werkzeug.security import generate_password_hash, check_password_hash`
- **Usage:** 
  - Line 146: `generate_password_hash(password)` in `/api/signup` endpoint
  - Line 185: `check_password_hash()` in `/api/login` endpoint
- **Algorithm:** Scrypt (secure cryptographic hash function via Werkzeug)

**How it works:**
- Uses scrypt hashing algorithm for password security
- `generate_password_hash()` creates a secure one-way hash of passwords
- `check_password_hash()` verifies passwords against stored hashes
- One-way hashing prevents password recovery from stored data
- Includes salt and multiple iterations for security

**Code Example:**
```python
# Signup Endpoint - Hash password before storing
@app.route('/api/signup', methods=['POST'])
def signup():
    # ... validation code ...
    
    # HASHING: Create secure hash of password
    password_hash = generate_password_hash(password)
    users_db[username] = {
        "password_hash": password_hash,  # Store hash, not plain password
        "email": email
    }
    save_users()
    # ...

# Login Endpoint - Verify password hash
@app.route('/api/login', methods=['POST'])
def login():
    # ... validation code ...
    
    # HASHING: Verify password against stored hash
    user_data = users_db[username]
    if not check_password_hash(user_data["password_hash"], password):
        return jsonify({"status": "error", "message": "Invalid password"}), 401
    # ...
```

**Usage in Project:**
- All user passwords are hashed before storage in `users.json`
- Password verification during login uses hash comparison
- Ensures password security even if database is compromised

---

### 3. MERGE SORT Algorithm ✅
**Category:** Sorting (Bubble, Selection, Merge, Quick Sort)

**Location:** `server/structures.py` - `TopMetricsAnalyzer` class

**Implementation:**
- **Method:** `merge_sort()` - Main sorting function
- **Method:** `merge()` - Helper function to merge two sorted arrays
- **Used in:** `get_top_metrics()` method for ranking top symptoms, triggers, and coping strategies

**How it works:**
- **Divide and Conquer:** Recursively splits array into halves until base case (1 element)
- **Merge:** Combines two sorted halves into one sorted array
- **Time Complexity:** O(N log N) - guaranteed performance regardless of input
- **Space Complexity:** O(N) - requires additional space for merging
- **Stable:** Maintains relative order of equal elements
- **Comparison-based:** Uses comparison operations to determine order

**Code Example:**
```python
def merge_sort(self, arr):
    """
    MERGE SORT Algorithm Implementation
    Time Complexity: O(N log N)
    Space Complexity: O(N)
    Stable sorting algorithm - maintains relative order of equal elements.
    """
    if len(arr) <= 1:
        return arr
    
    # Divide: Split array into two halves
    mid = len(arr) // 2
    left = self.merge_sort(arr[:mid])
    right = self.merge_sort(arr[mid:])
    
    # Conquer: Merge the two sorted halves
    return self.merge(left, right)

def merge(self, left, right):
    """
    Merge two sorted arrays into one sorted array.
    Used by merge sort algorithm.
    """
    result = []
    i = j = 0
    
    # Compare elements and merge in sorted order
    while i < len(left) and j < len(right):
        # Sort by count (descending) - higher count first
        if left[i]['count'] >= right[j]['count']:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    
    # Add remaining elements
    result.extend(left[i:])
    result.extend(right[j:])
    
    return result
```

**Usage in Project:**
- **Top 5 Metrics Calculation:** Used in `get_top_metrics()` to sort symptom/trigger/coping frequency data
- **API Endpoint:** `/api/insights/top-metrics` uses this algorithm to rank items
- **Purpose:** Demonstrates sorting algorithm implementation for "Top K Frequent Elements" problem
- **Strategy:** 
  1. Build frequency map using hashing (O(N))
  2. Convert to array
  3. Sort using Merge Sort (O(M log M) where M = unique items)
  4. Return top K elements

**Algorithm Flow:**
```
Input: [{"name": "Stress", "count": 5}, {"name": "Anxiety", "count": 8}, ...]
  ↓
Merge Sort (Divide):
  [5, 8, 3, 12, 7] → [5, 8] [3, 12, 7] → [5] [8] [3] [12, 7] → [5] [8] [3] [12] [7]
  ↓
Merge Sort (Conquer):
  [5] [8] → [8, 5] → [8, 5] [3] → [8, 5, 3] → [12] [7] → [12, 7] → [12, 7, 8, 5, 3]
  ↓
Output: Sorted by count (descending) → Top 5 selected
```

---

## Summary

**Algorithms from Required List (Minimum 2):**
1. ✅ **Linear Search** - From "Searching (Linear / Binary)" category
2. ✅ **Hashing** - From "Hashing" category
3. ✅ **Merge Sort** - From "Sorting (Bubble, Selection, Merge, Quick Sort)" category

**Total:** 3 algorithms implemented (exceeds minimum requirement)

All algorithms are:
- Actively used in the application
- Serve critical functional purposes
- Properly implemented with clear code examples
- Documented with time/space complexity
- Implemented server-side to meet backend requirements

---

## Implementation Details

### Linear Search Implementation:
- **File:** `server/structures.py`
- **Class:** `SymptomHistoryLinkedList`
- **Methods:** `add_or_update_log()`, `delete_log_by_date()`
- **Purpose:** Find symptom logs by date in linked list structure

### Hashing Implementation:
- **File:** `server/app.py`
- **Library:** Werkzeug (Flask security)
- **Algorithm:** Scrypt
- **Purpose:** Secure password storage and verification in authentication system

### Merge Sort Implementation:
- **File:** `server/structures.py`
- **Class:** `TopMetricsAnalyzer`
- **Methods:** `merge_sort()`, `merge()`, `get_top_metrics()`
- **Purpose:** Sort and rank top symptoms, triggers, and coping strategies by frequency
- **API:** Used in `/api/insights/top-metrics` endpoint
