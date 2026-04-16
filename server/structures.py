import datetime
from collections import deque

# 1. ARRAY (Config & Validation)
class SymptomConfig:
    def __init__(self):
        self.CATEGORIES = ["cravings", "anxiety", "mood", "sleep", "triggers", "coping", "physical", "reflection"]
        self.SEVERITY_LIMIT = 10

    def validate_entry(self, data):
        errors = []
        if 'cravings' in data and not (0 <= int(data['cravings']) <= 10):
            errors.append("Cravings must be 0-10")
        return errors


# 2. QUEUE (Processing Buffer)
class ProcessingQueue:
    def __init__(self):
        self.queue = deque()

    def enqueue(self, data): self.queue.append(data)
    def dequeue(self): return self.queue.popleft() if self.queue else None


# 3. LINKED LIST (History)
class LogNode:
    def __init__(self, data):
        self.data = data
        self.next = None
        self.prev = None

class SymptomHistoryLinkedList:
    def __init__(self):
        self.head = None
        self.tail = None
        self.size = 0

    def add_or_update_log(self, data):
        """
        Synchronization Logic:
        Search for an existing log by DATE.
        If found, update it. If not, add new to tail.
        """
        current = self.head
        while current:
            if current.data.get('date') == data.get('date'):
                # Update existing node
                existing_id = current.data.get('id')
                existing_timestamp = current.data.get('timestamp')
                current.data = data
                current.data['id'] = existing_id
                current.data['timestamp'] = existing_timestamp
                return current.data
            current = current.next

        # If not found, add new
        self.add_log(data)
        return data

    def add_log(self, data):
        new_node = LogNode(data)
        if not self.head:
            self.head = self.tail = new_node
        else:
            self.tail.next = new_node
            new_node.prev = self.tail
            self.tail = new_node
        self.size += 1

    def remove_last_log(self):
        if not self.tail: return None
        removed = self.tail.data
        if self.head == self.tail:
            self.head = self.tail = None
        else:
            self.tail = self.tail.prev
            self.tail.next = None
        self.size -= 1
        return removed

    def delete_log_by_date(self, date_str):
        """Removes a specific node by date string."""
        current = self.head
        while current:
            if current.data.get('date') == date_str:
                if current == self.head and current == self.tail:
                    self.head = self.tail = None
                elif current == self.head:
                    self.head = current.next
                    self.head.prev = None
                elif current == self.tail:
                    self.tail = current.prev
                    self.tail.next = None
                else:
                    current.prev.next = current.next
                    current.next.prev = current.prev

                self.size -= 1
                return True
            current = current.next
        return False

    def get_all_logs(self):
        logs = []
        curr = self.head
        while curr:
            logs.append(curr.data)
            curr = curr.next
        return logs


# 4. STACK (Undo)
class UndoStack:
    def __init__(self): self.stack = []
    def push_action(self, id): self.stack.append(id)
    def pop_action(self): return self.stack.pop() if self.stack else None
    def is_empty(self): return len(self.stack) == 0


# 5. BINARY DECISION TREE (Insights)
class TreeNode:
    def __init__(self, check=None, true_node=None, false_node=None, result=None):
        self.check = check
        self.true_node = true_node
        self.false_node = false_node
        self.result = result

class RiskDecisionTree:
    def __init__(self):
        res_high = TreeNode(result={"level": "HIGH", "message": "High Risk! Immediate coping needed."})
        res_med = TreeNode(result={"level": "MODERATE", "message": "Warning: Monitor symptoms."})
        res_low = TreeNode(result={"level": "LOW", "message": "Stable. Keep going!"})

        def check_anx(d): return int(d.get('anxiety', 0)) > 6
        node_anx = TreeNode(check_anx, res_med, res_low)

        def check_crv(d): return int(d.get('cravings', 0)) > 7
        self.root = TreeNode(check_crv, res_high, node_anx)

    def analyze(self, data):
        curr = self.root
        while curr.result is None:
            if curr.check(data):
                curr = curr.true_node
            else:
                curr = curr.false_node
        return curr.result


