// Application data
const appData = {
    categories: [
        {id: "duschlippen", name: "Duschlippen"},
        {id: "filter", name: "filter gereinigt"},
        {id: "wasserhahn", name: "wasserhahn einsatz"},
        {id: "silikon", name: "silikon erneuert"},
        {id: "sonstige", name: "sonstige mangel"}
    ],
    rooms: {
        floor1: [101,102,103,104,105,106,107,108,109,110,111,113,114,115,116,117,118,119,120,121,122,123,125,127,129,131,132,133,134,136,138,140,142,144],
        floor2: [201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240],
        floor3: [301,302,303,304,305,306,307,308,309,310,311,312,313,314,315,316,317,318,319,320,321,322,323,324,325,326,327,328,329,330,331,332,333,334,335,336,337,338,339,340]
    },
    teamMembers: ["Mathias", "Micael", "Michael"]
};

// Application state
let appState = {
    currentTab: 'duschlippen',
    checklistData: {},
    notes: {},
    lastResetDate: null
};

// Initialize checklist data
function initializeChecklistData() {
    appData.categories.forEach(category => {
        if (!appState.checklistData[category.id]) {
            appState.checklistData[category.id] = {};
        }
        if (!appState.notes[category.id]) {
            appState.notes[category.id] = {};
        }
        ['floor1', 'floor2', 'floor3'].forEach(floor => {
            appData.rooms[floor].forEach(room => {
                if (appState.checklistData[category.id][room] === undefined) {
                    appState.checklistData[category.id][room] = false;
                }
                if (!appState.notes[category.id][room]) {
                    appState.notes[category.id][room] = '';
                }
            });
        });
    });
}

// Check if reset is needed (every 2 months)
function checkAutoReset() {
    const now = new Date();
    if (appState.lastResetDate) {
        const lastReset = new Date(appState.lastResetDate);
        const monthsDiff = (now.getFullYear() - lastReset.getFullYear()) * 12 + (now.getMonth() - lastReset.getMonth());

        if (monthsDiff >= 2) {
            if (confirm('Es sind mehr als 2 Monate seit dem letzten Reset vergangen. Möchten Sie alle Daten zurücksetzen für den neuen Kontrollzyklus?')) {
                resetAllData();
                return true;
            }
        }
    }
    return false;
}

// Reset all data
function resetAllData() {
    if (confirm('Sind Sie sicher, dass Sie alle Daten zurücksetzen möchten? Diese Aktion kann nicht rückgängig gemacht werden.')) {
        appState.checklistData = {};
        appState.notes = {};
        appState.lastResetDate = new Date().toISOString();
        initializeChecklistData();
        saveToLocalStorage();
        renderCurrentTabContent();
        renderProgressOverview();
        updateLastModified();
        alert('Alle Daten wurden erfolgreich zurückgesetzt.');
    }
}

// Save to localStorage
function saveToLocalStorage() {
    try {
        localStorage.setItem('hotelChecklist', JSON.stringify({
            checklistData: appState.checklistData,
            notes: appState.notes,
            lastResetDate: appState.lastResetDate
        }));
    } catch (e) {
        console.warn('Could not save to localStorage:', e);
    }
}

// Load from localStorage
function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem('hotelChecklist');
        if (saved) {
            const data = JSON.parse(saved);
            appState.checklistData = data.checklistData || {};
            appState.notes = data.notes || {};
            appState.lastResetDate = data.lastResetDate || null;
            return true;
        }
    } catch (e) {
        console.warn('Could not load from localStorage:', e);
    }
    return false;
}

// Render tabs
function renderTabs() {
    const tabsContainer = document.querySelector('.tabs');
    tabsContainer.innerHTML = '';
    appData.categories.forEach(category => {
        const tab = document.createElement('div');
        tab.className = 'tab' + (category.id === appState.currentTab ? ' active' : '');
        tab.textContent = category.name;
        tab.dataset.id = category.id;
        tab.addEventListener('click', () => {
            appState.currentTab = category.id;
            renderTabs();
            renderCurrentTabContent();
            renderProgressOverview();
        });
        tabsContainer.appendChild(tab);
    });
}

// Render room checkboxes for current tab
function renderCurrentTabContent() {
    const container = document.querySelector('.tab-content');
    container.innerHTML = '';

    // Controls
    const controls = document.createElement('div');
    controls.className = 'controls';
    const selectAllBtn = document.createElement('button');
    selectAllBtn.textContent = 'Alles auswählen';
    selectAllBtn.addEventListener('click', () => setAllCheckboxes(true));
    const deselectAllBtn = document.createElement('button');
    deselectAllBtn.textContent = 'Alle abwählen';
    deselectAllBtn.addEventListener('click', () => setAllCheckboxes(false));
    controls.appendChild(selectAllBtn);
    controls.appendChild(deselectAllBtn);
    container.appendChild(controls);

    // Render floors with rooms
    ['floor1', 'floor2', 'floor3'].forEach(floor => {
        const floorLabel = document.createElement('div');
        floorLabel.className = 'floor-separator';
        floorLabel.textContent = floor.replace('floor', 'Etage ').replace('1', '1 (Zimmer 101-144)').replace('2', '2 (Zimmer 201-240)').replace('3', '3 (Zimmer 301-340)');
        container.appendChild(floorLabel);

        const roomGrid = document.createElement('div');
        roomGrid.className = 'room-grid';

        appData.rooms[floor].forEach(room => {
            const roomItem = document.createElement('div');
            roomItem.className = 'room-item';

            const roomCheckbox = document.createElement('div');
            roomCheckbox.className = 'room-checkbox';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `${appState.currentTab}-${room}`;
            checkbox.checked = appState.checklistData[appState.currentTab][room];
            checkbox.addEventListener('change', (e) => {
                appState.checklistData[appState.currentTab][room] = e.target.checked;
                saveToLocalStorage();
                renderProgressOverview();
                updateLastModified();
            });

            const label = document.createElement('label');
            label.setAttribute('for', checkbox.id);
            label.textContent = room;

            roomCheckbox.appendChild(checkbox);
            roomCheckbox.appendChild(label);

            const noteBtn = document.createElement('button');
            noteBtn.className = 'note-btn';
            noteBtn.textContent = 'Notiz';
            const hasNote = appState.notes[appState.currentTab][room] && appState.notes[appState.currentTab][room].trim() !== '';
            if (hasNote) {
                noteBtn.classList.add('has-note');
                noteBtn.textContent = '📝';
            }
            noteBtn.addEventListener('click', () => openNoteModal(room));

            roomItem.appendChild(roomCheckbox);
            roomItem.appendChild(noteBtn);
            roomGrid.appendChild(roomItem);
        });

        container.appendChild(roomGrid);
    });
}

