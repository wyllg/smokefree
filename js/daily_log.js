// js/daily_log.js

const welcomeUser = document.getElementById('welcome-user');
const symptomLogForm = document.getElementById('symptom-log-form');
const cravingsSlider = document.getElementById('symptom-cravings-slider');
const anxietySlider = document.getElementById('symptom-anxiety-slider');
const reflectionBox = document.getElementById('symptom-reflection-box');

// --- DATE SYNC LOGIC ---
const params = new URLSearchParams(window.location.search);
const dateParam = params.get('date');

const todayDateObj = new Date();
const z = todayDateObj.getTimezoneOffset() * 60000;
const localTodayISO = new Date(todayDateObj.getTime() - z).toISOString().split('T')[0];
const targetISO = dateParam || localTodayISO;

let existingEntry = {};

function logout() {
    localStorage.removeItem('username');
    try{window.location.href = 'login.html';}catch(e){}
}

async function checkUserSession() {
    const username = localStorage.getItem('username');
    if (!username) {
        try{window.location.href = 'login.html';}catch(e){}
    } else {
        if(welcomeUser) welcomeUser.textContent = "Welcome, " + username;

        // Display Date
        const targetDateObj = new Date(targetISO);
        const displayDate = new Date(targetDateObj.valueOf() + targetDateObj.getTimezoneOffset() * 60000);
        const dateEl = document.getElementById('daily-log-date-display');
        if(dateEl) dateEl.textContent = displayDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        // Load Data
        const logs = await ApiService.getLogs();
        existingEntry = logs.find(e => e.date === targetISO) || {};

        if (existingEntry.id) {
            loadSymptomLog(existingEntry);
            const badge = document.getElementById('daily-log-entry-badge');
            if(badge) badge.classList.remove('hidden');
        }
    }
}

// --- VISUAL LOGIC (Slider Colors) ---
function updateSlider(sliderId, badgeId, summaryId, statCardId) {
    const slider = document.getElementById(sliderId);
    const badge = document.getElementById(badgeId);
    const summary = document.getElementById(summaryId);
    const statCard = document.getElementById(statCardId);

    function update() {
        if (!slider) return;
        const val = parseInt(slider.value);
        if(badge) badge.textContent = val;
        if(summary) summary.textContent = val;

        let gradientClass, iconColor;
        const percentage = (val / 10) * 100;

        // Logic to match your CSS classes
        if (val === 0) {
            gradientClass = 'neutral';
            iconColor = '#64748b';
        } else if (val <= 3) {
            gradientClass = 'gradient-good';
            iconColor = '#059669'; // Green
        } else if (val <= 6) {
            gradientClass = 'gradient-mid';
            iconColor = '#d97706'; // Orange
        } else {
            gradientClass = 'gradient-bad';
            iconColor = '#dc2626'; // Red
        }

        // Update Slider Background
        slider.style.background = `linear-gradient(to right, ${iconColor} 0%, ${iconColor} ${percentage}%, #e2e8f0 ${percentage}%, #e2e8f0 100%)`;

        // Update Badge Color
        if(badge) {
            if(val === 0) {
                badge.style.background = '#e2e8f0';
                badge.style.color = '#64748b';
            } else {
                badge.style.background = iconColor;
                badge.style.color = 'white';
            }
        }

        // Update Card Class
        if(statCard) {
            statCard.className = `card stat-card ${gradientClass}`;

            // Fix icon colors inside card
            const iconBox = statCard.querySelector('.icon-box');
            const title = statCard.querySelector('.stat-title');
            const desc = statCard.querySelector('.stat-desc');

            if(iconBox && title && desc) {
                if (gradientClass === 'neutral') {
                    title.style.color = 'var(--navy)';
                    desc.style.color = 'var(--dusty)';
                    iconBox.style.color = '#64748b';
                    iconBox.style.background = 'var(--bg-light)';
                } else {
                    const colors = {
                        'gradient-good': '#065f46',
                        'gradient-mid': '#92400e',
                        'gradient-bad': '#991b1b'
                    };
                    title.style.color = colors[gradientClass];
                    desc.style.color = colors[gradientClass];
                    iconBox.style.color = iconColor;
                    iconBox.style.background = 'white';
                }
            }
        }
    }

    if (slider) {
        slider.addEventListener('input', update);
        slider.addEventListener('change', update);
        update();
    }
    return update;
}

const updateCravings = updateSlider('symptom-cravings-slider', 'symptom-cravings-badge', 'crave-summary', 'stat-card-cravings');
const updateAnxiety = updateSlider('symptom-anxiety-slider', 'symptom-anxiety-badge', 'anxiety-summary', 'stat-card-anxiety');

// --- SELECTION LOGIC ---
function selectOption(groupName, element) {
    const list = element.closest('.option-list');
    const items = list.querySelectorAll('.option-item');

    // Toggle logic
    if(element.classList.contains('selected')) {
        element.classList.remove('selected');
    } else {
        items.forEach(item => item.classList.remove('selected'));
        element.classList.add('selected');
    }
}

function toggleCheck(event, label) {
    event.preventDefault(); // Prevent double click on label/input
    label.classList.toggle('active');
    const checkbox = label.querySelector('input');
    if(checkbox) checkbox.checked = !checkbox.checked;
    updateCounts();
}

