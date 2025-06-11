// lab.js (Versione Finale e Corretta)

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. STATO GLOBALE DELL'APPLICAZIONE ---
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
        chatHistory: [] // Memorizza la conversazione corrente
    };
    const dietSuggestions = ['Dieta Vegana', 'Dieta Vegetariana', 'Dieta Chetogenica', 'Intolleranza al Lattosio', 'Allergia alle noci', 'Favismo'];
    const API_BASE_URL = ''; // Fondamentale per il deploy su Vercel

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
    let currentModalAction = null; // Memorizza l'azione corrente della modale

    // --- 3. FUNZIONE CHIAVE: Processa il messaggio dell'utente con Gemini ---
    async function processUserMessage(text) {
        const trimmedText = text.trim();
        if (!trimmedText) return;

        previewQuickReplies.style.display = 'none';
        addMessageToChat(trimmedText, 'user');
        const thinkingBubble = addMessageToChat('', 'bot-thinking');
        
        try {
            // Controlla prima se è una domanda rapida pre-impostata
            const quickQuestion = state.quickQuestions.find(q => q.q.toLowerCase() === trimmedText.toLowerCase());
            if (quickQuestion) {
                setTimeout(() => { // Simula un breve pensiero anche per le risposte rapide
                    thinkingBubble.remove();
                    addMessageToChat(quickQuestion.a, 'bot');
                }, 500);
                return;
            }

            // Altrimenti, chiama la vera API di Gemini
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
            // Aggiunge un messaggio di errore visibile all'utente nella chat
            addMessageToChat(`Oops! C'è stato un problema di comunicazione con l'IA. (${error.message})`, 'bot error');
        }
    }

    // --- 4. FUNZIONI DI RENDERING E GESTIONE UI ---
    
    // Funzione principale che aggiorna l'intera interfaccia
    function renderAll() {
        mainToggle.checked = state.assistantEnabled;
        exceptionsSection.classList.toggle('disabled', !state.assistantEnabled);
        
        tagContainer.querySelectorAll('.tag-item').forEach(tag => tag.remove());
        state.exceptions.forEach(tagText => {
            const tagElement = createTagElement(tagText);
            tagContainer.insertBefore(tagElement, tagInput);
        });
        
        // Non c'è più una textarea per il messaggio di benvenuto, quindi questa parte viene rimossa.
        // welcomeMessageTextarea.value = state.welcomeMessage;

        quickQuestionList.innerHTML = '';
        state.quickQuestions.slice(0, 3).forEach(qq => {
            const item = document.createElement('div');
            item.className = 'quick-question-item';
            item.innerHTML = `<span>${qq.q}</span><div class="actions"><i class="fa-solid fa-pencil" data-id="${qq.id}"></i><i class="fa-solid fa-trash-can" data-id="${qq.id}"></i></div>`;
            quickQuestionList.appendChild(item);
        });
        
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

    // Logica per aprire la modale dinamicamente
    function openModal(type, id = null) {
        currentModalAction = { type, id };
        saveModalBtn.disabled = true;

        switch (type) {
            case 'welcomeMessage':
                modalTitle.textContent = "Modifica Messaggio di Benvenuto";
                modalBody.innerHTML = `<div class="form-group"><label for="modal-welcome">Messaggio (usa <code>{nome_paziente}</code>)</label><textarea id="modal-welcome" rows="4">${state.welcomeMessage}</textarea></div>`;
                const mw = document.getElementById('modal-welcome');
                mw.addEventListener('input', () => { saveModalBtn.disabled = mw.value.trim() === ''; });
                saveModalBtn.disabled = state.welcomeMessage.trim() === '';
                break;
            case 'addQuestion':
                modalTitle.textContent = "Aggiungi Domanda Rapida";
                modalBody.innerHTML = `<div class="form-group"><label for="modal-question">Domanda del paziente</label><textarea id="modal-question" rows="3"></textarea></div><div class="form-group"><label for="modal-answer">La tua risposta</label><textarea id="modal-answer" rows="6"></textarea></div>`;
                const mq = document.getElementById('modal-question');
                const ma = document.getElementById('modal-answer');
                const check = () => { saveModalBtn.disabled = !(mq.value.trim() && ma.value.trim()); };
                mq.addEventListener('input', check);
                ma.addEventListener('input', check);
                break;
            case 'editQuestion':
                const q = state.quickQuestions.find(item => item.id === id);
                modalTitle.textContent = "Modifica Domanda Rapida";
                modalBody.innerHTML = `<div class="form-group"><label for="modal-question">Domanda</label><textarea id="modal-question" rows="3">${q.q}</textarea></div><div class="form-group"><label for="modal-answer">Risposta</label><textarea id="modal-answer" rows="6">${q.a}</textarea></div>`;
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
            case 'editQuestion':
                const index = state.quickQuestions.findIndex(q => q.id === currentModalAction.id);
                state.quickQuestions[index].q = document.getElementById('modal-question').value;
                state.quickQuestions[index].a = document.getElementById('modal-answer').value;
                break;
        }
        renderAll();
        closeModal();
    }
    
    // Funzioni di supporto
    function addMessageToChat(text, sender, scroll = true) {
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${sender}`;
        if (sender === 'bot-thinking') {
            bubble.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
        } else if (sender === 'bot error') {
            bubble.style.backgroundColor = '#fff5f5';
            bubble.style.color = '#c53030';
            bubble.textContent = text;
        } else {
            bubble.textContent = text.replace(/\n/g, '<br>');
        }
        chatBody.appendChild(bubble);
        if (scroll) chatBody.scrollTop = chatBody.scrollHeight;
        return bubble;
    }

    function createTagElement(text) {
        const tagEl = document.createElement('span');
        tagEl.className = 'tag-item';
        tagEl.innerHTML = `${text} <i class="fa-solid fa-xmark" data-tag="${text}"></i>`;
        return tagEl;
    }
    
    function renderSuggestions(filter = '') {
        const filtered = dietSuggestions.filter(d => !state.exceptions.has(d) && d.toLowerCase().includes(filter.toLowerCase()));
        suggestionsPanel.innerHTML = filtered.map(d => `<div class="suggestion-item" data-suggestion="${d}">${d}</div>`).join('');
        suggestionsPanel.classList.toggle('hidden', filtered.length === 0);
    }
    
    // --- 5. COLLEGAMENTO DEGLI EVENTI ---
    mainToggle.addEventListener('change', () => { state.assistantEnabled = mainToggle.checked; renderAll(); });
    editWelcomeBtn.addEventListener('click', () => openModal('welcomeMessage'));
    addQuickQuestionBtn.addEventListener('click', () => openModal('addQuestion'));
    closeModalBtn.addEventListener('click', closeModal);
    cancelModalBtn.addEventListener('click', closeModal);
    saveModalBtn.addEventListener('click', handleSave);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    patientSelect.addEventListener('change', e => { state.selectedPatient = e.target.value; renderPreview(); });
    quickQuestionList.addEventListener('click', e => { const id = parseInt(e.target.dataset.id); if (e.target.classList.contains('fa-pencil')) { openModal('editQuestion', id); } if (e.target.classList.contains('fa-trash-can')) { if (confirm('Sei sicuro?')) { state.quickQuestions = state.quickQuestions.filter(qq => qq.id !== id); renderAll(); } } });
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
    renderAll();
});