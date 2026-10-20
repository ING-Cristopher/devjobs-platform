"""
Módulo: email_service.py
Propósito: Generación y envío asíncrono de códigos numéricos de verificación de 6 dígitos
vía SMTP (Gmail, SendGrid, Mailgun, Resend SMTP) con fallback seguro en consola para desarrollo local.
"""

import os
import secrets
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


def is_smtp_configured() -> bool:
    """Retorna True si las credenciales SMTP están definidas en el entorno."""
    return bool(
        os.getenv("SMTP_HOST")
        and os.getenv("SMTP_USER")
        and os.getenv("SMTP_PASSWORD")
    )


def generate_verification_code() -> str:
    """
    Genera un código numérico aleatorio de 6 dígitos criptográficamente seguro (100000 a 999999).
    """
    return f"{secrets.randbelow(900000) + 100000}"


def send_verification_code_email_task(recipient_email: str, recipient_name: str, code: str) -> None:
    """
    Tarea en segundo plano (FastAPI BackgroundTasks) para despachar el correo
    con el código numérico de 6 dígitos visible en texto grande.
    """
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_from = os.getenv("SMTP_FROM", smtp_user or "no-reply@chamba.do")

    subject = f"{code} es tu código de verificación de Chamba"
    html_body = f"""
    <div style="font-family: 'DM Sans', system-ui, -apple-system, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; border: 1px solid #dde2f5; border-radius: 20px; color: #0e1330; background: #ffffff;">
      <div style="font-size: 24px; font-weight: 800; margin-bottom: 20px; color: #0e1330;">chamba<span style="color: #ffb627;">•</span></div>
      <h2 style="margin-top: 0; font-size: 22px;">Hola, {recipient_name} 👋</h2>
      <p style="color: #5b6286; font-size: 15px; line-height: 1.6;">Ingresa el siguiente código numérico de 6 dígitos en la aplicación para activar tu cuenta:</p>
      
      <div style="margin: 28px 0; text-align: center;">
        <div style="display: inline-block; background: #f1f4ff; border: 2px dashed #2b4bff; padding: 16px 28px; border-radius: 14px; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #2b4bff;">
          {code}
        </div>
      </div>

      <p style="color: #5b6286; font-size: 13px;">⏱️ Este código es válido durante los próximos <strong>15 minutos</strong>. No lo compartas con nadie.</p>
      <hr style="border: none; border-top: 1px solid #dde2f5; margin: 24px 0;" />
      <p style="color: #9aa3d0; font-size: 12px; margin-bottom: 0;">Si no solicitaste crear una cuenta en Chamba, puedes ignorar este mensaje.</p>
    </div>
    """

    # Modo Local sin SMTP: Imprimir el código de manera prominente en consola
    if not is_smtp_configured():
        print("\n" + "=" * 65)
        print(" [CHAMBA VERIFICATION CODE - MODO LOCAL]")
        print(f" Destinatario : {recipient_email}")
        print(f" CÓDIGO (6 DÍGITOS) : {code}")
        print(" Vigencia     : 15 minutos")
        print("=" * 65 + "\n")
        return

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = smtp_from
        msg["To"] = recipient_email
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_from, [recipient_email], msg.as_string())
            print(f"[EMAIL SUCCESS] Código de verificación {code} enviado a {recipient_email}")
    except Exception as exc:
        print(f"[EMAIL ERROR] Fallo al enviar correo a {recipient_email}: {exc}")
