from flask import Flask, render_template, request, jsonify
from flask_mail import Mail, Message
import os

app = Flask(__name__)

# -------------------- MAIL CONFIG --------------------
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'affu0420@gmail.com'
app.config['MAIL_PASSWORD'] = 'uhgc fkki fvjk euro'  # your app password

mail = Mail(app)

# -------------------- ROUTES --------------------
@app.route('/')
def intro():
    return render_template('intro.html')

@app.route('/portfolio')
def portfolio():
    return render_template('index.html')

# -------------------- CONTACT FORM HANDLER --------------------
@app.route('/send-message', methods=['POST'])
def send_message():
    name = request.form.get('name')
    email = request.form.get('email')
    subject = request.form.get('subject', 'Portfolio Contact')
    message = request.form.get('message')

    if not name or not email or not message:
        return jsonify({'error': 'All fields (name, email, message) are required.'}), 400

    try:
        msg = Message(
            subject=f"Portfolio: {subject}",
            sender=email,
            recipients=['affu0420@gmail.com'],
            body=f"Name: {name}\nEmail: {email}\n\nMessage:\n{message}"
        )
        mail.send(msg)
        return jsonify({'success': 'Message sent successfully!'}), 200
    except Exception as e:
        print(f"Mail error: {e}")
        return jsonify({'error': 'Failed to send message. Please try again later.'}), 500

if __name__ == '__main__':
    app.run(debug=True)