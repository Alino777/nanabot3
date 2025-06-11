// script.js (Versione Funzionale - Pronta per il Deploy)

document.addEventListener('DOMContentLoaded', () => {
    const app = document.getElementById('app');
    // Correzione Critica: L'URL viene reso relativo per funzionare sia in locale che su Vercel.
    const API_BASE_URL = ''; 
    let philosophyOptions = {};

    // -------------------------------------------------------------------
    // FUNZIONI DI RENDER PRINCIPALI
    // -------------------------------------------------------------------
    function renderApp(status) {
        app.innerHTML = `
            <header><img src="https://i.imgur.com/zYf2oMh.png" alt="Nanabot Logo" class="avatar"><h1>Addestramento di <span id="bot-name">${status.name}</span></h1></header>
            <div class="progress-card">
                <div class="progress-bar-container"><div id="progress-bar" class="progress-bar" style="width: ${status.progress}%"></div></div>
                <p id="progress-label">Progresso Addestramento: ${status.progress}%</p>
            </div>
            <div id="mission-area"></div>
            <div class="badges-area"><h3>🏆 Badge Sbloccati</h3><ul id="badge-list">${status.badges.length ? status.badges.map(b => `<li>${b}</li>`).join('') : '<li>Nessun badge ancora.</li>'}</ul></div>`;
    }
    
    function renderCurrentMission(status) {
        const missionArea = document.getElementById('mission-area');
        if (!missionArea) return;

        if (status.progress === 0 && status.badges.length === 0) {
            renderIntroScreen(missionArea, status);
        } else if (status.progress < 25) {
            renderMission1_Explanation(missionArea, status);
        } else if (status.progress < 50) {
            renderMission2_Explanation(missionArea, status);
        } else if (status.progress < 75) {
            renderMission3_Explanation(missionArea, status);
        } else if (status.progress < 100) {
            if (Object.keys(status.philosophy).length === 0) {
                renderMission4_Explanation(missionArea, status);
            } else {
                const nextTheme = status.themes_todo[0];
                if (nextTheme) {
                    renderPhilosophyMission(missionArea, nextTheme, status);
                }
            }
        } else {
            renderCompletionScreen(missionArea, status);
        }
    }

    function renderCompletionState(container, message) {
        container.innerHTML = `<div class="mission-card completion-card"><p class="completion-message">✅ ${message}</p><button id="next-mission-btn" class="btn btn-primary">Prossima Missione &rarr;</button></div>`;
        document.getElementById('next-mission-btn').addEventListener('click', fetchStatus);
    }

    // -------------------------------------------------------------------
    // RENDER DELLE MISSIONI
    // -------------------------------------------------------------------
    function renderIntroScreen(container, status) {
        container.innerHTML = `<div class="mission-card intro-card"><h2>Benvenuto, Master Trainer!</h2><p>Stai per iniziare l'addestramento di <strong>Nanabot</strong>. Attraverso 4 missioni, gli insegnerai a pensare e rispondere con il tuo stile unico.</p><button id="start-btn" class="btn btn-yellow">Inizia l'Addestramento</button></div>`;
        document.getElementById('start-btn').addEventListener('click', () => renderMission1_Explanation(container, status));
    }

    // --- Missione 1: Biblioteca della Verità ---
    function renderMission1_Explanation(container, status) {
        container.innerHTML = `<div class="mission-card"><h2>Missione 1: La Biblioteca della Verità</h2><p>Per evitare che Nanabot dia risposte generiche prese da internet o, peggio, consigli errati, dobbiamo costruire insieme la sua 'biblioteca' di base.</p><button id="start-mission-1-btn" class="btn btn-yellow">Ho Capito, Inizia</button></div>`;
        document.getElementById('start-mission-1-btn').addEventListener('click', () => renderMission1_Action(container, status));
    }
    function renderMission1_Action(container, status) {
        const SOURCES = ["Linee Guida CREA", "Istituto Superiore di Sanità (ISS)", "World Health Organization (WHO)", "EFSA"];
        const sourcesHtml = SOURCES.map((s, i) => `<li class="check-item"><input type="checkbox" id="source-${i}" value="${s}" name="source"><label for="source-${i}">${s}</label></li>`).join('');
        const exclusiveOptionHtml = `<li class="check-item"><input type="checkbox" id="source-none" name="source_exclusive"><label for="source-none" class="exclusive-option">Nessuna, Nanabot si deve basare solo sui miei contenuti</label></li>`;
        
        container.innerHTML = `<div class="mission-card"><h2>Missione 1: La Biblioteca della Verità</h2><p><strong>Seleziona le fonti che ritieni affidabili:</strong></p><ul class="item-list">${sourcesHtml}<hr>${exclusiveOptionHtml}</ul><button id="confirm-mission-1" class="btn btn-yellow" disabled>Conferma Fonti</button></div>`;
        
        const btn = document.getElementById('confirm-mission-1');
        const standardCheckboxes = container.querySelectorAll('input[name="source"]');
        const exclusiveCheckbox = container.querySelector('input[name="source_exclusive"]');
    
        const updateState = () => {
            const anyStandardChecked = [...standardCheckboxes].some(c => c.checked);
            btn.disabled = !anyStandardChecked && !exclusiveCheckbox.checked;
            standardCheckboxes.forEach(cb => cb.disabled = exclusiveCheckbox.checked);
            exclusiveCheckbox.disabled = anyStandardChecked;
        };
    
        container.querySelectorAll('input').forEach(cb => cb.addEventListener('change', updateState));
    
        btn.addEventListener('click', async e => {
            e.target.disabled = true;
            let selectedSources = exclusiveCheckbox.checked ? [] : [...standardCheckboxes].filter(c => c.checked).map(c => c.value);
            await completeMission(1, { sources: selectedSources });
        });
    }

    // --- Missione 2: Protocollo di Sicurezza ---
    function renderMission2_Explanation(container, status) {
        container.innerHTML = `<div class="mission-card"><h2>Missione 2: Il Protocollo di Sicurezza</h2><p>Insegnamo a Nanabot <b>quando fare un passo indietro e chiamare te</b>, intercettando parole chiave e controllando la coerenza dei suoi consigli.</p><button id="start-mission-2-btn" class="btn btn-yellow">Ho Capito, Configura i Trigger</button></div>`;
        document.getElementById('start-mission-2-btn').addEventListener('click', () => renderMission2_Keywords(container, status));
    }

    function renderMission2_Keywords(container, status) {
        const allKeywords = { "Condizioni Mediche": ["diabete", "ipertensione", "colesterolo", "reflusso", "gastrite", "tiroide"], "Stati Fisiologici": ["gravidanza", "allattamento", "menopausa"], "Farmaci/Integratori": ["farmaco", "antibiotico", "cortisone", "pillola"], "Sintomi Preoccupanti": ["dolore", "nausea", "allergia", "intolleranza"] };
        let selectedKeywords = new Set(status.config.security.keywords);

        container.innerHTML = `<div class="mission-card"><h2>Missione 2: Il Protocollo di Sicurezza</h2><h4 class="step-title">Passo 1 di 2: Parole Chiave di Allerta</h4><p>Seleziona o digita le parole che attiveranno una notifica immediata per te.</p><div class="smart-selector-container"><div id="selector-input-area" class="selector-input-area"></div><div id="selector-dropdown" class="selector-dropdown hidden"></div></div><div class="mission-footer"><button id="next-step-btn" class="btn btn-yellow">Prosegui &rarr;</button></div></div>`;
        
        const inputArea = document.getElementById('selector-input-area');
        const dropdown = document.getElementById('selector-dropdown');

        const renderSelected = () => {
            inputArea.innerHTML = [...selectedKeywords].map(kw => `<span class="tag">${kw}<span class="close" data-kw="${kw}">&times;</span></span>`).join('') + `<input type="text" id="keyword-search-input" placeholder="Cerca o aggiungi...">`;
            document.getElementById('keyword-search-input').focus();
            addInputListeners();
        };

        const renderDropdown = (filter = '') => {
            let itemsHtml = '';
            for (const [category, words] of Object.entries(allKeywords)) {
                const filteredWords = words.filter(w => !selectedKeywords.has(w) && w.toLowerCase().includes(filter.toLowerCase()));
                if (filteredWords.length > 0) {
                    itemsHtml += `<div class="dropdown-category">${category}</div>` + filteredWords.map(w => `<div class="dropdown-item" data-kw="${w}">${w}</div>`).join('');
                }
            }
            dropdown.innerHTML = itemsHtml || '<div class="dropdown-item no-results">Nessun risultato</div>';
            dropdown.classList.remove('hidden');
        };
        
        const selectKeyword = (kw) => { selectedKeywords.add(kw); renderSelected(); renderDropdown(); };
        const deselectKeyword = (kw) => { selectedKeywords.delete(kw); renderSelected(); renderDropdown(document.getElementById('keyword-search-input').value); };

        function addInputListeners() {
            const input = document.getElementById('keyword-search-input');
            input.addEventListener('input', () => renderDropdown(input.value));
            input.addEventListener('focus', () => renderDropdown(input.value));
            input.addEventListener('keydown', (e) => { if(e.key === 'Enter' && e.target.value.trim()){ e.preventDefault(); selectKeyword(e.target.value.trim().toLowerCase()); } });
        }
        
        inputArea.addEventListener('click', (e) => {
            if(e.target.classList.contains('close')) deselectKeyword(e.target.dataset.kw);
            else if (e.target.id === 'selector-input-area') document.getElementById('keyword-search-input').focus();
        });
        document.addEventListener('click', (e) => { if (!e.target.closest('.smart-selector-container')) dropdown.classList.add('hidden'); });
        document.getElementById('next-step-btn').addEventListener('click', () => renderMission2_Coherence(container, status, [...selectedKeywords]));

        renderSelected();
    }

    function renderMission2_Coherence(container, status, keywordsFromStep1) {
        const coherenceChecks = status.config.security.coherence_checks;
        const coherenceHtml = Object.entries(coherenceChecks).map(([key, value]) => `<div class="toggle-item"><label for="check-${key}">${key}</label><label class="toggle-switch"><input type="checkbox" id="check-${key}" data-key="${key}" ${value ? 'checked' : ''}><span class="slider"></span></label></div>`).join('');
        container.innerHTML = `<div class="mission-card"><h2>Missione 2: Il Protocollo di Sicurezza</h2><h4 class="step-title">Passo 2 di 2: Controlli di Coerenza</h4><p>Attiva i controlli per impedire a Nanabot di dare consigli contraddittori.</p><div class="coherence-grid">${coherenceHtml}</div><button id="confirm-mission-2" class="btn btn-yellow">Salva Protocollo</button></div>`;
        document.getElementById('confirm-mission-2').addEventListener('click', async (e) => {
            e.target.disabled = true;
            const coherenceConfig = {};
            document.querySelectorAll('.toggle-switch input').forEach(t => coherenceConfig[t.dataset.key] = t.checked);
            await completeMission(2, { keywords: keywordsFromStep1, coherence_checks: coherenceConfig });
        });
    }

    // --- Missione 3: Motore Proattivo ---
    function renderMission3_Explanation(container, status) {
        container.innerHTML = `<div class="mission-card"><h2>Missione 3: Il Motore Proattivo</h2><p>Permetti a Nanabot di accedere in modo selettivo alle tue risorse (piani dei pazienti, tuoi contenuti) per dare un aiuto concreto e personalizzato.</p><button id="start-mission-3-btn" class="btn btn-yellow">Imposta i Permessi</button></div>`;
        document.getElementById('start-mission-3-btn').addEventListener('click', () => renderMission3_Action(container, status));
    }
    function renderMission3_Action(container, status) {
        const resources = status.config.resources;
        container.innerHTML = `<div class="mission-card"><h2>Missione 3: Il Motore Proattivo</h2><p>Seleziona a quali informazioni può accedere Nanabot.</p><div class="resource-section"><div class="resource-header"><label for="res-patient">DATI DEL PAZIENTE</label><label class="toggle-switch"><input type="checkbox" data-key="patient_plans" ${resources.patient_plans ? 'checked' : ''}><span class="slider"></span></label></div><p class="resource-description">Permette a Nanabot di consultare la dieta del singolo paziente.</p></div><div class="resource-section"><div class="resource-header"><label for="res-my-content">LA TUA LIBRERIA DI CONTENUTI</label><label class="toggle-switch"><input type="checkbox" data-key="my_content" ${resources.my_content ? 'checked' : ''}><span class="slider"></span></label></div><p class="resource-description">Abilita Nanabot a suggerire le tue ricette e i tuoi articoli.</p></div><div class="resource-section"><div class="resource-header"><label for="res-external">LIBRERIA ESTERNA APPROVATA</label><label class="toggle-switch"><input type="checkbox" data-key="external_content" ${resources.external_content ? 'checked' : ''}><span class="slider"></span></label></div><p class="resource-description">Permette a Nanabot di usare anche contenuti approvati di altri nutrizionisti.</p></div><button id="confirm-mission-3" class="btn btn-yellow">Attiva Motore</button></div>`;
        document.getElementById('confirm-mission-3').addEventListener('click', async e => { 
            e.target.disabled = true; 
            const resourceConfig = {}; 
            document.querySelectorAll('.toggle-switch input').forEach(t => resourceConfig[t.dataset.key] = t.checked); 
            await completeMission(3, resourceConfig); 
        });
    }
    
    // --- Missione 4: Spiegazione ---
    function renderMission4_Explanation(container, status) {
        container.innerHTML = `<div class="mission-card"><h2>Missione 4: L'Albero della Filosofia</h2><p>Siamo all'ultima e più importante missione. Ora è il momento di dare un'anima a Nanabot: <b>la tua</b>.</p><p>Ti presenteremo una serie di situazioni tipiche. Le tue scelte forgeranno la personalità di Nanabot, assicurando che comunichi con i tuoi pazienti usando il tuo stesso tono e la tua stessa empatia.</p><button id="start-mission-4-btn" class="btn btn-yellow">Inizia a Forgiare la sua Personalità</button></div>`;
        document.getElementById('start-mission-4-btn').addEventListener('click', () => {
            const firstTheme = status.themes_todo[0];
            if (firstTheme) renderPhilosophyMission(container, firstTheme, status);
        });
    }

    // --- Missione 4: Azione ---
    function renderPhilosophyMission(container, theme, status) {
        if (!philosophyOptions || !philosophyOptions[theme]) return;

        let optionsHtml = Object.entries(philosophyOptions[theme]).map(([key, text]) => {
            const title = text.match(/\[(.*?)\]/)[1]; 
            const description = text.split('] ')[1];
            return `<div class="philosophy-card" data-choice="${key}"><h5>Approccio ${key}: ${title}</h5><p>${description}</p></div>`;
        }).join('');
        
        const themeIndex = Object.keys(status.philosophy).length + 1;
        const totalThemes = Object.keys(philosophyOptions).length;

        container.innerHTML = `<div class="mission-card"><h2>Missione 4: L'Albero della Filosofia</h2><p><strong class="step-title">Tema ${themeIndex}/${totalThemes}: ${theme}</strong></p><p>Scegli l'approccio che più ti rappresenta.</p><div class="options-grid">${optionsHtml}</div></div>`;
            
        container.querySelectorAll('.philosophy-card').forEach(card => card.addEventListener('click', async (e) => {
            document.querySelectorAll('.philosophy-card').forEach(c => c.style.pointerEvents = 'none');
            e.currentTarget.classList.add('selected');
            await fetch(`${API_BASE_URL}/api/select_philosophy`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ theme, choice: e.currentTarget.dataset.choice }) });
            fetchStatus();
        }));
    }

    // --- Schermata Finale ---
    function renderCompletionScreen(container, status) {
        container.innerHTML = `<div class="mission-card completion-card"><h2>🎉 Addestramento Completato!</h2><p>Nanabot è pronto.</p><div class="final-actions"><button id="reset-btn" class="btn btn-secondary">Ricomincia Addestramento</button><button id="discover-btn" class="btn btn-primary">Scopri il tuo Nanabot!</button></div></div>`;
        document.getElementById('reset-btn').addEventListener('click', resetApp);
        document.getElementById('discover-btn').addEventListener('click', () => {
            alert("Azione non ancora implementata.");
        });
    }
    
    // -------------------------------------------------------------------
    // FUNZIONI DI COMUNICAZIONE
    // -------------------------------------------------------------------
    async function completeMission(missionNumber, data) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/complete_mission/${missionNumber}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
            if (!response.ok) throw new Error((await response.json()).message || 'Errore di rete');
            const result = await response.json();
            renderCompletionState(document.getElementById('mission-area'), result.message);
        } catch (error) {
            console.error("Errore missione:", error);
            alert("Errore nel completare la missione: " + error.message);
        }
    }

    async function resetApp() { 
        await fetch(`${API_BASE_URL}/api/reset`, { method: 'POST' }); 
        fetchStatus(); 
    }
    
    async function fetchStatus(callback) {
        try { 
            const response = await fetch(`${API_BASE_URL}/api/status`);
            if (!response.ok) throw new Error('Errore di connessione');
            const status = await response.json(); 
            
            if (Object.keys(philosophyOptions).length === 0 && status.progress >= 75) { 
                philosophyOptions = await (await fetch(`${API_BASE_URL}/api/philosophy_options`)).json(); 
            }
            
            renderApp(status); 
            renderCurrentMission(status);

            if (typeof callback === 'function') callback(status);

        } catch (error) { 
            app.innerHTML = `<div class="mission-card" style="text-align: center; border-color: var(--danger-red);"><h2 style="color: var(--danger-red);">⚠️ Errore di Connessione</h2><p>Impossibile comunicare con il server. Assicurati che il backend Python (app.py) sia in esecuzione e riprova.</p><button class="btn btn-yellow" onclick="location.reload()">Ricarica la pagina</button></div>`; 
            console.error("Errore di connessione:", error);
        }
    }

    // AVVIO APPLICAZIONE
    fetchStatus();
});