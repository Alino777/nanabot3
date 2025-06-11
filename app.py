# --- Import delle librerie necessarie ---
import requests
import os                     # Per leggere le variabili d'ambiente (come la chiave API)
import logging                # Per un logging più controllato
from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
from time import time

# --- Classe di Logica (DigitalAssistant) ---
# Contiene tutte le opzioni di personalizzazione e la logica di "addestramento" dell'assistente.

PHILOSOPHY_OPTIONS = {
    "Gestione dello Sgarro": {
        "A": "[METODICO SCIENTIFICO] Lo 'sgarro' è un dato. Analizziamolo per compensare il bilancio calorico settimanale senza impatti.",
        "B": "[COACH MOTIVAZIONALE] Non è uno sgarro, ma un'esperienza. Nessun senso di colpa! Domani è un nuovo giorno per ripartire con energia.",
        "C": "[OLISTICO INTEGRATO] Ascolta come reagisce il tuo corpo. Probabilmente era un cibo pro-infiammatorio. Torniamo subito a nutrire l'organismo.",
        "D": "[BUONGUSTAIO FLESSIBILE] Perfetto, spero te lo sia goduto! La vita è fatta di questi piaceri. Dal prossimo pasto si torna al piano, con serenità."
    },
    "Motivazione": {
        "A": "[METODICO SCIENTIFICO] La motivazione si basa sui dati. Guarda i grafici: la tua composizione corporea sta migliorando. I numeri non mentono.",
        "B": "[COACH MOTIVAZIONALE] Ricorda il 'perché' hai iniziato! Celebriamo ogni piccola vittoria, come aver bevuto più acqua o aver resistito a una tentazione.",
        "C": "[OLISTICO INTEGRATO] Senti la nuova energia che hai? Come dormi meglio? La vera motivazione viene dal tuo benessere interiore, non solo dallo specchio.",
        "D": "[BUONGUSTAIO FLESSIBILE] Non devi essere perfetto, devi essere costante. Pensa a questo percorso come a un'abitudine piacevole, non a un sacrificio."
    },
    "Vita Sociale": {
        "A": "[METODICO SCIENTIFICO] Prima di una cena fuori, pianifica. Controlla il menù online e pre-calcola le scelte migliori per non deviare dai tuoi target.",
        "B": "[COACH MOTIVAZIONALE] La socialità è una sfida che puoi vincere. Fissa un obiettivo: un solo bicchiere di vino e scegli l'opzione più sana che ti ispira. Puoi farcela!",
        "C": "[OLISTICO INTEGRATO] La convivialità nutre lo spirito. Scegli luoghi che offrono cibi freschi e reali. Concentrati sulla compagnia e mangia lentamente.",
        "D": "[BUONGUSTAIO FLESSIBILE] Vai e divertiti! La regola dell'80/20 esiste per questo. Scegli quello che ti va, ma con un occhio di riguardo, e vivi il momento."
    },
    "Integrazione": {
        "A": "[METODICO SCIENTIFICO] Gli integratori sono strumenti di precisione. Usali solo a seguito di analisi che dimostrino una reale carenza e a dosaggi specifici.",
        "B": "[COACH MOTIVAZIONALE] Considera gli integratori un piccolo aiuto per supportare i tuoi grandi sforzi! Non sono una magia, ma un modo per dare al corpo quel 5% in più.",
        "C": "[OLISTICO INTEGRATO] Prima cerca i nutrienti dal cibo 'vero'. Se serve, scegli integratori naturali, biodisponibili e di altissima qualità.",
        "D": "[BUONGUSTAIO FLESSIBILE] Mangia bene e non avrai bisogno di pillole. Un'alimentazione varia è l'integratore migliore e più piacevole che esista."
    }
}
THEMES = list(PHILOSOPHY_OPTIONS.keys())

