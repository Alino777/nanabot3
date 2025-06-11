// lab.js (Versione Finale UI)

document.addEventListener('DOMContentLoaded', () => {
    // --- Stato dell'Applicazione ---
    let state = {
        assistantEnabled: true,
        exceptions: new Set(['Celiachia']), // Dati di esempio
        welcomeMessage: "Ciao {nome_paziente}! Sono il tuo assistente virtuale...",
        quickQuestions: [
            { id: 1, q: "Cosa posso mangiare a colazione?", a: "Per colazione, consiglio yogurt greco con frutta fresca e una manciata di mandorle." },
            { id: 2, q: "Quali sono gli spuntini permessi?", a: "Ottimi spuntini includono frutta, verdura cruda, o una piccola porzione di frutta secca." }
        ],
        selectedPatient: "Mario Rossi"
    };

    // --- Riferimenti agli Elementi del DOM ---
    const mainToggle = document.getElementById('main-toggle');
    const exceptionsSection = document.getElementById('exceptions-section');
    const tagContainer = document.getElementById('tag-selector-container');
    const tagInput = document.getElementById('exception-input');
    const suggestionsPanel = document.getElementById('suggestions-panel');
    const welcomeMessageTextarea = document.getElementById('welcome-message');
    const quickQuestionList = document.getElementById('quick-question-list');
    const addQuestionBtn = document.getElementById('add-quick-question-btn');
    const patientSelect = document.getElementById('patient-select');
    const previewWelcomeMessage = document.getElementById('preview-welcome-message');
    const previewQuickReplies = document.getElementById('preview-quick-replies');
    
    // Modale
    const modalOverlay = document.getElementById('add-question-modal');
    const modalTitle = document.getElementById('modal-title');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelModalBtn = document.getElementById('cancel-modal-btn');
    const saveModalBtn = document.getElementById('save-modal-btn');
    const modalQuestionTextarea = document.getElementById('modal-question');
    const modalAnswerTextarea = document.getElementById('modal-answer');
    let editingQuestionId = null; // Per sapere se stiamo aggiungendo o modificando

    // --- Funzioni di Rendering e Logica ---

    // Renderizza l'intera UI basandosi sullo stato
    function render() {
        // 1. Attivazione ed Eccezioni
        mainToggle.checked = state.assistantEnabled;
        exceptionsSection.classList.toggle('disabled', !state.assistantEnabled);
        
        tagContainer.querySelectorAll('.tag-item').forEach(tag => tag.remove());
        state.exceptions.forEach(tagText => {
            const tagElement = createTagElement(tagText);
            tagContainer.insertBefore(tagElement, tagInput);
        });

        // 2. Messaggio di benvenuto
        welcomeMessageTextarea.value = state.welcomeMessage;

        // 3. Domande Rapide
        quickQuestionList.innerHTML = '';
        state.quickQuestions.forEach(qq => {
            const item = document.createElement('div');
            item.className = 'quick-question-item';
            item.innerHTML = `
                <span>${qq.q}</span>
                <div class="actions">
                    <i class="fa-solid fa-pencil" data-id="${qq.id}"></i>
                    <i class="fa-solid fa-trash-can" data-id="${qq.id}"></i>
                </div>
            `;
            quickQuestionList.appendChild(item);
        });
        
        // 4. Anteprima Live
        renderPreview();
    }

    // Renderizza solo la sezione di anteprima
    function renderPreview() {
        const patientName = state.selectedPatient;
        previewWelcomeMessage.textContent = state.welcomeMessage.replace('{nome_paziente}', patientName.split(' ')[0]);

        previewQuickReplies.innerHTML = '';
        state.quickQuestions.forEach(qq => {
            const btn = document.createElement('button');
            btn.className = 'quick-reply-btn';
            btn.textContent = qq.q;
            previewQuickReplies.appendChild(btn);
        });
    }

    // Crea un elemento 'tag'
    function createTagElement(text) {
        const tagElement = document.createElement('span');
        tagElement.className = 'tag-item';
        tagElement.textContent = text;
        const removeIcon = document.createElement('i');
        removeIcon.className = 'fa-solid fa-xmark';
        removeIcon.dataset.tag = text;
        tagElement.appendChild(removeIcon);
        return tagElement;
    }
    
    // Logica per la modale
    function openModal(mode = 'add', id = null) {
        editingQuestionId = id;
        if (mode === 'edit') {
            const questionToEdit = state.quickQuestions.find(qq => qq.id === id);
            modalTitle.textContent = "Modifica Domanda Rapida";
            modalQuestionTextarea.value = questionToEdit.q;
            modalAnswerTextarea.value = questionToEdit.a;
        } else {
            modalTitle.textContent = "Aggiungi Domanda Rapida";
            modalQuestionTextarea.value = '';
            modalAnswerTextarea.value = '';
        }
        checkModalInputs();
        modalOverlay.classList.remove('hidden');
    }

    function closeModal() {
        modalOverlay.classList.add('hidden');
    }

    function checkModalInputs() {
        saveModalBtn.disabled = !(modalQuestionTextarea.value.trim() && modalAnswerTextarea.value.trim());
    }

    // --- Gestione Eventi ---

    mainToggle.addEventListener('change', (e) => {
        state.assistantEnabled = e.target.checked;
        render();
    });

    tagContainer.addEventListener('click', (e) => {
        if (e.target.tagName === 'I') {
            state.exceptions.delete(e.target.dataset.tag);
            render();
        }
    });

    tagInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const newTag = e.target.value.trim();
            if (newTag) {
                state.exceptions.add(newTag);
                e.target.value = '';
                render();
            }
        }
    });
    
    welcomeMessageTextarea.addEventListener('input', (e) => {
        state.welcomeMessage = e.target.value;
        renderPreview();
    });

    quickQuestionList.addEventListener('click', (e) => {
        const id = parseInt(e.target.dataset.id, 10);
        if (e.target.classList.contains('fa-pencil')) {
            openModal('edit', id);
        }
        if (e.target.classList.contains('fa-trash-can')) {
            if (confirm('Sei sicuro di voler eliminare questa domanda?')) {
                state.quickQuestions = state.quickQuestions.filter(qq => qq.id !== id);
                render();
            }
        }
    });

    patientSelect.addEventListener('change', (e) => {
        state.selectedPatient = e.target.value;
        renderPreview();
    });
    
    // Eventi della Modale
    addQuestionBtn.addEventListener('click', () => openModal('add'));
    closeModalBtn.addEventListener('click', closeModal);
    cancelModalBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
    modalQuestionTextarea.addEventListener('input', checkModalInputs);
    modalAnswerTextarea.addEventListener('input', checkModalInputs);
    
    saveModalBtn.addEventListener('click', () => {
        const question = modalQuestionTextarea.value.trim();
        const answer = modalAnswerTextarea.value.trim();
        if (editingQuestionId) {
            const index = state.quickQuestions.findIndex(qq => qq.id === editingQuestionId);
            state.quickQuestions[index] = { id: editingQuestionId, q: question, a: answer };
        } else {
            const newId = state.quickQuestions.length > 0 ? Math.max(...state.quickQuestions.map(q => q.id)) + 1 : 1;
            state.quickQuestions.push({ id: newId, q: question, a: answer });
        }
        render();
        closeModal();
    });

    // --- Inizializzazione ---
    render();
});