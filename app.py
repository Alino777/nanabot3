# --- 1. IMPORT NECESSARI ---
from flask import Flask, jsonify, request, render_template
from flask_cors import CORS

# --- 2. DATI E CLASSE DI LOGICA ---
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
        self.training_progress = 100 # Assumiamo addestramento completo per il lab
        self.philosophy = {
            "Gestione dello Sgarro": PHILOSOPHY_OPTIONS["Gestione dello Sgarro"]["B"],
            "Motivazione": PHILOSOPHY_OPTIONS["Motivazione"]["B"],
            "Vita Sociale": PHILOSOPHY_OPTIONS["Vita Sociale"]["D"],
            "Integrazione": PHILOSOPHY_OPTIONS["Integrazione"]["D"]
        }
    # ... (le altre funzioni della classe non sono necessarie per il lab ma le lasciamo)
    def get_status(self):
        return { 'name': self.name, 'philosophy': self.philosophy }

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})
nanabot = DigitalAssistant()

# --- Rotte Principali ---
@app.route('/')
def training_app():
    return "Pagina di Addestramento (funzionante)" # Segnaposto

@app.route('/lab')
def supervision_lab():
    return render_template('lab.html')

# --- API ---
@app.route('/api/ask', methods=['POST'])
def ask_gemini():
    try:
        data = request.get_json()
        user_question = data.get('question')
        if not user_question:
            return jsonify({'error': 'Domanda mancante'}), 400

        filosofie_scelte = ". ".join(nanabot.philosophy.values())
        system_prompt = (
            "Sei Nanabot, un assistente virtuale per un nutrizionista. Il tuo tono è professionale ma empatico. "
            f"La tua filosofia guida è: '{filosofie_scelte}'. "
            "Rispondi alla domanda del paziente in modo chiaro e incoraggiante. "
            "Non dare mai consigli medici specifici. Se la domanda è delicata, "
            "consiglia gentilmente di rivolgersi direttamente al nutrizionista."
        )

        api_key = ""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
        
        payload = {"contents": [{"parts": [{"text": f"{system_prompt}\n\nDomanda: \"{user_question}\""}]}]}
        response = requests.post(url, json=payload, headers={'Content-Type': 'application/json'})
        response.raise_for_status()
        
        result = response.json()
        bot_response = result['candidates'][0]['content']['parts'][0]['text']
        return jsonify({'answer': bot_response})

    except Exception as e:
        print(f"Errore in /api/ask: {e}")
        return jsonify({'error': 'Errore durante la comunicazione con il servizio AI.'}), 500
