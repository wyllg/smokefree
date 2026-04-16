const todayDate = new Date();
const getLocalISO = (d) => {
    const z = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - z).toISOString().split('T')[0];
};
const todayISO = getLocalISO(todayDate);
let currentCalendarDate = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
let globalLogs = [];

function logout() {
    localStorage.removeItem('username');
    try { window.location.href = 'login.html'; } catch(e) { console.log("Redirect fail"); }
}

async function loadDashboardData() {
    globalLogs = await ApiService.getLogs();
    renderStats(globalLogs);
    renderRecentActivity(globalLogs);
    initCalendar();
}

function renderStats(entries) {
    const total = entries.length;
    const free = entries.filter(e => e.status === 'free').length;
    const relapse = entries.filter(e => e.status === 'relapse').length;

    // Safely update elements if they exist
    if(document.getElementById('stat-total')) document.getElementById('stat-total').textContent = total;
    if(document.getElementById('stat-free')) document.getElementById('stat-free').textContent = free;
    if(document.getElementById('stat-relapse')) document.getElementById('stat-relapse').textContent = relapse;

    let streak = 0;
    let checkDate = new Date(todayDate);
    let keepChecking = true;
    while(keepChecking) {
        const dStr = getLocalISO(checkDate);
        const entry = entries.find(e => e.date === dStr);
        if(entry && entry.status === 'free') streak++;
        else if(entry && entry.status === 'relapse') keepChecking = false;
        else if(dStr !== todayISO) keepChecking = false;
        checkDate.setDate(checkDate.getDate()-1);
    }
    if(document.getElementById('stat-streak')) document.getElementById('stat-streak').textContent = streak;
    const loggedToday = entries.find(e => e.date === todayISO);
    updateDailyCardUI(loggedToday);
}

function updateDailyCardUI(entry) {
    const card = document.getElementById('daily-status-card');
    const iconDiv = document.getElementById('daily-card-icon');
    const title = document.getElementById('daily-card-title');
    const subtitle = document.getElementById('daily-checkin-date');
    const actionsDiv = document.getElementById('daily-card-actions');

    if(!card) return;

    const dateText = todayDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    if(entry) {
        card.className = 'daily-card completed';
        iconDiv.style.display = 'flex';
        iconDiv.innerHTML = entry.status === 'free'
        ? '<i class="fa-solid fa-check" style="font-size: 30px;"></i>'
        : '<i class="fa-solid fa-triangle-exclamation" style="font-size: 30px;"></i>';

        title.textContent = entry.status === 'free' ? "You're all set!" : "Relapse Logged";
        subtitle.textContent = `Status recorded for ${dateText}.`;

        actionsDiv.innerHTML = `
        <button class="btn-action" style="background:white; color:var(--navy); border:1px solid var(--navy); justify-content:center; width:100%;" onclick="openLogModal('${todayISO}')">
            <i class="fa-solid fa-pen-to-square"></i><span>Edit Today's Log</span>
        </button>
        `;
    } else {
        card.className = 'daily-card';
        iconDiv.style.display = 'none';
        title.textContent = "How are you today?";
        title.style.fontSize = "22px";
        subtitle.textContent = `Please log your status for ${dateText}.`;

        actionsDiv.innerHTML = `
        <div style="display: flex; gap: 15px;">
            <button class="btn-action" style="flex: 1; justify-content: center; background: var(--green-light); color: var(--green-text); border: 1px solid var(--green-text); padding: 20px; flex-direction: column; gap: 5px;" onclick="logQuickAction('${todayISO}', 'free')">
                <i class="fa-solid fa-check" style="font-size: 24px;"></i>
                <span style="font-size: 14px;">I feel Great</span>
            </button>
            <button class="btn-action" style="flex: 1; justify-content: center; background: var(--red-light); color: var(--red-text); border: 1px solid var(--red-text); padding: 20px; flex-direction: column; gap: 5px;" onclick="logQuickAction('${todayISO}', 'relapse')">
                <i class="fa-solid fa-xmark" style="font-size: 24px;"></i>
                <span style="font-size: 14px;">I had a Relapse</span>
            </button>
        </div>
        `;
    }
}

function renderRecentActivity(entries) {
    const list = document.getElementById('activity-list');
    if(!list) return;
    list.innerHTML = '';
    if(entries.length === 0) { list.innerHTML='<div class="no-activity">No logs yet.</div>'; return; }

    entries.slice(0, 5).forEach(e => {
        const isFree = e.status === 'free';
        const html = `
        <div class="activity-item">
            <div class="activity-icon ${isFree?'icon-free':'icon-relapse'}"><i class="fa-solid ${isFree?'fa-check':'fa-xmark'}"></i></div>
            <div class="activity-info"><h4>${isFree?'Nicotine-Free':'Relapse'}</h4><p>${e.notes || e.reflection || 'No notes'}</p></div>
            <span class="status-badge ${isFree?'badge-free':'badge-relapse'}">${e.date}</span>
        </div>`;
        list.innerHTML += html;
    });
}

