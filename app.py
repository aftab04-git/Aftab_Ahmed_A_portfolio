from flask import Flask, render_template, request, jsonify
import os
import requests
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# -------------------- ROUTE --------------------
@app.route('/')
def index():
    return render_template('index.html')

# -------------------- CONTACT FORM (Brevo API) --------------------
@app.route('/send-message', methods=['POST'])
def send_message():
    name = request.form.get('name')
    email = request.form.get('email')
    subject = request.form.get('subject', 'Portfolio Contact')
    message = request.form.get('message')

    if not name or not email or not message:
        return jsonify({'error': 'All fields (name, email, message) are required.'}), 400

    api_key = os.environ.get('BREVO_API_KEY')
    if not api_key:
        return jsonify({'error': 'Email service not configured.'}), 500

    url = "https://api.brevo.com/v3/smtp/email"
    payload = {
        "sender": {"name": "Portfolio Contact", "email": "affu0420@gmail.com"},
        "to": [{"email": "affu0420@gmail.com", "name": "Aftab"}],
        "replyTo": {"email": email, "name": name},
        "subject": f"Portfolio: {subject}",
        "htmlContent": f"""
            <h3>New message from your portfolio</h3>
            <p><strong>Name:</strong> {name}</p>
            <p><strong>Email:</strong> {email}</p>
            <p><strong>Subject:</strong> {subject}</p>
            <p><strong>Message:</strong></p>
            <p>{message}</p>
        """
    }
    headers = {
        "accept": "application/json",
        "api-key": api_key,
        "content-type": "application/json"
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code in (200, 201, 202):
            return jsonify({'success': 'Message sent!'}), 200
        else:
            print(f"Brevo error: {response.status_code} - {response.text}")
            return jsonify({'error': 'Failed to send message.'}), 500
    except Exception as e:
        print(f"Mail error: {e}")
        return jsonify({'error': 'Failed to send message.'}), 500

if __name__ == '__main__':
    app.run(debug=True)