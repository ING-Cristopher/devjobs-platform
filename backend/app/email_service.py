"""
Módulo: email_service.py
Propósito: Envío asíncrono de correos transaccionales de verificación de cuenta
vía SMTP (Gmail, SendGrid, Mailgun, Resend SMTP) con fallback seguro en consola para desarrollo local.
"""

import os
import secrets
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


def is_smtp_configured() -> bool:
    """Retorna True si las variables SMTP requeridas están definidas en el entorno."""
    return bool(
        os.getenv("SMTP_HOST")
        and os.getenv("SMTP_USER")
        and os.getenv("SMTP_PASSWORD")
    )


def generate_verification_token() -> str:
    """Genera un token criptográficamente seguro de un solo uso para confirmar el correo."""
    return secrets.token_urlsafe(32)


def send_verification_email_task(recipient_email: str, recipient_name: str, token: str) -> None:
    """
    Tarea ejecutada en segundo plano (BackgroundTasks de FastAPI) que construye y envía
    el enlace de verificación (/auth/verify?token=...).
    """
    base_url = os.getenv("BACKEND_PUBLIC_URL", "http://127.0.0.1:8000").rstrip("/")
    verify_url = f"{base_url}/auth/verify?token={token}"

    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_from = os.getenv("SMTP_FROM", smtp_user or "no-reply@chamba.do")

    subject = "Confirma tu cuenta en Chamba"
    html_body = f"""
    <div style="font-family: 'DM Sans', system-ui, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #dde2f5; border-radius: 18px; color: #0e1330;">
      <h2 style="margin-top: 0;">Hola, {recipient_name} 👋</h2>
      <p>Gracias por registrarte en <strong>Chamba</strong>. Para activar tu cuenta y poder iniciar sesión, confirma tu correo electrónico haciendo clic en el siguiente botón:</p>
      <p style="margin: 26px 0;">
        <a href="{verify_url}" style="background: #2b4bff; color: #ffffff; text-decoration: none; font-weight: 700; padding: 12px 22px; border-radius: 999px; display: inline-block;">
          Verificar mi correo
        </a>
      </p>
      <p style="font-size: 13px; color: #5b6286;">O copia y pega este enlace en tu navegador:<br/><a href="{verify_url}">{verify_url}</a></p>
    </div>
    """

    # Si no hay servidor SMTP configurado (entorno local / CI), imprimimos el enlace en consola
    if not is_smtp_configured():
        print("=" * 70)
        print(" [EMAIL VERIFICATION - MODO LOCAL SIN SERVIDOR SMTP] ")
        print(f" Para: {recipient_email}")
        print(f" Token: {token}")
        print(f" Enlace de activación: {verify_url}")
        print(" Para recibir correos reales en tu bandeja de entrada,")
        print(" configura SMTP_HOST, SMTP_USER y SMTP_PASSWORD en backend/.env")
        print("=" * 70)
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
            print(f"[EMAIL SUCCESS] Correo de verificación enviado exitosamente a {recipient_email}")
    except Exception as exc:
        print(f"[EMAIL ERROR] No se pudo enviar el correo a {recipient_email}: {exc}")
