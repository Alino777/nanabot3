// lab.js (Versione Finale e Corretta)

document.addEventListener('DOMContentLoaded', () => {
    // --- Stato Globale dell'Applicazione ---
    // Un unico oggetto che contiene tutti i dati della nostra interfaccia.
    let state = {
        assistantEnabled: true,
        exceptions: new Set(['Celiachia']), // Dati di esempio
        welcomeMessage: "Ciao {nome_paziente}! Sono il tuo assistente virtuale. Sono qui per aiutarti con il tuo piano alimentare.",
        quickQuestions: [
            { id: 1, q: "Cosa posso mangiare a colazione?", a: "Per colazione, consiglio yogurt greco con frutta fresca e una manciata di mandorle." },
            { id: 2, q: "Quali sono gli spuntini permessi?", a: "Ottimi spuntini includono frutta, verdura cruda, o una piccola porzione di frutta secca." }
        ],
        selectedPatient: "Mario Rossi",
        chatHistory: [] // Per memorizzare la conversazione
    };
    const dietSuggestions = ['Dieta Vegana', 'Dieta Vegetariana', 'Dieta Chetogenica', 'Intolleranza al Lattosio', 'Allergia alle noci', 'Favismo'];

    // --- Riferimenti a tutti gli Elementi del DOM ---
    const mainToggle = document.getElementById('main-toggle');
    const exceptionsSection = document.getElementById('exceptions-section');
    const tagContainer = document.getElementById('tag-selector-container');
    const tagInput = document.getElementById('exception-input');
    const suggestionsPanel = document.getElementById('suggestions-panel');
    const welcomeMessageTextarea = document.getElementById('welcome-message');
    const quickQuestionList = document.getElementById('quick-question-list');
    const addQuestionBtn = document.getElementById('add-quick-question-btn');
    const patientSelect = document.getElementById('patient-select');
    const chatBody = document.getElementById('chat-body');
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const previewQuickReplies = document.getElementById('preview-quick-replies');
    
    // Elementi della Modale
    const modalOverlay = document.getElementById('add-question-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelModalBtn = document.getElementById('cancel-modal-btn');
    const saveModalBtn = document.getElementById('save-modal-btn');
    let editingQuestionId = null;

    // --- FUNZIONI PRINCIPALI ---

    // Funzione unica che aggiorna l'intera interfaccia basandosi sullo 'state'
    function renderAll() {
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

        // 3. Lista delle Domande Rapide
        quickQuestionList.innerHTML = '';
        state.quickQuestions.forEach(qq => {
            const item = document.createElement('div');
            item.className = 'quick-question-item';
            item.innerHTML = `<span>${qq.q}</span><div class="actions"><i class="fa-solid fa-pencil" data-id="${qq.id}"></i><i class="fa-solid fa-trash-can" data-id="${qq.id}"></i></div>`;
            quickQuestionList.appendChild(item);
        });
        
        // 4. Anteprima Live
        renderPreview();
    }

    // Renderizza solo la sezione di anteprima
    function renderPreview() {
        state.chatHistory = []; // Resetta la cronologia quando l'anteprima si aggiorna
        chatBody.innerHTML = ''; // Svuota la chat
        
        const patientName = state.selectedPatient.split(' ')[0];
        const welcomeText = state.welcomeMessage.replace('{nome_paziente}', patientName);
        addMessageToChat(welcomeText, 'bot');

        previewQuickReplies.innerHTML = '';
        state.quickQuestions.forEach(qq => {
            const btn = document.createElement('button');
            btn.className = 'quick-reply-btn';
            btn.textContent = qq.q;
            previewQuickReplies.appendChild(btn);
        });
        previewQuickReplies.style.display = 'flex';
    }

    // Aggiunge una bolla di messaggio alla chat
    function addMessageToChat(text, sender, shouldScroll = true) {
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${sender}`;
        if (sender === 'bot-thinking') {
            bubble.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
        } else {
            bubble.textContent = text;
        }
        chatBody.appendChild(bubble);
        if (shouldScroll) chatBody.scrollTop = chatBody.scrollHeight;
        return bubble;
    }

    // Gestisce l'invio di un messaggio (da input o da pulsante)
    function processUserMessage(text) {
        if (!text) return;

        previewQuickReplies.style.display = 'none';
        state.chatHistory.push({ sender: 'user', text });
        addMessageToChat(text, 'user');

        const thinkingBubble = addMessageToChat('', 'bot-thinking');
        
        setTimeout(() => {
            thinkingBubble.remove();
            let botResponse = "Questa è una risposta simulata da Gemini. La collegheremo presto!";
            const quickQuestion = state.quickQuestions.find(q => q.q.toLowerCase() === text.toLowerCase());
            if (quickQuestion) {
                botResponse = quickQuestion.a;
            }
            state.chatHistory.push({ sender: 'bot', text: botResponse });
            addMessageToChat(botResponse, 'bot');
        }, 1500);
    }
    
    // --- LOGICA MODALE (Aggiungi/Modifica Domande Rapide) ---
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
    function closeModal() { modalOverlay.classList.add('hidden'); }
    function checkModalInputs() { saveModalBtn.disabled = !(modalQuestionTextarea.value.trim() && modalAnswerTextarea.value.trim()); }
    function handleSave() {
        const question = modalQuestionTextarea.value.trim();
        const answer = modalAnswerTextarea.value.trim();
        if (editingQuestionId) {
            const index = state.quickQuestions.findIndex(qq => qq.id === editingQuestionId);
            state.quickQuestions[index] = { id: editingQuestionId, q: question, a: answer };
        } else {
            const newId = state.quickQuestions.length > 0 ? Math.max(...state.quickQuestions.map(q => q.id)) + 1 : 1;
            state.quickQuestions.push({ id: newId, q: question, a: answer });
        }
        renderAll();
        closeModal();
    }
    
    // --- LOGICA ECCEZIONI (Tag e Suggerimenti) ---
    function createTagElement(text) { const tagElement = document.createElement('span'); tagElement.className = 'tag-item'; tagElement.textContent = text; const removeIcon = document.createElement('i'); removeIcon.className = 'fa-solid fa-xmark'; removeIcon.dataset.tag = text; tagElement.appendChild(removeIcon); return tagElement; }
    function renderSuggestions(filter = '') {
        const filtered = dietSuggestions.filter(d => !state.exceptions.has(d) && d.toLowerCase().includes(filter.toLowerCase()));
        if (filtered.length === 0) { suggestionsPanel.classList.add('hidden'); return; }
        suggestionsPanel.innerHTML = '';
        filtered.forEach(diet => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.textContent = diet;
            item.addEventListener('click', () => { state.exceptions.add(diet); renderAll(); tagInput.value = ''; suggestionsPanel.classList.add('hidden'); });
            suggestionsPanel.appendChild(item);
        });
        suggestionsPanel.classList.remove('hidden');
    }

    // --- COLLEGAMENTO DEGLI EVENTI ---
    mainToggle.addEventListener('change', () => { state.assistantEnabled = mainToggle.checked; renderAll(); });
    tagContainer.addEventListener('click', e => { if (e.target.tagName === 'I') { state.exceptions.delete(e.target.dataset.tag); renderAll(); } else { tagInput.focus(); } });
    tagInput.addEventListener('input', () => renderSuggestions(tagInput.value));
    tagInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); const newTag = e.target.value.trim(); if (newTag) { state.exceptions.add(newTag); e.target.value = ''; renderAll(); } suggestionsPanel.classList.add('hidden'); } });
    document.addEventListener('click', e => { if (!e.target.closest('.tag-selector-wrapper')) suggestionsPanel.classList.add('hidden'); });
    welcomeMessageTextarea.addEventListener('input', e => { state.welcomeMessage = e.target.value; renderPreview(); });
    quickQuestionList.addEventListener('click', e => { const id = parseInt(e.target.dataset.id); if (e.target.classList.contains('fa-pencil')) { openModal('edit', id); } if (e.target.classList.contains('fa-trash-can')) { if (confirm('Sei sicuro?')) { state.quickQuestions = state.quickQuestions.filter(qq => qq.id !== id); renderAll(); } } });
    patientSelect.addEventListener('change', e => { state.selectedPatient = e.target.value; renderPreview(); });
    addQuestionBtn.addEventListener('click', () => openModal('add'));
    closeModalBtn.addEventListener('click', closeModal);
    cancelModalBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
    modalQuestionTextarea.addEventListener('input', checkModalInputs);
    modalAnswerTextarea.addEventListener('input', checkModalInputs);
    saveModalBtn.addEventListener('click', handleSave);
    chatInput.addEventListener('input', () => { chatSendBtn.disabled = chatInput.value.trim() === ''; chatInput.style.height = 'auto'; chatInput.style.height = (chatInput.scrollHeight) + 'px'; });
    chatInput.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); processUserMessage(chatInput.value); chatInput.value=''; chatSendBtn.disabled = true; } });
    chatSendBtn.addEventListener('click', () => { processUserMessage(chatInput.value); chatInput.value=''; chatSendBtn.disabled = true; });
    previewQuickReplies.addEventListener('click', (e) => { if (e.target.classList.contains('quick-reply-btn')) processUserMessage(e.target.textContent); });

    // --- Inizializzazione al caricamento della pagina ---
    renderAll();
});