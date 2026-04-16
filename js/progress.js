function logout() {
    localStorage.removeItem('username');
    try{window.location.href = 'login.html';}catch(e){}
}

window.onload = async function() {
    const user = localStorage.getItem('username');
    if (!user) { try{window.location.href='login.html';}catch(e){} return; }
    document.getElementById('welcome-user').textContent = "Welcome, " + user;

    // FETCH DATA FROM BACKEND
    const logs = await ApiService.getLogs();
    // Sort oldest to newest for charts
    const sortedLogs = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));

    renderTimeline(sortedLogs);
    renderAnalytics(sortedLogs);
};

function renderTimeline(data) {
    const container = document.getElementById('timeline-list');
    container.innerHTML = '';

    if (data.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px; color:#94a3b8;">No logs found in backend.</div>';
        return;
    }

    // Timeline needs newest on top
    const reversedData = [...data].reverse();
    const startDate = new Date(data[0].date); // Oldest date

    reversedData.forEach((item, index) => {
        let iconClass = 'tc-icon-good';
        let icon = 'fa-check';
        let statusText = 'Smoke-Free Day';
        let badgeClass = 'tag-status-good';

        if (item.status === 'relapse') {
            iconClass = 'tc-icon-bad';
            icon = 'fa-xmark';
            statusText = 'Relapse Day';
            badgeClass = 'tag-status-bad';
        } else if (item.status === 'partial') {
            iconClass = 'style="background-color: #3b82f6;"';
            icon = 'fa-pen-to-square';
            statusText = 'Symptoms Logged';
            badgeClass = 'tag-latest';
        }

        const dateObj = new Date(item.date);
        const displayDate = new Date(dateObj.valueOf() + dateObj.getTimezoneOffset() * 60000);
        const diffTime = Math.abs(dateObj - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        const dateStr = displayDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

        const html = `
        <div class="timeline-card">
            <div class="tc-icon-box ${iconClass.includes('style') ? '' : iconClass}" ${iconClass.includes('style') ? iconClass : ''}><i class="fa-solid ${icon}"></i></div>
            <div class="tc-content">
                <div class="tc-day-label">Day ${diffDays}</div>
                <div class="tc-date">${dateStr}</div>
            </div>
            <div class="tc-badges">
                <span class="badge-tag ${badgeClass}">${statusText}</span>
            </div>
        </div>
        `;
        container.innerHTML += html;
    });
}

function renderAnalytics(data) {
    if(data.length === 0) return;

    // Prepare Labels
    const labels = data.map(d => {
        const dateObj = new Date(d.date);
        const displayDate = new Date(dateObj.valueOf() + dateObj.getTimezoneOffset() * 60000);
        return `${displayDate.toLocaleString('default', { month: 'short' })} ${displayDate.getDate()}`;
    });

    // 1. Status Chart
    const ctxStatus = document.getElementById('statusChart').getContext('2d');
    new Chart(ctxStatus, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Status',
                data: data.map(d => d.status === 'free' ? 1 : (d.status === 'relapse' ? 0.2 : 0)),
                backgroundColor: data.map(d => d.status === 'free' ? '#05CD99' : (d.status === 'relapse' ? '#EE5D50' : 'transparent')),
                borderRadius: 8
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { display: false, max: 1.2 }, x: { grid: { display: false } } } }
    });

    // 2. Sleep Chart
    const sleepScore = (s) => {
        if(s === "Very Good") return 10;
        if(s === "Good") return 7.5;
        if(s === "Poor") return 5;
        if(s === "Very Poor") return 2.5;
        return 0;
    };
    const ctxSleep = document.getElementById('sleepChart').getContext('2d');
    new Chart(ctxSleep, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sleep Quality',
                data: data.map(d => sleepScore(d.sleep)),
                borderColor: '#4318FF', backgroundColor: 'rgba(67, 24, 255, 0.1)', fill: true, tension: 0.4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 10 }, x: { grid: { display: false } } } }
    });

    // 3. Symptoms Chart
    const moodScore = (m) => {
        if(!m || m.includes("None")) return 10;
        if(m.includes("Mild")) return 7;
        if(m.includes("Moderate")) return 4;
        if(m.includes("Severe")) return 1;
        return 5;
    };
    const ctxSymptoms = document.getElementById('symptomsChart').getContext('2d');
    new Chart(ctxSymptoms, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: 'Mood', data: data.map(d => moodScore(d.mood)), borderColor: '#05CD99', tension: 0.4 },
                { label: 'Anxiety', data: data.map(d => d.anxiety), borderColor: '#F4A74B', tension: 0.4 },
                { label: 'Cravings', data: data.map(d => d.cravings), borderColor: '#EE5D50', tension: 0.4 }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { y: { min: 0, max: 10 }, x: { grid: { display: false } } } }
    });
}

function switchView(view) {
    const t = document.getElementById('view-timeline');
    const a = document.getElementById('view-analytics');
    const bt = document.getElementById('btn-timeline');
    const ba = document.getElementById('btn-analytics');

    if(view === 'timeline') {
        t.style.display = 'block'; a.classList.remove('active');
        bt.classList.add('active'); ba.classList.remove('active');
    } else {
        t.style.display = 'none'; a.classList.add('active');
        bt.classList.remove('active'); ba.classList.add('active');
    }
}

//  SIDEBAR TOGGLE //
function toggleSidebar() {
    const pageContainer = document.getElementById('page-container');
    // The 'page-container' ID is assumed to be on the <body> element
    if (pageContainer) {
        pageContainer.classList.toggle('sidebar-collapsed');
    }
}