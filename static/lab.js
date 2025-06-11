// lab.js (Versione 3.0 - Con logica per la modale)

document.addEventListener('DOMContentLoaded', () => {
    // --- Riferimenti agli Elementi del DOM per la Modale ---
    const addQuestionBtn = document.getElementById('add-quick-question-btn');
    const modalOverlay = document.getElementById('add-question-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelModalBtn = document.getElementById('cancel-modal-btn');
    const saveModalBtn = document.getElementById('save-modal-btn');
    const modalQuestionTextarea = document.getElementById('modal-question');
    const modalAnswerTextarea = document.getElementById('modal-answer');

    // --- Funzioni per la Modale ---

    function openModal() {
        modalOverlay.classList.remove('hidden');
    }

    function closeModal() {
        modalOverlay.classList.add('hidden');
    }

    // Controlla se entrambi i campi della modale sono stati riempiti
    function checkModalInputs() {
        const question = modalQuestionTextarea.value.trim();
        const answer = modalAnswerTextarea.value.trim();
        saveModalBtn.disabled = !(question && answer);
    }

    // --- Gestione Eventi per la Modale ---

    // Apre la modale
    addQuestionBtn.addEventListener('click', openModal);

    // Chiude la modale
    closeModalBtn.addEventListener('click', closeModal);
    cancelModalBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (event) => {
        // Chiude la modale solo se si clicca sullo sfondo grigio (overlay)
        if (event.target === modalOverlay) {
            closeModal();
        }
    });
    
    // Abilita il pulsante Salva
    modalQuestionTextarea.addEventListener('input', checkModalInputs);
    modalAnswerTextarea.addEventListener('input', checkModalInputs);

    // Gestione fittizia del salvataggio
    saveModalBtn.addEventListener('click', () => {
        const question = modalQuestionTextarea.value.trim();
        const answer = modalAnswerTextarea.value.trim();
        console.log('Domanda da salvare:', question);
        console.log('Risposta da salvare:', answer);
        
        // Svuota i campi e chiude la modale
        modalQuestionTextarea.value = '';
        modalAnswerTextarea.value = '';
        closeModal();

        // Qui in futuro aggiungeremo la domanda alla lista nell'interfaccia
        alert('Domanda salvata (simulazione)'); 
    });


    // --- (Il codice per le regole di attivazione che abbiamo scritto prima rimane qui) ---
    const mainToggle = document.getElementById('main-toggle');
    const exceptionsSection = document.getElementById('exceptions-section');
    if (mainToggle && exceptionsSection) { // Aggiungiamo un controllo per sicurezza
        const tagContainer = document.getElementById('tag-selector-container');
        const tagInput = document.getElementById('exception-input');
        const suggestionsPanel = document.getElementById('suggestions-panel');

        let exceptionTags = new Set(['Celiachia']);
        const dietSuggestions = ['Dieta Vegana', 'Dieta Vegetariana', 'Dieta Chetogenica', 'Intolleranza al Lattosio', 'Allergia alle noci', 'Favismo'];
        
        function renderTags() {
            tagContainer.querySelectorAll('.tag-item').forEach(tag => tag.remove());
            exceptionTags.forEach(tagText => {
                const tagElement = document.createElement('span');
                tagElement.className = 'tag-item';
                tagElement.textContent = tagText;
                const removeIcon = document.createElement('i');
                removeIcon.className = 'fa-solid fa-xmark';
                removeIcon.dataset.tag = tagText;
                tagElement.appendChild(removeIcon);
                tagContainer.insertBefore(tagElement, tagInput);
            });
        }
        function renderSuggestions(filter = '') {
            const filteredSuggestions = dietSuggestions.filter(diet => !exceptionTags.has(diet) && diet.toLowerCase().includes(filter.toLowerCase()));
            if (filteredSuggestions.length === 0 || filter === '') { suggestionsPanel.classList.add('hidden'); return; }
            suggestionsPanel.innerHTML = '';
            filteredSuggestions.forEach(diet => {
                const item = document.createElement('div');
                item.className = 'suggestion-item';
                item.textContent = diet;
                item.addEventListener('click', () => { addTag(diet); tagInput.value = ''; renderSuggestions(); });
                suggestionsPanel.appendChild(item);
            });
            suggestionsPanel.classList.remove('hidden');
        }
        function addTag(tagText) { const text = tagText.trim(); if (text) { exceptionTags.add(text); renderTags(); } }
        function toggleExceptions() { exceptionsSection.classList.toggle('disabled', !mainToggle.checked); }
        mainToggle.addEventListener('change', toggleExceptions);
        tagInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput.value); tagInput.value = ''; suggestionsPanel.classList.add('hidden'); } });
        tagInput.addEventListener('input', () => { renderSuggestions(tagInput.value); });
        tagContainer.addEventListener('click', (e) => { if (e.target.tagName === 'I') { const tagToRemove = e.target.dataset.tag; exceptionTags.delete(tagToRemove); renderTags(); } });
        document.addEventListener('click', (e) => { if (!e.target.closest('.tag-selector-wrapper')) { suggestionsPanel.classList.add('hidden'); } });
        renderTags();
        toggleExceptions();
    }
});