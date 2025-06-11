from flask import Flask, render_template

# Creiamo l'app Flask. Vercel la cercherà.
app = Flask(__name__)

# Una sola rotta che mostra la nostra pagina di test.
@app.route('/')
def hello_world():
    # Cerca il file index.html nella cartella /templates
    return render_template('index.html')
