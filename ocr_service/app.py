import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import vertexai
from vertexai.generative_models import GenerativeModel, Part

app = Flask(__name__)
# Autoriser les requêtes venant de n'importe où (pour le dev)
CORS(app, resources={r"/*": {"origins": "*"}})

# --- CONFIGURATION VERTEX AI ---
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "credentials.json"
PROJECT_ID = "rational-lambda-485021-e9"
LOCATION = "us-central1"

print(f"--- Initialisation Vertex AI ({PROJECT_ID}) ---")

model = None

try:
    vertexai.init(project=PROJECT_ID, location=LOCATION)
    
    # MODIFICATION ICI : Utilisation du nom générique plus stable
    # Si 'gemini-1.5-flash' échoue, essayez 'gemini-1.0-pro-vision'
    model_name = "gemini-2.5-flash" 
    
    print(f"⏳ Chargement du modèle {model_name}...")
    model = GenerativeModel(model_name)
    print("✅ Modèle Vertex AI chargé avec succès.")

except Exception as e:
    print("❌ ERREUR INITIALISATION VERTEX :")
    print(e)

@app.route('/scan', methods=['POST'])
def scan_image():
    global model
    if 'image' not in request.files:
        return jsonify({"success": False, "error": "Aucune image envoyée"}), 400

    if model is None:
        return jsonify({"success": False, "error": "Le modèle AI n'est pas chargé (Erreur serveur)"}), 500

    file = request.files['image']
    
    try:
        # Lecture de l'image
        img_bytes = file.read()
        
        # Préparation pour Vertex AI
        image_part = Part.from_data(
            data=img_bytes, 
            mime_type=file.content_type if file.content_type else "image/jpeg"
        )

        prompt = "Extract all text from this image exactly as it appears. No markdown, no comments."

        print("🚀 Envoi à Vertex AI...")
        response = model.generate_content([prompt, image_part])
        
        final_text = response.text
        print("✅ Réponse reçue !")
        
        return jsonify({"success": True, "text": final_text})

    except Exception as e:
        print(f"❌ ERREUR PENDANT LE SCAN : {e}")
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)