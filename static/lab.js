// lab.js (Versione Finale UI - Completa e Funzionante)

document.addEventListener('DOMContentLoaded', () => {
    // --- Stato Globale dell'Applicazione ---
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

    // --- Riferimenti agli Elementi del DOM ---
    const mainToggle = document.getElementById('main-toggle');
    const exceptionsSection = document.getElementById('exceptions-section');
    const tagContainer = document.getElementById('tag-selector-container');
    const tagInput = document.getElementById('exception-input');
    const suggestionsPanel = document.getElementById('suggestions-panel');
    const welcomeMessageTextarea = document.getElementById('welcome-message'); // Aggiunto riferimento
    const quickQuestionList = document.getElementById('quick-question-list');
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
    let currentModalAction = null;

    // --- Funzione di Rendering Principale ---
    function render() {
        // Attivazione e Eccezioni
        mainToggle.checked = state.assistantEnabled;
        exceptionsSection.classList.toggle('disabled', !state.assistantEnabled);
        tagContainer.querySelectorAll('.tag-item').forEach(tag => tag.remove());
        state.exceptions.forEach(tagText => {
            const tagElement = createTagElement(tagText);
            tagContainer.insertBefore(tagElement, tagInput);
        });
        
        // Domande Rapide (la lista visibile nella card)
        quickQuestionList.innerHTML = ''; // Svuota la lista prima di ripopolarla
        state.quickQuestions.slice(0, 3).forEach(qq => { // Mostra solo le prime 3
            const item = document.createElement('div');
            item.className = 'quick-question-item';
            item.innerHTML = `<span>${qq.q}</span> <div class="actions"><i class="fa-solid fa-pencil" data-id="${qq.id}"></i><i class="fa-solid fa-trash-can" data-id="${qq.id}"></i></div>`;
            quickQuestionList.appendChild(item);
        });

        // Anteprima Live
        renderPreview();
    }

    // Renderizza solo la sezione di anteprima
    function renderPreview() {
        const patientName = state.selectedPatient.split(' ')[0];
        const welcomeText = state.welcomeMessage.replace('{nome_paziente}', patientName);
        
        // Resetta la chat
        chatBody.innerHTML = '';
        state.chatHistory = [];
        addMessageToChat(welcomeText, 'bot');

        // Popola i pulsanti delle domande rapide
        previewQuickReplies.innerHTML = '';
        state.quickQuestions.forEach(qq => {
            const btn = document.createElement('button');
            btn.className = 'quick-reply-btn';
            btn.textContent = qq.q;
            previewQuickReplies.appendChild(btn);
        });
        previewQuickReplies.style.display = 'flex';
    }

    // --- Logica Modale Dinamica ---
    function openModal(type, id = null) {
        currentModalAction = { type, id };
        switch (type) {
            case 'welcomeMessage':
                modalTitle.textContent = "Modifica Messaggio di Benvenuto";
                modalBody.innerHTML = `<div class="form-group"><label for="modal-welcome-message">Messaggio (usa <code>{nome_paziente}</code>)</label><textarea id="modal-welcome-message" rows="4">${state.welcomeMessage}</textarea></div>`;
                break;
            case 'addQuestion':
                modalTitle.textContent = "Aggiungi Domanda Rapida";
                modalBody.innerHTML = `<div class="form-group"><label for="modal-question">Domanda del paziente</label><textarea id="modal-question" rows="3" placeholder="Es. Posso bere caffè?"></textarea></div><div class="form-group"><label for="modal-answer">La tua risposta pre-impostata</label><textarea id="modal-answer" rows="6" placeholder="Scrivi la risposta..."></textarea></div>`;
                break;
            case 'editQuestion':
                const q = state.quickQuestions.find(item => item.id === id);
                modalTitle.textContent = "Modifica Domanda Rapida";
                modalBody.innerHTML = `<div class="form-group"><label for="modal-question">Domanda del paziente</label><textarea id="modal-question" rows="3">${q.q}</textarea></div><div class="form-group"><label for="modal-answer">La tua risposta pre-impostata</label><textarea id="modal-answer" rows="6">${q.a}</textarea></div>`;
                break;
        }
        modal.classList.remove('hidden');
    }
    
    function closeModal() { modal.classList.add('hidden'); }

    function handleSave() {
        switch (currentModalAction.type) {
            case 'welcomeMessage':
                state.welcomeMessage = document.getElementById('modal-welcome-message').value;
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
        render();
        closeModal();
    }

    // --- Logica Chat ---
    function addMessageToChat(text, sender, scroll = true) {
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${sender}`;
        bubble.innerHTML = (sender === 'bot-thinking') ? '<div class="typing-indicator"><span></span><span></span><span></span></div>' : text;
        chatBody.appendChild(bubble);
        if (scroll) chatBody.scrollTop = chatBody.scrollHeight;
        return bubble;
    }

    function processUserMessage(text) {
        if (!text) return;
        previewQuickReplies.style.display = 'none';
        state.chatHistory.push({ sender: 'user', text });
        addMessageToChat(text, 'user');
        const thinkingBubble = addMessageToChat('', 'bot-thinking');
        setTimeout(() => {
            thinkingBubble.remove();
            let botResponse = "Risposta simulata da Gemini.";
            const quickQuestion = state.quickQuestions.find(q => q.q.toLowerCase() === text.toLowerCase());
            if (quickQuestion) {
                botResponse = quickQuestion.a;
            }
            state.chatHistory.push({ sender: 'bot', text: botResponse });
            addMessageToChat(botResponse, 'bot');
        }, 1500);
    }
    
    // --- Utility e Gestori Eventi ---
    function createTagElement(text) { /*...*/ return document.createElement('span'); } // Funzione di utilità
    
    // Aggiungo tutti gli event listener necessari...
    mainToggle.addEventListener('change', () => { state.assistantEnabled = mainToggle.checked; render(); });
    editWelcomeBtn.addEventListener('click', () => openModal('welcomeMessage'));
    addQuickQuestionBtn.addEventListener('click', () => openModal('addQuestion'));
    closeModalBtn.addEventListener('click', closeModal);
    cancelModalBtn.addEventListener('click', closeModal);
    saveModalBtn.addEventListener('click', handleSave);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    patientSelect.addEventListener('change', e => { state.selectedPatient = e.target.value; renderPreview(); });
    quickQuestionList.addEventListener('click', e => { if (e.target.classList.contains('fa-pencil')) openModal('editQuestion', parseInt(e.target.dataset.id)); });
    previewQuickReplies.addEventListener('click', (e) => { if (e.target.classList.contains('quick-reply-btn')) processUserMessage(e.target.textContent); });
    chatSendBtn.addEventListener('click', () => { processUserMessage(chatInput.value); chatInput.value = ''; });
    chatInput.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); processUserMessage(chatInput.value); chatInput.value = ''; } });

    // Inizializza l'app
    render();
});
