import smtplib
import os
from email.message import EmailMessage
from app.core.config import settings

def send_report_email(recipient_email: str, subject: str, html_content: str, pdf_path: str = None) -> bool:
    """
    Sends an email with an optional PDF attachment using the configured SMTP server.
    """
    if not settings.SMTP_SERVER or not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        raise Exception("SMTP credentials are not fully configured in the environment.")
    
    sender_email = settings.EMAIL_FROM if settings.EMAIL_FROM else settings.SMTP_USERNAME
    
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = sender_email
    msg["To"] = recipient_email
    
    # Set the HTML body
    msg.set_content("Please enable HTML to view this message.")
    msg.add_alternative(html_content, subtype='html')
    
    # Attach the PDF if it exists
    if pdf_path and os.path.exists(pdf_path):
        try:
            with open(pdf_path, 'rb') as f:
                pdf_data = f.read()
            msg.add_attachment(
                pdf_data, 
                maintype='application', 
                subtype='pdf', 
                filename=os.path.basename(pdf_path)
            )
        except Exception as e:
            print(f"Failed to attach PDF: {e}")
            raise Exception(f"Failed to attach PDF: {e}")
            
    try:
        # Connect to the SMTP server and send
        with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        raise e
