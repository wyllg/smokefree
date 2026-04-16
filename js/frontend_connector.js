const API_BASE_URL = "http://localhost:5000/api";

const ApiService = {
    // Helper: Get current user from storage
    getUser() {
        return localStorage.getItem('username');
    },

    async saveLog(data) {
        const user = this.getUser();
        if (!user) {
            alert("Please log in first.");
            window.location.href = 'login.html';
            return;
        }

        try {
            // Add username to the payload
            const payload = { ...data, username: user };

            const res = await fetch(`${API_BASE_URL}/log`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            return await res.json();
        } catch (err) { console.error(err); alert("Backend Error"); }
    },

    async deleteLog(dateStr) {
        const user = this.getUser();
        try {
            // Send username in Query Params
            const res = await fetch(`${API_BASE_URL}/log?date=${dateStr}&username=${user}`, {
                method: 'DELETE'
            });
            return await res.json();
        } catch (err) { console.error(err); }
    },

    async undoLastLog() {
        const user = this.getUser();
        try {
            const res = await fetch(`${API_BASE_URL}/undo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user })
            });
            const data = await res.json();
            alert(data.message);
            return data;
        } catch (err) { console.error(err); }
    },

    async getLogs() {
        const user = this.getUser();
        if (!user) return [];
        try {
            // Send username in Query Params
            const res = await fetch(`${API_BASE_URL}/timeline?username=${user}`);
            return await res.json();
        } catch (err) { return []; }
    },

    async getInsights() {
        const user = this.getUser();
        try {
            const res = await fetch(`${API_BASE_URL}/insights?username=${user}`);
            return await res.json();
        } catch (err) { return null; }
    },

    async getTimelineInsights() {
        const user = this.getUser();
        try {
            const res = await fetch(`${API_BASE_URL}/insights/timeline?username=${user}`);
            return await res.json();
        } catch (err) { return { timeline: null, additional: [] }; }
    },

    async getTopMetrics() {
        const user = this.getUser();
        try {
            const res = await fetch(`${API_BASE_URL}/insights/top-metrics?username=${user}`);
            return await res.json();
        } catch (err) { return { triggers: [], coping: [], symptoms: [], total_logs: 0 }; }
    },

    async getProgress() {
        const user = this.getUser();
        try {
            const res = await fetch(`${API_BASE_URL}/progress?username=${user}`);
            return await res.json();
        } catch (err) { return {}; }
    }
};

window.ApiService = ApiService;