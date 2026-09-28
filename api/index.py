import os
import tempfile

from fastapi import FastAPI, UploadFile, File

from engines.cyberphishing_engine import (
    analyze_message_and_urls,
    create_url_report,
    analyze_fraudulent_website,
    scan_qr_file
)

from engines.impersonation_engine import (
    analyze_digital_impersonation
)


app = FastAPI(
    title="CyberGuard API",
    description="AI-powered cyber threat detection API",
    version="1.0.0"
)


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():

    return {
        "status": "online",
        "service": "CyberGuard API"
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health():

    return {
        "status": "healthy"
    }


# ============================================================
# MESSAGE ANALYSIS
# ============================================================

@app.post("/analyze/message")
def analyze_message(data: dict):

    message = data.get(
        "message",
        ""
    ).strip()

    if not message:

        return {
            "error": "Message is required"
        }

    return analyze_message_and_urls(
        message
    )


# ============================================================
# URL ANALYSIS
# ============================================================

@app.post("/analyze/url")
def analyze_url(data: dict):

    url = data.get(
        "url",
        ""
    ).strip()

    if not url:

        return {
            "error": "URL is required"
        }

    return create_url_report(
        url
    )


# ============================================================
# FRAUDULENT WEBSITE ANALYSIS
# ============================================================

@app.post("/analyze/website")
def analyze_website(data: dict):

    url = data.get(
        "url",
        ""
    ).strip()

    if not url:

        return {
            "error": "Website URL is required"
        }

    return analyze_fraudulent_website(
        url
    )


# ============================================================
# QR CODE ANALYSIS
# ============================================================

@app.post("/analyze/qr")
async def analyze_qr(
    file: UploadFile = File(...)
):

    suffix = os.path.splitext(
        file.filename
    )[1] or ".png"

    temp_file = tempfile.NamedTemporaryFile(
        delete=False,
        suffix=suffix
    )

    try:

        contents = await file.read()

        temp_file.write(
            contents
        )

        temp_file.close()

        result = scan_qr_file(
            temp_file.name
        )

        return result

    finally:

        if os.path.exists(
            temp_file.name
        ):

            os.remove(
                temp_file.name
            )


# ============================================================
# DIGITAL IMPERSONATION ANALYSIS
# ============================================================

@app.post("/analyze/impersonation")
def analyze_impersonation(data: dict):

    claimed_identity = data.get(
        "claimed_identity",
        ""
    ).strip()

    sender_email = data.get(
        "sender_email",
        ""
    ).strip()

    message = data.get(
        "message",
        ""
    ).strip()

    if not claimed_identity:

        return {
            "error": "Claimed identity is required"
        }

    if not message:

        return {
            "error": "Message is required"
        }

    return analyze_digital_impersonation(
        claimed_identity=claimed_identity,
        sender_email=sender_email,
        message=message
    )