// Set all checkboxes in current tab
function setAllCheckboxes(checked) {
    Object.keys(appState.checklistData[appState.currentTab]).forEach(room => {
        appState.checklistData[appState.currentTab][room] = checked;
    });
    saveToLocalStorage();
    renderCurrentTabContent();
    renderProgressOverview();
    updateLastModified();
}

// Open note modal
function openNoteModal(room) {
    const modal = document.getElementById('notesModal');
    const roomNumberSpan = document.getElementById('modalRoomNumber');
    const noteTextarea = document.getElementById('noteTextarea');

    roomNumberSpan.textContent = room;
    noteTextarea.value = appState.notes[appState.currentTab][room] || '';
    modal.style.display = 'block';

    // Store current room for saving
    modal.dataset.room = room;
    modal.dataset.category = appState.currentTab;
}

// Close note modal
function closeNoteModal() {
    const modal = document.getElementById('notesModal');
    modal.style.display = 'none';
}

// Save note
function saveNote() {
    const modal = document.getElementById('notesModal');
    const noteTextarea = document.getElementById('noteTextarea');
    const room = modal.dataset.room;
    const category = modal.dataset.category;

    appState.notes[category][room] = noteTextarea.value;
    saveToLocalStorage();
    closeNoteModal();
    renderCurrentTabContent(); // Refresh to update note button appearance
    updateLastModified();
}

// Render progress overview
function renderProgressOverview() {
    const progressGrid = document.getElementById('progressGrid');
    progressGrid.innerHTML = '';

    appData.categories.forEach(category => {
        const progressItem = document.createElement('div');
        progressItem.className = 'progress-item';

        const label = document.createElement('span');
        label.className = 'progress-label';
        label.textContent = category.name;

        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';

        const progressFill = document.createElement('div');
        progressFill.className = 'progress-fill';

        const totalRooms = Object.keys(appState.checklistData[category.id]).length;
        const completedCount = Object.values(appState.checklistData[category.id]).filter(val => val).length;
        const progressPercent = totalRooms > 0 ? (completedCount / totalRooms) * 100 : 0;

        progressFill.style.width = progressPercent + '%';

        // Progress color coding
        if (completedCount === 0) {
            progressFill.style.backgroundColor = 'var(--color-error)';
        } else if (completedCount < totalRooms) {
            progressFill.style.backgroundColor = 'var(--color-warning)';
        } else {
            progressFill.style.backgroundColor = 'var(--color-success)';
        }

        progressBar.appendChild(progressFill);

        const progressText = document.createElement('span');
        progressText.className = 'progress-text';
        progressText.textContent = `${completedCount} von ${totalRooms} erledigt`;

        progressItem.appendChild(label);
        progressItem.appendChild(progressBar);
        progressItem.appendChild(progressText);

        progressGrid.appendChild(progressItem);
    });
}

// Update last modified timestamp
function updateLastModified() {
    const now = new Date();
    const lastUpdateSpan = document.getElementById('lastUpdate');
    if (lastUpdateSpan) {
        lastUpdateSpan.textContent = now.toLocaleString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Initialize modal event listeners
function initializeModal() {
    const modal = document.getElementById('notesModal');
    const closeBtn = modal.querySelector('.close');
    const saveBtn = document.getElementById('saveNote');
    const cancelBtn = document.getElementById('cancelNote');

    closeBtn.addEventListener('click', closeNoteModal);
    cancelBtn.addEventListener('click', closeNoteModal);
    saveBtn.addEventListener('click', saveNote);

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeNoteModal();
        }
    });
}

// Initialize reset button
function initializeResetButton() {
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetAllData);
    }
}

// Initialization
function init() {
    // Load saved data first
    loadFromLocalStorage();

    // Initialize data structure
    initializeChecklistData();

    // Check if auto-reset is needed
    checkAutoReset();

    // Render interface
    renderTabs();
    renderCurrentTabContent();
    renderProgressOverview();
    updateLastModified();

    // Initialize event listeners
    initializeModal();
    initializeResetButton();

    // Set initial last reset date if not set
    if (!appState.lastResetDate) {
        appState.lastResetDate = new Date().toISOString();
        saveToLocalStorage();
    }

    // Update timestamp every 60 seconds
    setInterval(updateLastModified, 60000);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);