# 6. TIMELINE PHASE DECISION TREE
class TimelinePhaseDecisionTree:
    """
    Decision tree to determine withdrawal timeline phase based on days smoke-free.
    Uses binary decision tree structure to classify user's current phase.
    """
    def __init__(self):
        # Leaf nodes (results) - each phase
        phase_6 = TreeNode(result={
            "type": "success",
            "title": "Phase 6: Maintenance",
            "tag": "LOW-MED",
            "desc": "Long-term relapse prevention.",
            "rec": "Focus on maintaining your healthy lifestyle."
        })
        phase_5 = TreeNode(result={
            "type": "success",
            "title": "Phase 5: Stabilization",
            "tag": "MEDIUM",
            "desc": "Monitoring stress triggers and relapse risks.",
            "rec": "Stay vigilant against unexpected stress triggers."
        })
        phase_4 = TreeNode(result={
            "type": "success",
            "title": "Phase 4: Habit Breaking",
            "tag": "MEDIUM",
            "desc": "Habit-trigger alerts and motivation check-ins.",
            "rec": "Identify routines that involved smoking and change them."
        })
        phase_3 = TreeNode(result={
            "type": "warning",
            "title": "Phase 3: Adjustment",
            "tag": "MED-HIGH",
            "desc": "Monitoring craving waves and mood stability.",
            "rec": "Physical symptoms are fading, mental cravings may spike."
        })
        phase_2 = TreeNode(result={
            "type": "danger",
            "title": "Phase 2: Peak Withdrawal",
            "tag": "CRITICAL",
            "desc": "Alert: Peak withdrawal symptoms, headaches, mood swings.",
            "rec": "Prioritize sleep and avoid major stressors."
        })
        phase_1 = TreeNode(result={
            "type": "danger",
            "title": "Phase 1: Immediate Withdrawal",
            "tag": "HIGH PRIORITY",
            "desc": "Initial cravings, stress, and irritability alerts.",
            "rec": "Your body is clearing nicotine. Drink water and practice deep breathing."
        })

        # Decision nodes - check days thresholds
        def check_days_30(days): return days > 30
        def check_days_14(days): return days > 14
        def check_days_7(days): return days > 7
        def check_days_3(days): return days > 3
        def check_days_1(days): return days > 1

        # Build tree from longest to shortest
        node_30 = TreeNode(check_days_30, phase_6, phase_5)
        node_14 = TreeNode(check_days_14, node_30, phase_4)
        node_7 = TreeNode(check_days_7, node_14, phase_3)
        node_3 = TreeNode(check_days_3, node_7, phase_2)
        self.root = TreeNode(check_days_1, node_3, phase_1)

    def calculate_days_smoke_free(self, logs):
        """
        Calculate days since last relapse or since first log.
        Uses linear scan to find last relapse event.
        Time Complexity: O(N log N) for sort + O(N) for scan = O(N log N)
        """
        if not logs:
            return 0

        # Sort logs by date (O(N log N))
        sorted_logs = sorted(logs, key=lambda x: x.get('date', ''))
        
        # Linear scan backwards to find last relapse (O(N))
        last_relapse_index = -1
        for i in range(len(sorted_logs) - 1, -1, -1):
            if sorted_logs[i].get('status') == 'relapse':
                last_relapse_index = i
                break

        # Calculate days based on last relapse
        now = datetime.datetime.now()
        
        if last_relapse_index == -1:
            # No relapse found - calculate from first log
            if sorted_logs:
                start_date = datetime.datetime.strptime(sorted_logs[0].get('date', ''), '%Y-%m-%d')
                days_since = (now - start_date).days
                return max(0, days_since)
            return 0
        else:
            # Calculate from last relapse
            relapse_date = datetime.datetime.strptime(sorted_logs[last_relapse_index].get('date', ''), '%Y-%m-%d')
            days_since = (now - relapse_date).days
            return max(0, days_since - 1)

    def analyze_timeline(self, logs):
        """
        Analyze logs and return timeline phase insight using decision tree.
        """
        if not logs:
            return {
                "type": "info",
                "title": "Welcome",
                "tag": "Start",
                "desc": "Start logging today to activate your withdrawal timeline alerts and analytics.",
                "rec": "Log your first entry in the Daily Log."
            }

        days = self.calculate_days_smoke_free(logs)
        
        # Traverse decision tree
        curr = self.root
        while curr.result is None:
            if curr.check(days):
                curr = curr.true_node
            else:
                curr = curr.false_node
        
        return curr.result


# 7. TOP METRICS SORTING (Top K Frequent Elements)
class TopMetricsAnalyzer:
    """
    Analyzes logs to find top K most frequent items using sorting algorithms.
    Demonstrates sorting algorithm implementation (Merge Sort).
    """
    
    def extract_items(self, log, keys):
        """
        Helper: Extract items from log entry, handling both string and array formats.
        """
        found_data = None
        
        # Search for data using priority keys
        if isinstance(keys, list):
            for key in keys:
                if key in log and log[key]:
                    found_data = log[key]
                    break
        else:
            found_data = log.get(keys)
        
        if not found_data:
            return []
        
        # Normalize string to array
        if isinstance(found_data, str):
            return [s.strip() for s in found_data.split(',') if s.strip()]
        
        # Return array if already an array
        if isinstance(found_data, list):
            return found_data
        
        return []

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

    def get_top_metrics(self, logs, keys_to_search, top_k=5):
        """
        DSA ALGORITHM: Top K Frequent Elements
        Strategy: Hashing (Frequency Map) + Merge Sort
        
        Time Complexity: O(N + M log M)
        - N = Total number of logs (traversal)
        - M = Number of unique items (sorting)
        Space Complexity: O(M) for frequency map and result array
        
        Steps:
        1. Hashing: Count occurrences using dictionary (frequency map)
        2. Transformation: Convert map to array
        3. Sorting: Use Merge Sort to sort by frequency (descending)
        4. Selection: Return top K elements
        """
        # Step 1: Hashing - Build frequency map
        frequency_map = {}
        
        # Traverse all logs: O(N)
        for log in logs:
            items = self.extract_items(log, keys_to_search)
            for item in items:
                if item:
                    # Normalize key (trim whitespace, case-insensitive)
                    key = item.strip()
                    # Update frequency: O(1) average case
                    frequency_map[key] = frequency_map.get(key, 0) + 1
        
        # Step 2: Transformation - Convert map to array
        items_array = [{"name": key, "count": count} for key, count in frequency_map.items()]
        
        # Step 3: Sorting - Use Merge Sort (O(M log M))
        sorted_array = self.merge_sort(items_array)
        
        # Step 4: Selection - Return top K
        return sorted_array[:top_k]