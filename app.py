import requests
import os  # Per leggere le variabili d'ambiente
from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
from time import time
import logging

# --- Classe di Logica (DigitalAssistant) ---
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
                "keywords": ["diabete", "gravidanza", "farmaco", "dolore"],
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
        if len(self.philosophy) < len(THEMES):
            self.philosophy[theme] = PHILOSOPHY_OPTIONS[theme][choice_key]
        if len(self.philosophy) == len(THEMES) and "🏆 Master Trainer" not in self.unlocked_badges:
            self.training_progress = 100
            self.add_badge("🏆 Master Trainer")
            return "Congratulazioni, Master Trainer! La personalità di Nanabot è forgiata a tua immagine e somiglianza."
        return None

    def add_badge(self, badge: str):
        if badge not in self.unlocked_badges:
            self.unlocked_badges.append(badge)

    def get_status(self):
        return {
            'name': self.name,
            'progress': self.training_progress,
            'badges': self.unlocked_badges,
            'philosophy': self.philosophy,
            'config': self.config,
            'themes_todo': [t for t in THEMES if t not in self.philosophy]
        }

# --- Inizializzazione Flask e rate limiting ---
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})
# Logger dettagliato per debugging
app.logger.setLevel(logging.DEBUG)
nanabot = DigitalAssistant()
rate_limit = {}

@app.before_request
def check_rate_limit():
    ip = request.remote_addr
    now = time()
    last = rate_limit.get(ip, 0)
    if now - last < 1:  # almeno 1 secondo tra le richieste
        return jsonify({'error': 'Troppo veloce, riprova tra un secondo.'}), 429
    rate_limit[ip] = now

# --- Rotte Esistenti ---
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/lab')
def supervision_lab():
    return render_template('lab.html')

@app.route('/api/status')
def status():
    return jsonify(nanabot.get_status())

@app.route('/api/philosophy_options')
def philosophy_options():
    return jsonify(PHILOSOPHY_OPTIONS)

@app.route('/api/complete_mission/<int:mission_number>', methods=['POST'])
def handle_mission_completion(mission_number):
    message = nanabot.complete_mission(mission_number, request.get_json())
    if message:
        return jsonify({'success': True, 'message': message})
    return jsonify({'success': False, 'message': 'Missione già completata o dati non validi'}), 400

@app.route('/api/select_philosophy', methods=['POST'])
def handle_philosophy_selection():
    data = request.get_json()
    message = nanabot.set_philosophy(data.get('theme'), data.get('choice'))
    return jsonify({'success': True, 'message': message, 'final_mission_complete': bool(message)})

@app.route('/api/reset', methods=['POST'])
def reset():
    global nanabot
    nanabot = DigitalAssistant()
    return jsonify({'success': True, 'message': 'Addestramento resettato!'})

# --- Nuova Rotta Chat con Gemini ---
@app.route('/api/ask', methods=['POST'])
def ask_gemini():
    try:
        data = request.get_json()
        user_question = data.get('question', '').strip()
        if not user_question:
            return jsonify({'error': 'Domanda mancante'}), 400

        # Verifica di comprensione: se ambigua
        if len(user_question.split()) < 3:
            return jsonify({'answer': 'Potresti specificare meglio la tua domanda?'}), 200

        # Fallback sicuro per keyword sensibili
        for kw in nanabot.config['security']['keywords']:
            if kw.lower() in user_question.lower():
                return jsonify({'answer': (
                    "Non ho informazioni sufficienti su questo tema delicato. "
                    "Per favore contatta direttamente il tuo nutrizionista."
                )}), 200

        # Livello 2: estrazione filosofia in ordine
        filosofie_scelte = ". ".join(
            nanabot.philosophy[theme] for theme in THEMES if theme in nanabot.philosophy
        ) or "empatico, motivazionale e basato su dati scientifici"

        # Costruzione del system prompt
        system_prompt = (
            "Sei Nanabot, assistente virtuale di un nutrizionista. Usa il 'tu'.\n"
            "Stile: professionale ed empatico. Plain language, con termini tecnici spiegati.\n"
            "Struttura: blocchi con titoli ed elenchi. Emoji soft per incoraggiare (es. 💪).\n"
            "Risposte ≤250 caratteri salvo casi complessi.\n"
            "Offri follow-up o promemoria (es. 'Vuoi un promemoria per registrare il pasto domani?').\n"
            "Fornisci link a risorse se utile (es. '/resources/ricetta').\n\n"
            f"Filosofia interna:\n{filosofie_scelte}\n\n"
            "Non esplicitare le filosofie. Non dare consigli medici specifici; invita sempre a consultare il nutrizionista."
        )

        # Chiamata a Gemini
        api_key = os.environ.get('GOOGLE_API_KEY', '')
        if not api_key:
            raise RuntimeError("La chiave API di Google non è stata impostata nelle variabili d'ambiente.")

        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            "gemini-2.0-flash:generateContent"
            f"?key={api_key}"
        )
        payload = {"contents": [{"parts": [{"text": f"{system_prompt}\n\nDomanda: '{user_question}'"}]}]}

        response = requests.post(url, json=payload, headers={'Content-Type': 'application/json'})
        response.raise_for_status()

        result = response.json()
        answer = result['candidates'][0]['content']['parts'][0]['text']
        return jsonify({'answer': answer})
    except Exception:
        app.logger.exception("Errore in /api/ask")
        return jsonify({'error': 'Errore comunicazione AI.'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