function updateCounts() {
    // Triggers
    const tGrid = document.getElementById('trigger-grid');
    if(tGrid) {
        const triggerCount = tGrid.querySelectorAll('.checkbox-label.active').length;
        const triggerCard = document.getElementById('stat-card-triggers');
        const triggerBadge = document.getElementById('trigger-count');

        if(triggerBadge) triggerBadge.textContent = triggerCount;
        if(triggerCard) {
            if (triggerCount > 0) triggerCard.className = 'card stat-card gradient-purple';
            else triggerCard.className = 'card stat-card neutral';
        }
    }

    // Coping
    const cGrid = document.getElementById('coping-grid');
    if(cGrid) {
        const copingCount = cGrid.querySelectorAll('.checkbox-label.active').length;
        const copingCard = document.getElementById('stat-card-coping');
        const copingBadge = document.getElementById('coping-count');

        if(copingBadge) copingBadge.textContent = copingCount;
        if(copingCard) {
            if (copingCount > 0) copingCard.className = 'card stat-card gradient-brown';
            else copingCard.className = 'card stat-card neutral';
        }
    }
}

// --- FORM MANAGEMENT ---
function clearSymptomForm() {
    if (cravingsSlider) cravingsSlider.value = 0;
    if (anxietySlider) anxietySlider.value = 0;
    if (updateCravings) updateCravings();
    if (updateAnxiety) updateAnxiety();

    document.querySelectorAll('.option-item').forEach(item => item.classList.remove('selected'));
    document.querySelectorAll('.checkbox-label').forEach(label => {
        label.classList.remove('active');
        const checkbox = label.querySelector('input');
        if(checkbox) checkbox.checked = false;
    });

    if (reflectionBox) reflectionBox.value = '';
    updateCounts();
}

function loadSymptomLog(entry) {
    clearSymptomForm();

    if (entry) {
        if(cravingsSlider) cravingsSlider.value = entry.cravings || 0;
        if(anxietySlider) anxietySlider.value = entry.anxiety || 0;

        // Mood/Sleep Options
        document.querySelectorAll('.option-item').forEach(item => {
            const listId = item.closest('.option-list').id;
            const group = listId.includes('mood') ? 'mood' : 'sleep';
            if (entry[group] === item.dataset.value) item.classList.add('selected');
        });

        // Checkboxes (Triggers/Coping/Physical)
        document.querySelectorAll('.checkbox-label').forEach(label => {
            const dataKey = label.dataset.value;
            let arrayKey;
            if (label.closest('#trigger-grid')) arrayKey = 'triggers';
            else if (label.closest('#coping-grid')) arrayKey = 'coping';
            else if (label.closest('#physical-symptoms-grid')) arrayKey = 'physical';

            if (arrayKey && entry[arrayKey] && entry[arrayKey].includes(dataKey)) {
                label.classList.add('active');
                const cb = label.querySelector('input');
                if(cb) cb.checked = true;
            }
        });

        if(reflectionBox) reflectionBox.value = entry.reflection || entry.notes || '';
    }

    if(updateCravings) updateCravings();
    if(updateAnxiety) updateAnxiety();
    updateCounts();
}

// --- SAVE ---
if(symptomLogForm) {
    symptomLogForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const cravings = cravingsSlider ? parseInt(cravingsSlider.value) : 0;
        const anxiety = anxietySlider ? parseInt(anxietySlider.value) : 0;

        const moodItem = document.querySelector('#mood-list .option-item.selected');
        const mood = moodItem ? moodItem.dataset.value : null;

        const sleepItem = document.querySelector('#sleep-list .option-item.selected');
        const sleep = sleepItem ? sleepItem.dataset.value : null;

        const getCheckedValues = (selector) => {
            const els = document.querySelectorAll(selector + ' .checkbox-label.active');
            return Array.from(els).map(label => label.dataset.value);
        };

        const triggers = getCheckedValues('#trigger-grid');
        const coping = getCheckedValues('#coping-grid');
        const physical = getCheckedValues('#physical-symptoms-grid');
        const reflection = reflectionBox ? reflectionBox.value.trim() : "";

        // Merge with existing logic
        const entryData = {
            ...existingEntry,
            date: targetISO,
            cravings,
            anxiety,
            mood,
            sleep,
            triggers,
            coping,
            physical,
            reflection,
            // If they are logging symptoms, assume partial or preserve status
            status: existingEntry.status || 'partial',
            // Don't overwrite ID if it exists
            id: existingEntry.id
        };

        await ApiService.saveLog(entryData);

        const badge = document.getElementById('daily-log-entry-badge');
        if(badge) badge.classList.remove('hidden');

        alert(`Log for ${targetISO} saved!`);
        window.location.href = 'progress.html';
    });
}

// FOR SIDEBAR TOGGLE //
function toggleSidebar() {
    const pageContainer = document.getElementById('page-container');
    // The 'page-container' ID is assumed to be on the <body> element
    if (pageContainer) {
        pageContainer.classList.toggle('sidebar-collapsed');
    }
}


// Initialize
window.onload = checkUserSession;

