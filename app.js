// Hotel checklist synced with Google Sheets API
const API_URL = "https://script.google.com/macros/s/AKfycbwHhKLCJJV8RCd4FLNJIbpEsqo59wi705qyN2jVckS7V43MR4kubykveESQEdAEamnB/exec";

const appData = {
    categories: [
        {id: "Duschlippen", name: "Duschlippen"},
        {id: "filter gereinigt", name: "filter gereinigt"},
        {id: "wasserhahn einsatz", name: "wasserhahn einsatz"},
        {id: "silikon erneuert", name: "silikon erneuert"},
        {id: "sonstige mangel", name: "sonstige mangel"}
    ],
    rooms: {
        floor1: [101,102,103,104,105,106,107,108,109,110,111,113,114,115,116,117,118,119,120,121,122,123,125,127,129,131,132,133,134,136,138,140,142,144],
        floor2: [201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240],
        floor3: [301,302,303,304,305,306,307,308,309,310,311,312,313,314,315,316,317,318,319,320,321,322,323,324,325,326,327,328,329,330,331,332,333,334,335,336,337,338,339,340]
    }
};

let appState = {
    currentTab: 'Duschlippen',
    checklistData: {},
    notes: {}
};

async function fetchData() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        // Initialize data structures
        appData.categories.forEach(cat => {
            appState.checklistData[cat.id] = {};
            appState.notes[cat.id] = {};
        });

        // Populate from API data
        data.forEach(entry => {
            if (appState.checklistData[entry.category] && entry.room) {
                appState.checklistData[entry.category][entry.room] = entry.checked === true || entry.checked === 'TRUE' || entry.checked === 'true';
                appState.notes[entry.category][entry.room] = entry.note || '';
            }
        });

    } catch (error) {
        console.error("Error fetching data from Google Sheets API:", error);
        alert("Fehler beim Laden der Daten. Stellen Sie sicher, dass die API erreichbar ist.");
    }
}

async function sendUpdate(category, room, checked, note) {
    try {
        const payload = {
            category,
            room,
            checked,
            note: note || ""
        };
        await fetch(API_URL, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
    } catch (error) {
        console.error("Error sending update to Google Sheets API:", error);
    }
}

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

    // Render floors
    ['floor1', 'floor2', 'floor3'].forEach(floor => {
        const floorLabel = document.createElement('div');
        floorLabel.className = 'floor-separator';
        floorLabel.textContent = floor.replace('floor', 'Etage ') +
            (floor === 'floor1' ? ' (Zimmer 101-144)' : floor === 'floor2' ? ' (Zimmer 201-240)' : ' (Zimmer 301-340)');
        container.appendChild(floorLabel);

        const roomGrid = document.createElement('div');
        roomGrid.className = 'room-grid';

        appData.rooms[floor].forEach(room => {
            const roomItem = document.createElement('div');
            roomItem.className = 'room-item';

            const roomCheckboxDiv = document.createElement('div');
            roomCheckboxDiv.className = 'room-checkbox';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `${appState.currentTab}-${room}`;
            checkbox.checked = !!appState.checklistData[appState.currentTab][room];
            checkbox.addEventListener('change', e => {
                appState.checklistData[appState.currentTab][room] = e.target.checked;
                sendUpdate(appState.currentTab, room, e.target.checked, appState.notes[appState.currentTab][room]);
                renderProgressOverview();
            });

            const label = document.createElement('label');
            label.setAttribute('for', checkbox.id);
            label.textContent = room;

            roomCheckboxDiv.appendChild(checkbox);
            roomCheckboxDiv.appendChild(label);

            const noteBtn = document.createElement('button');
            noteBtn.className = 'note-btn';
            const hasNote = appState.notes[appState.currentTab][room] && appState.notes[appState.currentTab][room].trim() !== '';
            noteBtn.textContent = hasNote ? '📝' : 'Notiz';
            if (hasNote) {
                noteBtn.classList.add('has-note');
            }
            noteBtn.addEventListener('click', () => openNoteModal(room));

            roomItem.appendChild(roomCheckboxDiv);
            roomItem.appendChild(noteBtn);
            roomGrid.appendChild(roomItem);
        });

        container.appendChild(roomGrid);
    });
}

function setAllCheckboxes(checked) {
    Object.keys(appState.checklistData[appState.currentTab]).forEach(room => {
        appState.checklistData[appState.currentTab][room] = checked;
        sendUpdate(appState.currentTab, room, checked, appState.notes[appState.currentTab][room]);
    });
    renderCurrentTabContent();
    renderProgressOverview();
}

function openNoteModal(room) {
    const modal = document.getElementById('notesModal');
    const roomNumberSpan = document.getElementById('modalRoomNumber');
    const noteTextarea = document.getElementById('noteTextarea');

    roomNumberSpan.textContent = room;
    noteTextarea.value = appState.notes[appState.currentTab][room] || '';
    modal.style.display = 'block';

    modal.dataset.room = room;
    modal.dataset.category = appState.currentTab;
}

function closeNoteModal() {
    const modal = document.getElementById('notesModal');
    modal.style.display = 'none';
}

async function saveNote() {
    const modal = document.getElementById('notesModal');
    const noteTextarea = document.getElementById('noteTextarea');
    const room = modal.dataset.room;
    const category = modal.dataset.category;

    const newNote = noteTextarea.value;
    appState.notes[category][room] = newNote;

    await sendUpdate(category, room, appState.checklistData[category][room], newNote);
    closeNoteModal();
    renderCurrentTabContent();
    renderProgressOverview();
}

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

        const totalRooms = Object.keys(appState.checklistData[category.id] || {}).length;
        const completedCount = Object.values(appState.checklistData[category.id] || {}).filter(val => val).length;
        const progressPercent = totalRooms ? (completedCount / totalRooms) * 100 : 0;

        progressFill.style.width = progressPercent + '%';
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

function initializeModal() {
    const modal = document.getElementById('notesModal');
    const closeBtn = modal.querySelector('.close');
    const saveBtn = document.getElementById('saveNote');
    const cancelBtn = document.getElementById('cancelNote');

    closeBtn.addEventListener('click', closeNoteModal);
    cancelBtn.addEventListener('click', closeNoteModal);
    saveBtn.addEventListener('click', saveNote);

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeNoteModal();
        }
    });
}

async function init() {
    await fetchData();
    renderTabs();
    renderCurrentTabContent();
    renderProgressOverview();
    updateLastModified();
    initializeModal();

    setInterval(updateLastModified, 60000);
}

document.addEventListener('DOMContentLoaded', init);
