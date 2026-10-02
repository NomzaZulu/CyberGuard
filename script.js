// ============================================================
// CYBERGUARD - FRONTEND API CONNECTION
// Organisation-Specific Threat Intelligence
// Hugging Face Space:
// saswatpatra/cyberguard_phishing
// ============================================================

import { Client } from "https://cdn.jsdelivr.net/npm/@gradio/client/+esm";

const HF_SPACE = "saswatpatra/cyberguard_phishing";

let client = null;

// ------------------------------------------------------------
// CONNECT TO HUGGING FACE
// ------------------------------------------------------------

async function connectToBackend() {
    if (client) return client;

    try {
        client = await Client.connect(HF_SPACE);
        console.log("CyberGuard backend connected.");
        return client;
    } catch (error) {
        console.error("Failed to connect to CyberGuard backend:", error);
        throw new Error("Unable to connect to CyberGuard threat engine.");
    }
}


// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------

function getElement(...selectors) {
    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) return element;
    }
    return null;
}


function setLoading(button, loading, originalText) {
    if (!button) return;

    if (loading) {
        button.disabled = true;
        button.dataset.originalText = originalText || button.textContent;
        button.textContent = "Analyzing...";
    } else {
        button.disabled = false;
        button.textContent =
            button.dataset.originalText || originalText || "Analyze";
    }
}


function showResult(result) {
    console.log("CyberGuard result:", result);

    // Try to find the existing result/report container
    const resultContainer = getElement(
        "#result",
        "#results",
        "#analysis-result",
        "#threat-report",
        ".threat-report",
        ".result-container"
    );

    if (!resultContainer) {
        console.warn("Result container not found.");
        return;
    }

    resultContainer.style.display = "block";

    // --------------------------------------------------------
    // Handle Gradio response
    // --------------------------------------------------------

    let data = result;

    if (result && result.data !== undefined) {
        data = result.data;
    }

    // Sometimes the Space returns the result inside an array
    if (Array.isArray(data) && data.length === 1) {
        data = data[0];
    }

    // --------------------------------------------------------
    // JSON/object response
    // --------------------------------------------------------

    if (typeof data === "object") {
        resultContainer.innerHTML = `
            <div class="cg-result">
                <pre>${escapeHTML(
                    JSON.stringify(data, null, 2)
                )}</pre>
            </div>
        `;
        return;
    }

    // --------------------------------------------------------
    // String response
    // --------------------------------------------------------

    resultContainer.innerHTML = `
        <div class="cg-result">
            <pre>${escapeHTML(String(data))}</pre>
        </div>
    `;
}


function showError(message) {
    console.error(message);

    const resultContainer = getElement(
        "#result",
        "#results",
        "#analysis-result",
        "#threat-report",
        ".threat-report",
        ".result-container"
    );

    if (!resultContainer) return;

    resultContainer.style.display = "block";

    resultContainer.innerHTML = `
        <div class="cg-error">
            <strong>Analysis failed</strong>
            <p>${escapeHTML(message)}</p>
        </div>
    `;
}


function escapeHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ============================================================
// MESSAGE / EMAIL / SMS / SOCIAL MEDIA ANALYZER
// API: /analyze_message
// Parameter: message
// ============================================================

async function analyzeMessage() {

    const messageInput = getElement(
        "#message",
        "#messageInput",
        "#message-input",
        "textarea[name='message']"
    );

    const analyzeButton = getElement(
        "#analyzeMessage",
        "#analyze-message",
        ".analyze-message"
    );

    if (!messageInput) {
        console.error("Message input not found.");
        return;
    }

    const message = messageInput.value.trim();

    if (!message) {
        showError("Please enter a message to analyze.");
        return;
    }

    setLoading(analyzeButton, true, "Analyze Message →");

    try {

        const api = await connectToBackend();

        const result = await api.predict("/analyze_message", {
            message: message
        });

        showResult(result);

    } catch (error) {

        console.error(error);

        showError(
            error.message ||
            "Unable to analyze the message."
        );

    } finally {

        setLoading(
            analyzeButton,
            false,
            "Analyze Message →"
        );
    }
}


// ============================================================
// WEBSITE / URL ANALYZER
// API: /analyze_website
// Parameter: url
// ============================================================

async function analyzeWebsite() {

    const urlInput = getElement(
        "#websiteUrl",
        "#website-url",
        "#url",
        "#urlInput",
        "input[name='url']"
    );

    const analyzeButton = getElement(
        "#analyzeWebsite",
        "#analyze-website",
        ".analyze-website"
    );

    if (!urlInput) {
        console.error("Website URL input not found.");
        return;
    }

    const url = urlInput.value.trim();

    if (!url) {
        showError("Please enter a website URL.");
        return;
    }

    setLoading(analyzeButton, true, "Analyze Website →");

    try {

        const api = await connectToBackend();

        const result = await api.predict("/analyze_website", {
            url: url
        });

        showResult(result);

    } catch (error) {

        console.error(error);

        showError(
            error.message ||
            "Unable to analyze the website."
        );

    } finally {

        setLoading(
            analyzeButton,
            false,
            "Analyze Website →"
        );
    }
}


// ============================================================
// QR CODE SCANNER
// API: /scan_qr
// Parameter: image
// ============================================================

async function scanQRCode() {

    const fileInput = getElement(
        "#qrFile",
        "#qr-file",
        "#qrImage",
        "#qr-image",
        "input[type='file']"
    );

    const scanButton = getElement(
        "#scanQR",
        "#scan-qr",
        ".scan-qr"
    );

    if (!fileInput) {
        console.error("QR file input not found.");
        return;
    }

    const file = fileInput.files[0];

    if (!file) {
        showError("Please upload a QR code image.");
        return;
    }

    setLoading(scanButton, true, "Scan QR Code →");

    try {

        const api = await connectToBackend();

        const result = await api.predict("/scan_qr", {
            image: file
        });

        showResult(result);

    } catch (error) {

        console.error(error);

        showError(
            error.message ||
            "Unable to scan the QR code."
        );

    } finally {

        setLoading(
            scanButton,
            false,
            "Scan QR Code →"
        );
    }
}


// ============================================================
// EVENT LISTENERS
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    console.log("CyberGuard frontend loaded.");

    // Message analysis
    const messageButton = getElement(
        "#analyzeMessage",
        "#analyze-message",
        ".analyze-message"
    );

    if (messageButton) {
        messageButton.addEventListener(
            "click",
            analyzeMessage
        );
    }


    // Website analysis
    const websiteButton = getElement(
        "#analyzeWebsite",
        "#analyze-website",
        ".analyze-website"
    );

    if (websiteButton) {
        websiteButton.addEventListener(
            "click",
            analyzeWebsite
        );
    }


    // QR scanner
    const qrButton = getElement(
        "#scanQR",
        "#scan-qr",
        ".scan-qr"
    );

    if (qrButton) {
        qrButton.addEventListener(
            "click",
            scanQRCode
        );
    }

});


// ============================================================
// OPTIONAL GLOBAL ACCESS
// Useful if your HTML uses onclick="..."
// ============================================================

window.analyzeMessage = analyzeMessage;
window.analyzeWebsite = analyzeWebsite;
window.scanQRCode = scanQRCode;