function initCalendar() {
    const grid = document.getElementById('calendar-grid');
    if(!grid) return;
    grid.innerHTML = '<div class="day-name">SUN</div><div class="day-name">MON</div><div class="day-name">TUE</div><div class="day-name">WED</div><div class="day-name">THU</div><div class="day-name">FRI</div><div class="day-name">SAT</div>';
    document.getElementById('current-month').textContent = currentCalendarDate.toLocaleDateString('en-US', {month:'long', year:'numeric'});

    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month+1, 0).getDate();

    for(let i=0; i<firstDay; i++) grid.innerHTML += '<div class="empty"></div>';

    for(let i=1; i<=daysInMonth; i++) {
        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
        const entry = globalLogs.find(e => e.date === dateStr);

        let className = 'day-num';
        if(entry && entry.status === 'free') className += ' status-free';
        if(entry && entry.status === 'relapse') className += ' status-relapse';
        if(dateStr === todayISO) className += ' is-today';

        const div = document.createElement('div');
        div.className = className;
        div.textContent = i;
        div.onclick = () => handleCalendarClick(dateStr);
        grid.appendChild(div);
    }
}

function changeMonth(d) { currentCalendarDate.setMonth(currentCalendarDate.getMonth()+d); initCalendar(); }

function handleCalendarClick(dateStr) {
    if (dateStr > todayISO) {
        alert("You cannot log for future dates.");
        return;
    }
    openLogModal(dateStr);
}

// --- MODAL LOGIC ---
const modal = document.getElementById('log-modal');
const dateInput = document.getElementById('log-date');
const statusInput = document.getElementById('selected-status');
const notesInput = document.getElementById('log-notes');
const deleteBtn = document.getElementById('btn-delete-entry');

function openLogModal(dateStr) {
    const targetDate = dateStr || todayISO;
    dateInput.value = targetDate;
    document.getElementById('modal-date-display').textContent = targetDate;

    const entry = globalLogs.find(e => e.date === targetDate);
    if(entry) {
        selectStatus(entry.status);
        notesInput.value = entry.notes || entry.reflection || '';
        deleteBtn.style.display = 'block';
    } else {
        selectStatus(null);
        notesInput.value = '';
        deleteBtn.style.display = 'none';
    }
    modal.classList.add('open');
}

function closeLogModal() { modal.classList.remove('open'); }

function selectStatus(s) {
    statusInput.value = s || '';
    const btnFree = document.getElementById('status-free-btn');
    const btnRelapse = document.getElementById('status-relapse-btn');

    if(btnFree) btnFree.className = `btn-status ${s==='free'?'selected-free':''}`;
    if(btnRelapse) btnRelapse.className = `btn-status ${s==='relapse'?'selected-relapse':''}`;
}

async function deleteCurrentEntry() {
    if(confirm("Clear entry for this date?")) {
        await ApiService.deleteLog(dateInput.value);
        closeLogModal();
        await loadDashboardData();
    }
}

async function logQuickAction(dateStr, status) {
    const existingEntry = globalLogs.find(e => e.date === dateStr) || {};
    await ApiService.saveLog({
        ...existingEntry,
        date: dateStr,
        status: status,
        notes: existingEntry.notes || "Quick Log from Dashboard",
        cravings: existingEntry.cravings || 0,
        anxiety: existingEntry.anxiety || 0
    });
    window.location.href = `daily_log.html?date=${dateStr}`;
}

// SIDEBAR TOGGLE //
function toggleSidebar() {
    const pageContainer = document.getElementById('page-container');
    // The 'page-container' ID is assumed to be on the <body> element
    if (pageContainer) {
        pageContainer.classList.toggle('sidebar-collapsed');
    }
}

// Initialize
window.onload = async function() {
    const user = localStorage.getItem('username');
    if(!user) {
        try { window.location.href='login.html'; } catch(e) {}
        return;
    }
    const welcome = document.getElementById('welcome-user');
    if(welcome) welcome.textContent = "Welcome, " + user;

    // Setup form listener here to ensure elements exist
    const logForm = document.getElementById('log-form');
    if(logForm) {
        logForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if(!statusInput.value) { alert("Select status"); return; }

            const targetDate = dateInput.value;
            const existingEntry = globalLogs.find(e => e.date === targetDate) || {};

            const payload = {
                ...existingEntry,
                date: targetDate,
                status: statusInput.value,
                notes: notesInput.value,
                cravings: existingEntry.cravings || 0,
                anxiety: existingEntry.anxiety || 0
            };

            await ApiService.saveLog(payload);
            closeLogModal();
            window.location.href = `daily_log.html?date=${targetDate}`;
        });
    }

    await loadDashboardData();
};