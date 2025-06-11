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
    };
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
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelModalBtn = document.getElementById('cancel-modal-btn');
    const saveModalBtn = document.getElementById('save-modal-btn');
    let currentModalAction = null;

    // --- 3. FUNZIONI DI LOGICA PRINCIPALE ---

    async function processUserMessage(text) {
        const trimmedText = text.trim();
        if (!trimmedText) return;

        previewQuickReplies.style.display = 'none';
        addMessageToChat(trimmedText, 'user');
        const thinkingBubble = addMessageToChat('', 'bot-thinking');
        
        try {
            const quickQuestion = state.quickQuestions.find(q => q.q.toLowerCase() === trimmedText.toLowerCase());
            if (quickQuestion) {
                setTimeout(() => { thinkingBubble.remove(); addMessageToChat(quickQuestion.a, 'bot'); }, 500);
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
            addMessageToChat(`Oops! Errore di comunicazione. (${error.message})`, 'bot error');
        }
    }
    
    // --- 4. FUNZIONI DI RENDERING E UI ---
    
    function renderAll() {
        mainToggle.checked = state.assistantEnabled;
        exceptionsSection.classList.toggle('disabled', !state.assistantEnabled);
        
        tagContainer.querySelectorAll('.tag-item').forEach(tag => tag.remove());
        state.exceptions.forEach(tagText => {
            const tagElement = createTagElement(tagText);
            tagContainer.insertBefore(tagElement, tagInput);
        });
        
        renderPreview();
    }

    function renderPreview() {
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
                const mq = document.getElementById('modal-question'), ma = document.getElementById('modal-answer');
                const check = () => { saveModalBtn.disabled = !(mq.value.trim() && ma.value.trim()); };
                mq.addEventListener('input', check); ma.addEventListener('input', check);
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

    function createTagElement(text) { const tagEl = document.createElement('span'); tagEl.className = 'tag-item'; tagEl.innerHTML = `${text} <i class="fa-solid fa-xmark" data-tag="${text}"></i>`; return tagEl; }
    function closeModal() { modal.classList.add('hidden'); }

    // --- 5. COLLEGAMENTO DEGLI EVENTI ---
    mainToggle.addEventListener('change', renderAll);
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

    // --- 6. INIZIALIZZAZIONE ---
    renderAll();
});
