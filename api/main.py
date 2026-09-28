from fastapi import FastAPI, UploadFile, File
import tempfile
import os

from cyberphishing_engine import (
    analyze_message_and_urls,
    create_url_report,
    analyze_fraudulent_website,
    scan_qr_file
)

app = FastAPI(
    title="CyberGuard API",
    description="AI-powered cyber threat detection API",
    version="1.0.0"
)


@app.get("/")
def root():
    return {
        "status": "online",
        "service": "CyberGuard API"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


@app.post("/analyze/message")
def analyze_message(data: dict):

    message = data.get("message", "").strip()

    if not message:
        return {
            "error": "Message is required"
        }

    return analyze_message_and_urls(message)


@app.post("/analyze/url")
def analyze_url(data: dict):

    url = data.get("url", "").strip()

    if not url:
        return {
            "error": "URL is required"
        }

    return create_url_report(url)


@app.post("/analyze/website")
def analyze_website(data: dict):

    url = data.get("url", "").strip()

    if not url:
        return {
            "error": "Website URL is required"
        }

    return analyze_fraudulent_website(url)


@app.post("/analyze/qr")
async def analyze_qr(file: UploadFile = File(...)):

    suffix = os.path.splitext(
        file.filename
    )[1] or ".png"

    temp_file = tempfile.NamedTemporaryFile(
        delete=False,
        suffix=suffix
    )

    try:

        contents = await file.read()

        temp_file.write(contents)
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
