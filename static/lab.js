// lab.js (Versione 1.0 - Logica Interattiva UI)

document.addEventListener('DOMContentLoaded', () => {
    // --- Riferimenti agli Elementi del DOM ---
    const userPromptTextarea = document.getElementById('user-prompt');
    const sendBtn = document.getElementById('send-btn');
    const chatContainer = document.getElementById('chat-container');
    const emptyState = document.querySelector('.chat-empty-state');
    
    const reviewPanel = document.getElementById('review-panel');
    const closeReviewPanelBtn = document.getElementById('close-review-panel');
    const approveFinalBtn = document.getElementById('approve-final-btn');
    
    // --- Gestione Stato UI ---

    // Abilita/Disabilita il pulsante di invio
    userPromptTextarea.addEventListener('input', () => {
        sendBtn.disabled = userPromptTextarea.value.trim() === '';
    });

    // Mostra/Nascondi il pannello di revisione
    function toggleReviewPanel(show = true) {
        if (show) {
            reviewPanel.classList.remove('hidden');
        } else {
            reviewPanel.classList.add('hidden');
        }
    }

    // --- Funzioni della Chat ---

    // Aggiunge un messaggio alla finestra della chat
    function addMessageToChat(text, type = 'bot-proposal') {
        if (emptyState) {
            emptyState.remove(); // Rimuove lo stato iniziale vuoto
        }

        const messageWrapper = document.createElement('div');
        messageWrapper.className = `chat-message-wrapper ${type}-wrapper`;

        if (type.startsWith('bot')) {
            const avatar = document.createElement('img');
            avatar.src = 'https://i.imgur.com/nvfq69Y.png'; // Avatar del bot
            avatar.className = 'chat-avatar';
            messageWrapper.appendChild(avatar);
        }

        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble';

        // Logica per gestire i diversi tipi di messaggi
        switch(type) {
            case 'user':
                bubble.className += ' user';
                bubble.textContent = text;
                break;
            
            case 'bot-thinking':
                bubble.className += ' bot';
                bubble.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
                break;
            
            case 'bot-proposal':
                bubble.className += ' bot proposal';
                bubble.innerHTML = `
                    <div class="proposal-source">[GEMINI] COACH MOTIVAZIONALE</div>
                    <p>${text}</p>
                    <div class="proposal-actions">
                        <button class="btn-chat approve">✅ Approva</button>
                        <button class="btn-chat edit">✏️ Modifica</button>
                    </div>
                `;
                break;
            
            case 'bot-final':
                bubble.className += ' bot final';
                bubble.textContent = text;
                break;
        }

        messageWrapper.appendChild(bubble);
        chatContainer.appendChild(messageWrapper);
        chatContainer.scrollTop = chatContainer.scrollHeight; // Scrolla fino all'ultimo messaggio
    }


    // --- Gestione Eventi Principali ---

    // Invio del messaggio
    sendBtn.addEventListener('click', () => {
        const promptText = userPromptTextarea.value.trim();
        if (!promptText) return;

        addMessageToChat(promptText, 'user');
        userPromptTextarea.value = '';
        sendBtn.disabled = true;

        // Simula la "riflessione" del bot
        const thinkingMessage = addMessageToChat('', 'bot-thinking');
        
        // Simula una risposta da Gemini dopo 2 secondi
        setTimeout(() => {
            // Rimuove l'indicatore "sta pensando"
            thinkingMessage.remove(); 
            // Mostra la proposta di risposta
            addMessageToChat(
                "Certo, è normale sentirsi così! Ricorda che il peso fluttua per tanti motivi. Concentriamoci sulle buone abitudini che hai mantenuto questa settimana!", 
                'bot-proposal'
            );
        }, 2000);
    });

    // Gestione dei click all'interno della chat (Delegation)
    chatContainer.addEventListener('click', (event) => {
        const target = event.target;

        // Se clicco su "Modifica"
        if (target.classList.contains('edit')) {
            toggleReviewPanel(true);
            // Qui in futuro popoleremo il pannello destro con i dati veri
        }

        // Se clicco su "Approva"
        if (target.classList.contains('approve')) {
            const proposalWrapper = target.closest('.chat-message-wrapper');
            const proposalText = proposalWrapper.querySelector('p').textContent;
            
            // Sostituisce la proposta con la risposta finale
            proposalWrapper.remove();
            addMessageToChat(proposalText, 'bot-final');
        }
    });

    // Chiusura del pannello di revisione
    closeReviewPanelBtn.addEventListener('click', () => {
        toggleReviewPanel(false);
    });
    
    // Approvazione dal pannello di revisione
    approveFinalBtn.addEventListener('click', () => {
        // Logica fittizia per ora
        console.log("Risposta approvata dal pannello di modifica!");
        toggleReviewPanel(false);
    });

});