class DigitalAssistant:
    def __init__(self, name="Nanabot"):
        self.name = name
        self.training_progress = 0
        self.unlocked_badges = []
        self.philosophy = {}
        self.config = {
            "sources": [],
            "security": {
                "keywords": ["diabete", "gravidanza", "farmaco", "dolore", "patologia"],
                "coherence_checks": {
                    "Celiachia (Senza Glutine)": True,
                    "Dieta Vegana": True,
                    "Dieta Vegetariana": True,
                    "Intolleranza al Lattosio": True,
                    "Allergie Note": False,
                    "Favismo": False
                }
            },
            "resources": {"patient_plans": True, "my_content": True, "external_content": False}
        }

    def complete_mission(self, mission_number, data):
        """Gestisce il completamento delle missioni di configurazione."""
        if mission_number == 1 and "🏅 Guardiano della Scienza" not in self.unlocked_badges:
            self.training_progress += 25
            self.add_badge("🏅 Guardiano della Scienza")
            self.config["sources"] = data.get("sources", [])
            return "Perfetto! D'ora in poi Nanabot si baserà solo sui dati scientifici che hai approvato."
        elif mission_number == 2 and "🛡️ Sentinella della Salute" not in self.unlocked_badges:
            self.training_progress += 25
            self.add_badge("🛡️ Sentinella della Salute")
            self.config["security"] = data
            return "Ottimo! Le antenne di Nanabot ora sono sintonizzate per intercettare le informazioni critiche."
        elif mission_number == 3 and "🚀 Motore Proattivo" not in self.unlocked_badges:
            self.training_progress += 25
            self.add_badge("🚀 Motore Proattivo")
            self.config["resources"] = data
            return "Fantastico! Hai dato a Nanabot le chiavi della tua 'dispensa di sapienza'."
        return None

    def set_philosophy(self, theme, choice_key):
        """Imposta una delle filosofie dell'assistente."""
        if len(self.philosophy) < len(THEMES):
            self.philosophy[theme] = PHILOSOPHY_OPTIONS[theme][choice_key]
        if len(self.philosophy) == len(THEMES) and "🏆 Master Trainer" not in self.unlocked_badges:
            self.training_progress = 100
            self.add_badge("🏆 Master Trainer")
            return "Congratulazioni, Master Trainer! La personalità di Nanabot è forgiata a tua immagine e somiglianza."
        return None

    def add_badge(self, badge: str):
        """Aggiunge un badge alla lista se non è già presente."""
        if badge not in self.unlocked_badges:
            self.unlocked_badges.append(badge)

    def get_status(self):
        """Restituisce lo stato corrente dell'assistente."""
        return {
            'name': self.name,
            'progress': self.training_progress,
            'badges': self.unlocked_badges,
            'philosophy': self.philosophy,
            'config': self.config,
            'themes_todo': [t for t in THEMES if t not in self.philosophy]
        }

# --- Inizializzazione di Flask e dell'assistente ---
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}}) # Abilita CORS per le API
app.logger.setLevel(logging.INFO) # Imposta il livello di logging
nanabot = DigitalAssistant()

# Dizionario per il rate limiting basato su IP
rate_limit_cache = {}

@app.before_request
def check_rate_limit():
    """Funzione eseguita prima di ogni richiesta per limitare la frequenza."""
    # Escludi le rotte statiche dal rate limiting per non bloccare CSS/JS
    if request.path.startswith('/static'):
        return
        
    ip = request.remote_addr
    now = time()
    # Controlla l'ultimo timestamp per questo IP
    last_request_time = rate_limit_cache.get(ip, 0)
    
    # Limita a 1 richiesta al secondo
    if now - last_request_time < 1:
        app.logger.warning(f"Rate limit superato per l'IP: {ip}")
        return jsonify({'error': 'Stai facendo richieste troppo velocemente. Riprova tra un istante.'}), 429
    
    rate_limit_cache[ip] = now


# --- Rotte dell'applicazione Web ---

@app.route('/')
def home():
    # Serve la pagina principale (ipotizzando che esista un template 'index.html')
    return render_template('index.html')

@app.route('/lab')
def supervision_lab():
    # Serve la pagina del laboratorio di addestramento
    return render_template('lab.html')

# --- Rotte API per l'interfaccia di addestramento ---

@app.route('/api/status')
def status():
    """Restituisce lo stato attuale di Nanabot."""
    return jsonify(nanabot.get_status())

@app.route('/api/philosophy_options')
def philosophy_options():
    """Restituisce le opzioni di filosofia disponibili."""
    return jsonify(PHILOSOPHY_OPTIONS)

@app.route('/api/complete_mission/<int:mission_number>', methods=['POST'])
def handle_mission_completion(mission_number):
    """Gestisce il completamento di una missione di configurazione."""
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'Dati mancanti nel corpo della richiesta'}), 400
        
    message = nanabot.complete_mission(mission_number, data)
    if message:
        return jsonify({'success': True, 'message': message})
    return jsonify({'success': False, 'message': 'Missione già completata o dati non validi'}), 400

@app.route('/api/select_philosophy', methods=['POST'])
def handle_philosophy_selection():
    """Gestisce la selezione di una filosofia."""
    data = request.get_json()
    if not data or 'theme' not in data or 'choice' not in data:
        return jsonify({'success': False, 'message': 'Dati "theme" o "choice" mancanti'}), 400
        
    message = nanabot.set_philosophy(data.get('theme'), data.get('choice'))
    return jsonify({'success': True, 'message': message, 'final_mission_complete': bool(message)})

@app.route('/api/reset', methods=['POST'])
def reset():
    """Resetta l'addestramento di Nanabot allo stato iniziale."""
    global nanabot
    nanabot = DigitalAssistant()
    app.logger.info("Addestramento di Nanabot resettato.")
    return jsonify({'success': True, 'message': 'Addestramento resettato!'})

# --- ROTTA CHAT CON GEMINI (CORRETTA E ROBUSTA) ---

