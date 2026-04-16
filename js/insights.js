/**
 * NICOTINE MONITOR - INSIGHTS.JS
 * Handles view switching and rendering of insights data.
 * 
 * NOTE: All calculation logic (decision trees, sorting algorithms) 
 * has been moved to server-side (structures.py) to meet backend requirements.
 * This file now only handles frontend rendering and UI interactions.
 */

// --- SESSION MANAGEMENT ---
function checkUserSession() {
    const username = localStorage.getItem('username');
    if (!username) {
        try { window.location.href = 'login.html'; } catch(e){}
        return;
    }
    const welcome = document.getElementById('welcome-user');
    if(welcome) welcome.textContent = "Welcome, " + username;
}

function logout() {
    localStorage.removeItem('username');
    try{window.location.href = 'login.html';}catch(e){}
}

// --- VIEW SWITCHING LOGIC ---
function switchView(viewName) {
    const p1 = document.getElementById('panel-insights');
    const p2 = document.getElementById('panel-guidelines');
    const btnTimeline = document.getElementById('btn-timeline');
    const btnAnalytics = document.getElementById('btn-analytics');

    if(viewName === 'timeline') {
        if(p1) p1.classList.remove('hidden');
        if(p2) p2.classList.add('hidden');
        if(btnTimeline) btnTimeline.classList.add('active');
        if(btnAnalytics) btnAnalytics.classList.remove('active');
    } else if(viewName === 'analytics') {
        if(p1) p1.classList.add('hidden');
        if(p2) p2.classList.remove('hidden');
        if(btnTimeline) btnTimeline.classList.remove('active');
        if(btnAnalytics) btnAnalytics.classList.add('active');
    }
}

function toggleRec(id) {
    const box = document.getElementById(id);
    if(box) box.classList.toggle('open');

    const icon = document.getElementById('icon-' + id);
    if(icon) {
        icon.classList.toggle('fa-chevron-up');
        icon.classList.toggle('fa-chevron-down');
    }
}

// --- RENDERING FUNCTIONS ---
// All calculation logic has been moved to server-side (structures.py)

function renderRankList(containerId, data, totalLogs, colorClass) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    if (!data || data.length === 0) {
        container.innerHTML = '<div class="empty-state-text">No data recorded yet.</div>';
        return;
    }

    // Find the max count to calculate relative width of progress bars
    const maxCount = data[0].count;

    data.forEach(item => {
        // Calculate percentage for the bar width (relative to the highest item)
        const percent = Math.round((item.count / maxCount) * 100);

        const html = `
            <div class="rank-row" style="margin-bottom: 12px;">
                <div style="display:flex; justify-content:space-between; font-size:0.9rem; margin-bottom:4px;">
                    <span style="font-weight:600; color:#334155;">${item.name}</span>
                    <span style="color:#64748b; font-size:0.85rem;">${item.count} times</span>
                </div>
                <div style="width:100%; height:8px; background:#e2e8f0; border-radius:4px; overflow:hidden;">
                    <div style="width:${percent}%; height:100%;" class="${colorClass}"></div>
                </div>
            </div>
        `;
        container.innerHTML += html;
    });
}

// Timeline calculation moved to server-side (TimelinePhaseDecisionTree in structures.py)

// --- MAIN GENERATOR ---
// All calculation logic is now server-side. This function only handles rendering.

async function generateInsights() {
    const container = document.getElementById('insights-list');

    if (!window.ApiService) {
        console.error("ApiService not available");
        return;
    }

    try {
        // Fetch timeline insights from server (decision tree calculation)
        const timelineData = await ApiService.getTimelineInsights();
        
        // Fetch top metrics from server (sorting algorithm calculation)
        const metricsData = await ApiService.getTopMetrics();

        // --- RENDER TOP METRICS (Server-calculated) ---
        renderRankList('list-triggers', metricsData.triggers || [], metricsData.total_logs || 0, 'progress-fill-trigger');
        renderRankList('list-coping', metricsData.coping || [], metricsData.total_logs || 0, 'progress-fill-coping');
        renderRankList('list-symptoms', metricsData.symptoms || [], metricsData.total_logs || 0, 'progress-fill-symptom');

        // --- RENDER TIMELINE CARDS (Server-calculated) ---
        if (container) {
            container.innerHTML = '';
            let insights = [];

            // Add timeline insight from decision tree
            if (timelineData.timeline) {
                insights.push(timelineData.timeline);
            }

            // Add additional insights (e.g., high-risk alerts)
            if (timelineData.additional && Array.isArray(timelineData.additional)) {
                insights.push(...timelineData.additional);
            }

            // Render Insight Cards
            const countEl = document.getElementById('active-count');
            if (countEl) countEl.textContent = insights.length + " active";

            insights.forEach((item, index) => {
                const uniqueId = 'rec-' + index;
                const html = `
                    <div class="insight-card insight-${item.type}">
                        <div class="ic-header">
                            <div class="ic-title-row">
                                <i class="fa-regular fa-lightbulb ic-icon"></i>
                                <span class="ic-title">${item.title}</span>
                                <span class="ic-tag">${item.tag}</span>
                            </div>
                            <i class="fa-solid fa-xmark ic-close" onclick="this.closest('.insight-card').remove()"></i>
                        </div>
                        <div class="ic-desc">${item.desc}</div>
                        <div class="rec-toggle" onclick="toggleRec('${uniqueId}')">
                            View personalized tip <i id="icon-${uniqueId}" class="fa-solid fa-chevron-down"></i>
                        </div>
                        <div class="rec-box" id="${uniqueId}">
                            <strong>Strategy:</strong><br>${item.rec}
                        </div>
                    </div>`;
                container.innerHTML += html;
            });
        }
    } catch (error) {
        console.error("Error generating insights:", error);
        if (container) {
            container.innerHTML = '<div class="empty-state-text">Error loading insights. Please try again.</div>';
        }
    }
}

// --- INITIALIZATION ---

// Inject simple styles for the progress bars
const styleSheet = document.createElement("style");
styleSheet.innerText = `
    .progress-fill-trigger { background-color: #e11d48; }
    .progress-fill-coping { background-color: #16a34a; }
    .progress-fill-symptom { background-color: #9333ea; }
`;
document.head.appendChild(styleSheet);

function toggleSidebar() {
    const pageContainer = document.getElementById('page-container');
    if (pageContainer) pageContainer.classList.toggle('sidebar-collapsed');
}

window.onload = function() {
    const pageContainer = document.getElementById('page-container');
    if (pageContainer) switchView('timeline');
    checkUserSession();
    generateInsights();
};