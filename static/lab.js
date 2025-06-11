// lab.js (Versione Finale e Corretta)

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. STATO GLOBALE DELL'APPLICAZIONE ---
    let state = {
        assistantEnabled: true,
        exceptions: new Set(['Celiachia']),
        welcomeMessage: "Ciao {nome_paziente}! Sono il tuo assistente virtuale. Sono qui per aiutarti con il tuo piano alimentare.",
        quickQuestions: [
            { id: 1, q: "Cosa posso mangiare a colazione?", a: "Per colazione, consiglio yogurt greco con frutta fresca e una manciata di mandorle." },
            { id: 2, q: "Quali sono gli spuntini permessi?", a: "Ottimi spuntini includono frutta, verdura cruda, o una piccola porzione di frutta secca." }
        ],
        selectedPatient: "Mario Rossi",
        chatHistory: []
    };
    const dietSuggestions = ['Dieta Vegana', 'Dieta Vegetariana', 'Dieta Chetogenica', 'Intolleranza al Lattosio', 'Allergia alle noci', 'Favismo'];

    // --- 2. RIFERIMENTI AGLI ELEMENTI DEL DOM ---
    const mainToggle = document.getElementById('main-toggle');
    const exceptionsSection = document.getElementById('exceptions-section');
    const tagContainer = document.getElementById('tag-selector-container');
    const tagInput = document.getElementById('exception-input');
    const suggestionsPanel = document.getElementById('suggestions-panel');
    const welcomeMessageTextarea = document.getElementById('welcome-message'); // Questo elemento non esiste più, ma lo lasciamo per ora
    const quickQuestionList = document.getElementById('quick-question-list'); // Riferimento per la lista in dashboard
    const patientSelect = document.getElementById('patient-select');
    const chatBody = document.getElementById('chat-body');
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const previewQuickReplies = document.getElementById('preview-quick-replies');
    
    // Pulsanti di azione
    const editWelcomeBtn = document.getElementById('edit-welcome-btn');
    const addQuickQuestionBtn = document.getElementById('add-quick-question-btn');
    const manageAllBtn = document.getElementById('manage-all-btn');
    const resetTrainingBtn = document.getElementById('reset-training-btn');
    
    // Elementi della Modale
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelModalBtn = document.getElementById('cancel-modal-btn');
    const saveModalBtn = document.getElementById('save-modal-btn');
    let currentModalAction = null; // Per sapere cosa fa la modale (es. 'editWelcome', 'addQuestion')

    // --- 3. FUNZIONI DI RENDERING E LOGICA ---

    // Funzione principale che aggiorna l'intera UI
    function renderAll() {
        // Attivazione e Eccezioni
        mainToggle.checked = state.assistantEnabled;
        exceptionsSection.classList.toggle('disabled', !state.assistantEnabled);
        tagContainer.querySelectorAll('.tag-item').forEach(tag => tag.remove());
        state.exceptions.forEach(tagText => {
            const tagElement = createTagElement(tagText);
            tagContainer.insertBefore(tagElement, tagInput);
        });

        // Anteprima Live
        renderPreview();
    }

    // Renderizza solo la sezione di anteprima
    function renderPreview() {
        state.chatHistory = [];
        chatBody.innerHTML = '';
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

    // Logica Modale Dinamica
    function openModal(type, id = null) {
        currentModalAction = { type, id };
        saveModalBtn.disabled = true;

        switch (type) {
            case 'welcomeMessage':
                modalTitle.textContent = "Modifica Messaggio di Benvenuto";
                modalBody.innerHTML = `<div class="form-group"><label for="modal-welcome">Messaggio (usa <code>{nome_paziente}</code>)</label><textarea id="modal-welcome" rows="4">${state.welcomeMessage}</textarea></div>`;
                document.getElementById('modal-welcome').addEventListener('input', () => { saveModalBtn.disabled = document.getElementById('modal-welcome').value.trim() === ''; });
                saveModalBtn.disabled = state.welcomeMessage.trim() === '';
                break;
            case 'addQuestion':
                modalTitle.textContent = "Aggiungi Domanda Rapida";
                modalBody.innerHTML = `<div class="form-group"><label for="modal-question">Domanda del paziente</label><textarea id="modal-question" rows="3" placeholder="Es. Posso bere caffè?"></textarea></div><div class="form-group"><label for="modal-answer">La tua risposta pre-impostata</label><textarea id="modal-answer" rows="6" placeholder="Scrivi la risposta..."></textarea></div>`;
                const mq = document.getElementById('modal-question');
                const ma = document.getElementById('modal-answer');
                const check = () => { saveModalBtn.disabled = !(mq.value.trim() && ma.value.trim()); };
                mq.addEventListener('input', check);
                ma.addEventListener('input', check);
                break;
        }
        modal.classList.remove('hidden');
    }
    
    function closeModal() { modal.classList.add('hidden'); }
    
    function handleSave() {
        switch (currentModalAction.type) {
            case 'welcomeMessage':
                state.welcomeMessage = document.getElementById('modal-welcome').value;
                break;
            case 'addQuestion':
                const newQ = { id: Date.now(), q: document.getElementById('modal-question').value, a: document.getElementById('modal-answer').value };
                state.quickQuestions.push(newQ);
                break;
        }
        renderAll();
        closeModal();
    }
    
    // Funzioni di supporto per Eccezioni
    function createTagElement(text) { const tagEl = document.createElement('span'); tagEl.className = 'tag-item'; tagEl.innerHTML = `${text} <i class="fa-solid fa-xmark" data-tag="${text}"></i>`; return tagEl; }
    function renderSuggestions(filter = '') {
        const filtered = dietSuggestions.filter(d => !state.exceptions.has(d) && d.toLowerCase().includes(filter.toLowerCase()));
        suggestionsPanel.innerHTML = filtered.map(d => `<div class="suggestion-item" data-suggestion="${d}">${d}</div>`).join('');
        suggestionsPanel.classList.toggle('hidden', filtered.length === 0);
    }
    
    // Funzioni di supporto per la Chat
    function addMessageToChat(text, sender, scroll = true) {
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${sender}`;
        bubble.innerHTML = (sender === 'bot-thinking') ? '<div class="typing-indicator"><span></span><span></span><span></span></div>' : text.replace(/\n/g, '<br>');
        chatBody.appendChild(bubble);
        if (scroll) chatBody.scrollTop = chatBody.scrollHeight;
        return bubble;
    }
    function processUserMessage(text) {
        const trimmedText = text.trim();
        if (!trimmedText) return;
        previewQuickReplies.style.display = 'none';
        state.chatHistory.push({ sender: 'user', text: trimmedText });
        addMessageToChat(trimmedText, 'user');
        const thinkingBubble = addMessageToChat('', 'bot-thinking');
        setTimeout(() => {
            thinkingBubble.remove();
            let botResponse = "Risposta simulata. Presto sarò collegato a Gemini!";
            const quickQuestion = state.quickQuestions.find(q => q.q.toLowerCase() === trimmedText.toLowerCase());
            if (quickQuestion) botResponse = quickQuestion.a;
            state.chatHistory.push({ sender: 'bot', text: botResponse });
            addMessageToChat(botResponse, 'bot');
        }, 1500);
    }

    // --- 4. COLLEGAMENTO DEGLI EVENTI ---
    mainToggle.addEventListener('change', () => { state.assistantEnabled = mainToggle.checked; renderAll(); });
    editWelcomeBtn.addEventListener('click', () => openModal('welcomeMessage'));
    addQuickQuestionBtn.addEventListener('click', () => openModal('addQuestion'));
    closeModalBtn.addEventListener('click', closeModal);
    cancelModalBtn.addEventListener('click', closeModal);
    saveModalBtn.addEventListener('click', handleSave);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    patientSelect.addEventListener('change', e => { state.selectedPatient = e.target.value; renderPreview(); });
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
    
    // --- 5. INIZIALIZZAZIONE ---
    renderAll();
});