@app.route('/api/ask', methods=['POST'])
def ask_gemini():
    try:
        data = request.get_json()
        if not data or not data.get('question'):
            return jsonify({'error': 'Domanda mancante nel corpo della richiesta.'}), 400

        user_question = data.get('question').strip()

        # Livello 1: Controllo di sicurezza su parole chiave
        # Se la domanda contiene termini delicati, restituisce una risposta predefinita.
        for keyword in nanabot.config['security']['keywords']:
            if keyword.lower() in user_question.lower():
                app.logger.warning(f"Domanda bloccata per parola chiave sensibile: '{keyword}'")
                return jsonify({'answer': "Questa è una domanda che tocca temi delicati. Per la tua sicurezza, è fondamentale che ti confronti direttamente con il tuo nutrizionista."}), 200

        # Livello 2: Estrazione della filosofia addestrata
        # Combina le filosofie scelte in un'unica stringa per guidare il tono dell'AI.
        if nanabot.philosophy:
            filosofie_scelte = ". ".join(nanabot.philosophy.values())
        else:
            # Fallback se nessuna filosofia è stata ancora scelta
            filosofie_scelte = "Il tuo stile è empatico, motivazionale e basato su dati scientifici."

        # Livello 3: Costruzione del prompt di sistema per Gemini
        # Questo "pre-istruisce" l'AI su come deve comportarsi.
        system_prompt = (
            "Sei Nanabot, l'assistente virtuale di un nutrizionista. Devi sempre usare il 'tu' quando ti rivolgi all'utente.\n"
            "Il tuo stile deve essere professionale, ma anche empatico e incoraggiante. Usa un linguaggio semplice e chiaro (plain language), spiegando eventuali termini tecnici.\n"
            "Struttura le tue risposte in modo ordinato, usando elenchi puntati o paragrafi brevi. Puoi usare emoji 'soft' come 💪, ✨, 🌱 per rendere il tono più amichevole.\n"
            "Le tue risposte devono essere concise (idealmente sotto i 250 caratteri) a meno che l'argomento non richieda maggiore dettaglio.\n"
            "NON fornire mai consigli medici, diagnosi o terapie. Invita sempre l'utente a consultare il proprio nutrizionista per questioni specifiche o dubbi sulla salute.\n\n"
            f"La tua personalità e filosofia guida si basa su questi principi: '{filosofie_scelte}'.\n"
            "Applica questi principi senza mai menzionarli esplicitamente."
        )

        # Livello 4: Chiamata all'API di Gemini
        api_key = os.environ.get('GOOGLE_API_KEY')
        if not api_key:
            app.logger.error("La chiave API di Google non è impostata nelle variabili d'ambiente.")
            # Non restituire l'errore esatto all'utente finale per sicurezza
            return jsonify({'error': 'Errore di configurazione del server AI.'}), 500

        # Endpoint dell'API di Gemini
        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
            f"?key={api_key}"
        )
        
        # Payload della richiesta
        payload = {
            "contents": [{
                "parts": [{
                    "text": f"{system_prompt}\n\nDomanda dell'utente: \"{user_question}\""
                }]
            }],
            "generationConfig": {
                "temperature": 0.7,
                "topP": 1.0,
                "maxOutputTokens": 256,
            }
        }
        
        headers = {'Content-Type': 'application/json'}
        
        # Esecuzione della chiamata API
        response = requests.post(url, json=payload, headers=headers)
        
        # Controlla se la richiesta ha avuto successo (es. status 200)
        # Se no, solleva un'eccezione HTTPError con i dettagli.
        response.raise_for_status()

        # Estrazione della risposta dal JSON
        result = response.json()
        
        # Controllo di sicurezza sul risultato
        if 'candidates' not in result or not result['candidates']:
             app.logger.error("Risposta dell'API di Gemini non valida o bloccata per motivi di sicurezza.")
             return jsonify({'answer': "Non sono in grado di rispondere a questa domanda. Prova a riformularla o contatta il tuo nutrizionista."}), 200

        answer = result['candidates'][0]['content']['parts'][0]['text']
        return jsonify({'answer': answer.strip()})

    # --- GESTIONE DEGLI ERRORI MIGLIORATA ---
    except requests.exceptions.HTTPError as http_err:
        # Errore specifico per risposte HTTP non riuscite (es. 400, 403, 500 dall'API di Google)
        app.logger.error(f"Errore HTTP durante la chiamata a Gemini: {http_err} - Risposta: {http_err.response.text}")
        return jsonify({'error': 'Errore di comunicazione con il servizio AI. Potrebbe esserci un problema con la richiesta o con la chiave API.'}), 502 # 502 Bad Gateway
    except Exception as e:
        # Cattura tutte le altre eccezioni (es. problemi di rete, JSON malformato, etc.)
        # Stampa l'errore sulla console per un facile debug
        app.logger.error(f"[ERRORE CRITICO in /api/ask]: {e}", exc_info=True)
        return jsonify({'error': 'Si è verificato un errore interno imprevisto.'}), 500


# --- Esecuzione dell'applicazione ---
if __name__ == '__main__':
    # Usa la porta fornita da una variabile d'ambiente (comune in servizi come Heroku/Render)
    # o la porta 5000 come default per lo sviluppo locale.
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True) # debug=True è utile in sviluppo