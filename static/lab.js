// lab.js (Versione 2.0 - UI Completamente Interattiva)

document.addEventListener('DOMContentLoaded', () => {
    // --- Riferimenti agli Elementi del DOM ---
    const mainToggle = document.getElementById('main-toggle');
    const exceptionsSection = document.getElementById('exceptions-section');
    const tagContainer = document.getElementById('tag-selector-container');
    const tagInput = document.getElementById('exception-input');
    const suggestionsPanel = document.getElementById('suggestions-panel');

    // --- Stato dell'Applicazione ---
    let exceptionTags = new Set(['Celiachia']); // Un tag di esempio
    const dietSuggestions = [
        'Dieta Vegana', 'Dieta Vegetariana', 'Dieta Chetogenica',
        'Intolleranza al Lattosio', 'Allergia alle noci', 'Favismo'
    ];

    // --- Funzioni di Rendering ---

    // Funzione per disegnare i tag sullo schermo
    function renderTags() {
        // Rimuove tutti i tag esistenti tranne l'input
        tagContainer.querySelectorAll('.tag-item').forEach(tag => tag.remove());

        exceptionTags.forEach(tagText => {
            const tagElement = document.createElement('span');
            tagElement.className = 'tag-item';
            tagElement.textContent = tagText;
            
            const removeIcon = document.createElement('i');
            removeIcon.className = 'fa-solid fa-xmark';
            removeIcon.dataset.tag = tagText; // Salva il nome del tag per la rimozione
            
            tagElement.appendChild(removeIcon);
            tagContainer.insertBefore(tagElement, tagInput);
        });
    }

    // Funzione per mostrare/nascondere e filtrare i suggerimenti
    function renderSuggestions(filter = '') {
        const filteredSuggestions = dietSuggestions.filter(diet => 
            !exceptionTags.has(diet) && diet.toLowerCase().includes(filter.toLowerCase())
        );

        if (filteredSuggestions.length === 0 || filter === '') {
            suggestionsPanel.classList.add('hidden');
            return;
        }

        suggestionsPanel.innerHTML = '';
        filteredSuggestions.forEach(diet => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.textContent = diet;
            item.addEventListener('click', () => {
                addTag(diet);
                tagInput.value = '';
                renderSuggestions();
            });
            suggestionsPanel.appendChild(item);
        });
        suggestionsPanel.classList.remove('hidden');
    }

    // Aggiunge un nuovo tag
    function addTag(tagText) {
        const text = tagText.trim();
        if (text) {
            exceptionTags.add(text);
            renderTags();
        }
    }

    // --- Gestione Eventi ---

    // 1. Attiva/disattiva la sezione eccezioni con l'interruttore principale
    function toggleExceptions() {
        exceptionsSection.classList.toggle('disabled', !mainToggle.checked);
    }
    mainToggle.addEventListener('change', toggleExceptions);

    // 2. Aggiunge un tag quando si preme Invio
    tagInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Impedisce di andare a capo
            addTag(tagInput.value);
            tagInput.value = '';
            suggestionsPanel.classList.add('hidden');
        }
    });
    
    // 3. Mostra i suggerimenti mentre si digita
    tagInput.addEventListener('input', () => {
        renderSuggestions(tagInput.value);
    });

    // 4. Rimuove un tag quando si clicca sulla 'x'
    tagContainer.addEventListener('click', (e) => {
        if (e.target.tagName === 'I') {
            const tagToRemove = e.target.dataset.tag;
            exceptionTags.delete(tagToRemove);
            renderTags();
        }
    });
    
    // 5. Nasconde i suggerimenti se si clicca fuori
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.tag-selector-wrapper')) {
            suggestionsPanel.classList.add('hidden');
        }
    });

    // --- Inizializzazione ---
    renderTags();       // Disegna i tag iniziali
    toggleExceptions(); // Imposta lo stato iniziale della sezione eccezioni
});
