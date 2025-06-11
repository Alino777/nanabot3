// lab.js (Versione 6.0 - Logica per la Centrale di Configurazione)

document.addEventListener('DOMContentLoaded', () => {
    // --- Stato dell'Applicazione ---
    let state = {
        assistantEnabled: true,
        exceptions: new Set(['Celiachia']),
        welcomeMessage: "Ciao {nome_paziente}! Sono il tuo assistente virtuale...",
        quickQuestions: [
            { id: 1, q: "Cosa posso mangiare a colazione?", a: "..." },
        ],
        selectedPatient: "Mario Rossi",
    };

    // --- Riferimenti al DOM ---
    const editWelcomeBtn = document.getElementById('edit-welcome-btn');
    const addQuickQuestionBtn = document.getElementById('add-quick-question-btn');
    const manageAllBtn = document.getElementById('manage-all-btn');
    const resetTrainingBtn = document.getElementById('reset-training-btn');
    
    // Modale
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelModalBtn = document.getElementById('cancel-modal-btn');
    const saveModalBtn = document.getElementById('save-modal-btn');

    // ... (altri riferimenti al DOM che già avevamo)

    // --- Logica Modale Dinamica ---
    function openModal(type) {
        switch (type) {
            case 'welcomeMessage':
                modalTitle.textContent = "Modifica Messaggio di Benvenuto";
                modalBody.innerHTML = `
                    <div class="form-group">
                        <label for="modal-welcome-message">Messaggio (usa <code>{nome_paziente}</code>)</label>
                        <textarea id="modal-welcome-message" rows="4">${state.welcomeMessage}</textarea>
                    </div>`;
                break;
            case 'addQuestion':
                modalTitle.textContent = "Aggiungi Domanda Rapida";
                modalBody.innerHTML = `
                    <div class="form-group">
                        <label for="modal-question">Domanda del paziente</label>
                        <textarea id="modal-question" rows="3" placeholder="Es. Posso bere caffè?"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="modal-answer">La tua risposta pre-impostata</label>
                        <textarea id="modal-answer" rows="6" placeholder="Scrivi la risposta..."></textarea>
                    </div>`;
                break;
        }
        modal.classList.remove('hidden');
    }

    function closeModal() {
        modal.classList.add('hidden');
    }

    // --- Gestione Eventi ---
    editWelcomeBtn.addEventListener('click', () => openModal('welcomeMessage'));
    addQuickQuestionBtn.addEventListener('click', () => openModal('addQuestion'));
    
    manageAllBtn.addEventListener('click', () => {
        alert("Navigazione alla pagina di gestione (da implementare).");
    });

    resetTrainingBtn.addEventListener('click', () => {
        if (confirm("Sei sicuro di voler resettare tutto? L'azione è irreversibile.")) {
            alert("Reset in corso... (simulazione)");
            // In futuro, questo reindirizzerà a / o chiamerà un'API di reset.
        }
    });

    closeModalBtn.addEventListener('click', closeModal);
    cancelModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // ... (Tutta la logica esistente per le altre parti rimane qui)
});