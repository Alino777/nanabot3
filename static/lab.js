// lab.js (Versione Finale e Completa)

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. STATO GLOBALE E COSTANTI ---
    let state = {}; // Inizialmente vuoto, verrà popolato dal server
    const dietSuggestions = ['Dieta Vegana', 'Dieta Vegetariana', 'Dieta Chetogenica', 'Intolleranza al Lattosio', 'Allergia alle noci', 'Favismo'];
    const API_BASE_URL = '';

    // --- 2. RIFERIMENTI AGLI ELEMENTI DEL DOM ---
    const mainToggle = document.getElementById('main-toggle');
    const exceptionsSection = document.getElementById('exceptions-section');
    const tagContainer = document.getElementById('tag-selector-container');
    const tagInput = document.getElementById('exception-input');
    const suggestionsPanel = document.getElementById('suggestions-panel');
    const quickQuestionList = document.getElementById('quick-question-list');
    const patientSelect = document.getElementById('patient-select');
    const chatBody = document.getElementById('chat-body');
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const previewQuickReplies = document.getElementById('preview-quick-replies');
    const editWelcomeBtn = document.getElementById('edit-welcome-btn');
    const addQuickQuestionBtn = document.getElementById('add-quick-question-btn');
    const manageAllBtn = document.getElementById('manage-all-btn');
    const resetTrainingBtn = document.getElementById('reset-training-btn');
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelModalBtn = document.getElementById('cancel-modal-btn');
    const saveModalBtn = document.getElementById('save-modal-btn');
    const saveAllBtn = document.getElementById('save-all-btn');
    let currentModalAction = null;

    // --- 3. FUNZIONI API PER COMUNICARE CON IL SERVER ---

    async function fetchSettings() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/get_lab_settings`);
            if (!response.ok) throw new Error('Impossibile caricare le impostazioni.');
            const settings = await response.json();
            state = { ...settings, exceptions: new Set(settings.exceptions || []) };
            renderAll();
        } catch (error) {
            console.error("Errore nel caricare le impostazioni:", error);
            alert("Errore nel caricare le impostazioni del server.");
        }
    }

    async function saveSettings() {
        const payload = { ...state, exceptions: Array.from(state.exceptions) };
        try {
            const response = await fetch(`${API_BASE_URL}/api/update_settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error("Salvataggio fallito.");
            const result = await response.json();
            alert(result.message);
        } catch (error) {
            console.error("Errore nel salvare le impostazioni:", error);
            alert("Errore durante il salvataggio.");
        }
    }

    async function processUserMessage(text) {
        const trimmedText = text.trim();
        if (!trimmedText) return;

        previewQuickReplies.style.display = 'none';
        addMessageToChat(trimmedText, 'user');
        const thinkingBubble = addMessageToChat('', 'bot-thinking');
        
        try {
            const quickQuestion = (state.quickQuestions || []).find(q => q.q.toLowerCase() === trimmedText.toLowerCase());
            if (quickQuestion) {
                setTimeout(() => {
                    thinkingBubble.remove();
                    addMessageToChat(quickQuestion.a, 'bot');
                }, 500);
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/ask`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: trimmedText })
            });
            
            thinkingBubble.remove();
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Errore del server: ${response.status}`);
            }
            const data = await response.json();
            addMessageToChat(data.answer, 'bot');
        } catch (error) {
            console.error("Errore durante la chiamata a /api/ask:", error);
            if(thinkingBubble) thinkingBubble.remove();
            addMessageToChat(`Oops! Errore di comunicazione con l'IA. (${error.message})`, 'bot error');
        }
    }

    // --- 4. FUNZIONI DI RENDERING E GESTIONE UI ---
    
    function renderAll() {
        if (!state || Object.keys(state).length === 0) return;
        
        mainToggle.checked = state.assistantEnabled;
        exceptionsSection.classList.toggle('disabled', !state.assistantEnabled);
        
        tagContainer.querySelectorAll('.tag-item').forEach(tag => tag.remove());
        if(state.exceptions) {
            state.exceptions.forEach(tagText => {
                const tagElement = createTagElement(tagText);
                tagContainer.insertBefore(tagElement, tagInput);
            });
        }
        
        renderPreview();
    }

    function renderPreview() {
        if(!state.welcomeMessage) return;
        
        chatBody.innerHTML = '';
        const patientName = state.selectedPatient.split(' ')[0];
        const welcomeText = state.welcomeMessage.replace('{nome_paziente}', patientName);
        addMessageToChat(welcomeText, 'bot');

        previewQuickReplies.innerHTML = '';
        if(state.quickQuestions){
            state.quickQuestions.forEach(qq => {
                const btn = document.createElement('button');
                btn.className = 'quick-reply-btn';
                btn.textContent = qq.q;
                previewQuickReplies.appendChild(btn);
            });
        }
        previewQuickReplies.style.display = 'flex';
    }

    function openModal(type, id = null) {
        currentModalAction = { type, id };
        saveModalBtn.disabled = true;
        let questionValue = '', answerValue = '';

        switch (type) {
            case 'welcomeMessage':
                modalTitle.textContent = "Modifica Messaggio di Benvenuto";
                modalBody.innerHTML = `<div class="form-group"><label for="modal-welcome">Messaggio (usa <code>{nome_paziente}</code>)</label><textarea id="modal-welcome" rows="4">${state.welcomeMessage}</textarea></div>`;
                const mw = document.getElementById('modal-welcome');
                mw.addEventListener('input', () => { saveModalBtn.disabled = mw.value.trim() === ''; });
                saveModalBtn.disabled = state.welcomeMessage.trim() === '';
                break;
            case 'addQuestion':
            case 'editQuestion':
                if (type === 'editQuestion') {
                    const q = state.quickQuestions.find(item => item.id === id);
                    questionValue = q.q;
                    answerValue = q.a;
                    modalTitle.textContent = "Modifica Domanda Rapida";
                } else {
                    modalTitle.textContent = "Aggiungi Domanda Rapida";
                }
                modalBody.innerHTML = `<div class="form-group"><label for="modal-question">Domanda del paziente</label><textarea id="modal-question" rows="3">${questionValue}</textarea></div><div class="form-group"><label for="modal-answer">La tua risposta pre-impostata</label><textarea id="modal-answer" rows="6">${answerValue}</textarea></div>`;
                const mq = document.getElementById('modal-question'), ma = document.getElementById('modal-answer');
                const check = () => { saveModalBtn.disabled = !(mq.value.trim() && ma.value.trim()); };
                mq.addEventListener('input', check);
                ma.addEventListener('input', check);
                check();
                break;
        }
        modal.classList.remove('hidden');
    }

    function handleSave() {
        switch (currentModalAction.type) {
            case 'welcomeMessage':
                state.welcomeMessage = document.getElementById('modal-welcome').value;
                break;
            case 'addQuestion':
                const newQ = { id: Date.now(), q: document.getElementById('modal-question').value, a: document.getElementById('modal-answer').value };
                state.quickQuestions.push(newQ);
                break;
            case 'editQuestion':
                const index = state.quickQuestions.findIndex(q => q.id === currentModalAction.id);
                state.quickQuestions[index].q = document.getElementById('modal-question').value;
                state.quickQuestions[index].a = document.getElementById('modal-answer').value;
                break;
        }
        renderAll();
        closeModal();
    }
    
    function addMessageToChat(text, sender, scroll = true) {
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${sender}`;
        if (sender === 'bot-thinking') {
            bubble.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
        } else if (sender === 'bot error') {
            bubble.style.cssText = 'background-color: #fff5f5; color: #c53030;';
            bubble.textContent = text;
        } else {
            bubble.innerHTML = text.replace(/\n/g, '<br>');
        }
        chatBody.appendChild(bubble);
        if (scroll) chatBody.scrollTop = chatBody.scrollHeight;
        return bubble;
    }
    
    function renderSuggestions(filter = '') {
        const filtered = dietSuggestions.filter(d => !state.exceptions.has(d) && d.toLowerCase().includes(filter.toLowerCase()));
        suggestionsPanel.innerHTML = filtered.map(d => `<div class="suggestion-item" data-suggestion="${d}">${d}</div>`).join('');
        suggestionsPanel.classList.toggle('hidden', filtered.length === 0 || !tagInput.value);
    }

    function createTagElement(text) {
        const tagEl = document.createElement('span');
        tagEl.className = 'tag-item';
        tagEl.innerHTML = `${text} <i class="fa-solid fa-xmark" data-tag="${text}"></i>`;
        return tagEl;
    }

    function closeModal() {
        modal.classList.add('hidden');
    }

    // --- 5. COLLEGAMENTO DEGLI EVENTI ---
    mainToggle.addEventListener('change', () => { state.assistantEnabled = mainToggle.checked; renderAll(); });
    editWelcomeBtn.addEventListener('click', () => openModal('welcomeMessage'));
    addQuickQuestionBtn.addEventListener('click', () => openModal('addQuestion'));
    saveAllBtn.addEventListener('click', saveSettings);
    closeModalBtn.addEventListener('click', closeModal);
    cancelModalBtn.addEventListener('click', closeModal);
    saveModalBtn.addEventListener('click', handleSave);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    patientSelect.addEventListener('change', e => { state.selectedPatient = e.target.value; renderPreview(); });
    quickQuestionList.addEventListener('click', e => {
        const id = parseInt(e.target.dataset.id);
        if (e.target.classList.contains('fa-pencil')) { openModal('editQuestion', id); }
        if (e.target.classList.contains('fa-trash-can')) {
            if (confirm('Sei sicuro di voler eliminare questa domanda?')) {
                state.quickQuestions = state.quickQuestions.filter(qq => qq.id !== id);
                renderAll();
            }
        }
    });
    previewQuickReplies.addEventListener('click', e => { if (e.target.classList.contains('quick-reply-btn')) processUserMessage(e.target.textContent); });
    chatSendBtn.addEventListener('click', () => { processUserMessage(chatInput.value); chatInput.value = ''; chatSendBtn.disabled = true; });
    chatInput.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); processUserMessage(chatInput.value); chatInput.value = ''; chatSendBtn.disabled = true; } });
    chatInput.addEventListener('input', () => { chatSendBtn.disabled = chatInput.value.trim() === ''; });
    tagContainer.addEventListener('click', e => { if (e.target.dataset.tag) { state.exceptions.delete(e.target.dataset.tag); renderAll(); } else { tagInput.focus(); } });
    tagInput.addEventListener('input', () => renderSuggestions(tagInput.value));
    tagInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); const newTag = e.target.value.trim(); if (newTag) { state.exceptions.add(newTag); e.target.value = ''; renderAll(); } suggestionsPanel.classList.add('hidden'); } });
    suggestionsPanel.addEventListener('click', e => { if (e.target.dataset.suggestion) { state.exceptions.add(e.target.dataset.suggestion); renderAll(); suggestionsPanel.classList.add('hidden'); } });
    document.addEventListener('click', e => { if (!e.target.closest('.tag-selector-wrapper')) suggestionsPanel.classList.add('hidden'); });
    resetTrainingBtn.addEventListener('click', () => { if (confirm("Sei sicuro? Verrai reindirizzato all'addestramento.")) window.location.href = '/'; });

    // --- 6. INIZIALIZZAZIONE ---
    fetchSettings();
});
