import {
    Client,
    handle_file
} from "https://cdn.jsdelivr.net/npm/@gradio/client/dist/index.min.js";


// ============================================================
// CYBERGUARD — HUGGING FACE BACKEND
// ============================================================

const HF_SPACE = "saswatpatra/cyberguard_phishing";

let cyberguardClient = null;


// ============================================================
// CONNECT TO HUGGING FACE
// ============================================================

async function getClient() {

    if (cyberguardClient) {
        return cyberguardClient;
    }

    cyberguardClient = await Client.connect(HF_SPACE);

    console.log("CyberGuard Hugging Face Space connected.");

    return cyberguardClient;
}


// ============================================================
// GENERIC RESPONSE CLEANER
// ============================================================

function cleanResponse(result) {

    console.log("RAW HF RESPONSE:", result);

    let data = result?.data;

    // Gradio normally returns an array.
    if (Array.isArray(data) && data.length === 1) {
        data = data[0];
    }

    // Sometimes the backend returns nested arrays.
    while (Array.isArray(data) && data.length === 1) {
        data = data[0];
    }

    // Backend may return JSON as a string.
    if (typeof data === "string") {

        try {
            data = JSON.parse(data);
        } catch {
            return {
                message: data
            };
        }
    }

    return data || {};
}


// ============================================================
// FIND VALUE RECURSIVELY
// ============================================================

function findValue(obj, keys) {

    if (!obj || typeof obj !== "object") {
        return null;
    }

    for (const key of keys) {

        if (
            Object.prototype.hasOwnProperty.call(obj, key) &&
            obj[key] !== null &&
            obj[key] !== undefined
        ) {
            return obj[key];
        }
    }

    for (const value of Object.values(obj)) {

        if (value && typeof value === "object") {

            const found = findValue(value, keys);

            if (
                found !== null &&
                found !== undefined
            ) {
                return found;
            }
        }
    }

    return null;
}


// ============================================================
// FORMAT VALUES FOR UI
// ============================================================

function formatValue(value) {

    if (value === null || value === undefined) {
        return "None detected";
    }

    if (Array.isArray(value)) {

        if (value.length === 0) {
            return "None detected";
        }

        return value.join(", ");
    }

    if (typeof value === "object") {

        const entries = Object.entries(value);

        if (entries.length === 0) {
            return "None detected";
        }

        return entries
            .map(([key, val]) => {

                if (Array.isArray(val)) {
                    val = val.join(", ");
                }

                return `${key}: ${val}`;
            })
            .join(" • ");
    }

    return String(value);
}


// ============================================================
// DISPLAY THREAT REPORT
// ============================================================

function displayReport(rawData, type = "message") {

    console.log("CLEANED CYBERGUARD DATA:", rawData);

    const data = rawData || {};

    const analysis =
        findValue(data, ["analysis"]) || data;

    const status =
        findValue(analysis, ["status"]) ||
        findValue(data, ["status"]) ||
        "Analysis completed";

    const riskLevel =
        findValue(analysis, [
            "risk_level",
            "riskLevel"
        ]) ||
        findValue(data, [
            "risk_level",
            "riskLevel"
        ]) ||
        "Unknown";

    const riskScore =
        findValue(analysis, [
            "risk_score",
            "riskScore"
        ]) ??
        findValue(data, [
            "risk_score",
            "riskScore"
        ]);

    const prediction =
        findValue(analysis, [
            "model_prediction",
            "prediction",
            "ai_prediction"
        ]) ||
        findValue(data, [
            "model_prediction",
            "prediction",
            "ai_prediction"
        ]);

    const confidence =
        findValue(analysis, [
            "model_confidence",
            "confidence"
        ]) ??
        findValue(data, [
            "model_confidence",
            "confidence"
        ]);

    const indicators =
        findValue(analysis, [
            "high_risk_combinations",
            "indicators",
            "detected_indicators"
        ]) ||
        findValue(data, [
            "high_risk_combinations",
            "indicators",
            "detected_indicators"
        ]);

    const categories =
        findValue(analysis, [
            "detected_categories",
            "threat_categories",
            "categories"
        ]) ||
        findValue(data, [
            "detected_categories",
            "threat_categories",
            "categories"
        ]);

    const impersonation =
        findValue(analysis, [
            "possible_impersonation",
            "impersonated_brand",
            "impersonation"
        ]) ||
        findValue(data, [
            "possible_impersonation",
            "impersonated_brand",
            "impersonation"
        ]);

    const recommendation =
        findValue(analysis, [
            "organisation_recommendation",
            "organization_recommendation",
            "recommendation"
        ]) ||
        findValue(data, [
            "organisation_recommendation",
            "organization_recommendation",
            "recommendation"
        ]);

    // --------------------------------------------------------
    // Locate report elements
    // --------------------------------------------------------

    const statusElement =
        document.getElementById("report-status");

    const riskLevelElement =
        document.getElementById("risk-level");

    const riskScoreElement =
        document.getElementById("risk-score");

    const predictionElement =
        document.getElementById("ai-prediction");

    const confidenceElement =
        document.getElementById("model-confidence");

    const indicatorsElement =
        document.getElementById("detected-indicators");

    const categoriesElement =
        document.getElementById("threat-categories");

    const impersonationElement =
        document.getElementById("possible-impersonation");

    const recommendationElement =
        document.getElementById("organisation-recommendation");

    const badgeElement =
        document.getElementById("report-badge");


    // --------------------------------------------------------
    // Update UI
    // --------------------------------------------------------

    if (statusElement) {
        statusElement.textContent =
            formatValue(status);
    }

    if (riskLevelElement) {
        riskLevelElement.textContent =
            formatValue(riskLevel);
    }

    if (riskScoreElement) {

        if (
            riskScore === null ||
            riskScore === undefined
        ) {
            riskScoreElement.textContent = "— / 100";
        } else {
            riskScoreElement.textContent =
                `${riskScore} / 100`;
        }
    }

    if (predictionElement) {
        predictionElement.textContent =
            formatValue(prediction);
    }

    if (confidenceElement) {

        if (
            confidence === null ||
            confidence === undefined
        ) {
            confidenceElement.textContent = "—";
        } else {
            confidenceElement.textContent =
                `${confidence}%`;
        }
    }

    if (indicatorsElement) {
        indicatorsElement.textContent =
            formatValue(indicators);
    }

    if (categoriesElement) {
        categoriesElement.textContent =
            formatValue(categories);
    }

    if (impersonationElement) {
        impersonationElement.textContent =
            formatValue(impersonation);
    }

    if (recommendationElement) {
        recommendationElement.textContent =
            formatValue(recommendation);
    }


    // --------------------------------------------------------
    // Report badge
    // --------------------------------------------------------

    if (badgeElement) {

        let badge = String(riskLevel);

        if (riskLevel === "Unknown") {
            badge = "UNKNOWN";
        } else {
            badge = badge.toUpperCase();
        }

        badgeElement.textContent = badge;
    }
}


// ============================================================
// MESSAGE ANALYSIS
// ============================================================

async function analyzeMessage(message) {

    if (!message || !message.trim()) {
        alert("Please enter a message to analyze.");
        return;
    }

    setLoading(true);

    try {

        const client = await getClient();

        const result = await client.predict(
            "/analyze_message",
            {
                message: message
            }
        );

        const data = cleanResponse(result);

        displayReport(data, "message");

    } catch (error) {

        console.error(
            "Message analysis failed:",
            error
        );

        showError(
            "Message analysis failed. Please try again."
        );

    } finally {

        setLoading(false);
    }
}


// ============================================================
// WEBSITE / URL ANALYSIS
// ============================================================

async function analyzeWebsite(url) {

    if (!url || !url.trim()) {
        alert("Please enter a website URL.");
        return;
    }

    setLoading(true);

    try {

        const client = await getClient();

        const result = await client.predict(
            "/analyze_website",
            {
                url: url
            }
        );

        const data = cleanResponse(result);

        displayReport(data, "website");

    } catch (error) {

        console.error(
            "Website analysis failed:",
            error
        );

        showError(
            "Website analysis failed. Please try again."
        );

    } finally {

        setLoading(false);
    }
}


// ============================================================
// QR CODE ANALYSIS
// ============================================================

async function scanQRCode(file) {

    if (!file) {
        alert("Please upload a QR code image.");
        return;
    }

    setLoading(true);

    try {

        const client = await getClient();

        console.log(
            "Sending QR image to CyberGuard..."
        );

        const result = await client.predict(
            "/scan_qr",
            {
                image: handle_file(file)
            }
        );

        console.log(
            "RAW QR RESULT:",
            result
        );

        const data = cleanResponse(result);

        console.log(
            "CLEANED QR RESULT:",
            data
        );

        displayReport(data, "qr");

    } catch (error) {

        console.error(
            "QR analysis failed:",
            error
        );

        showError(
            "QR code analysis failed. Please try another image."
        );

    } finally {

        setLoading(false);
    }
}


// ============================================================
// LOADING STATE
// ============================================================

function setLoading(loading) {

    const buttons =
        document.querySelectorAll(
            "button"
        );

    buttons.forEach(button => {

        if (loading) {
            button.dataset.oldText =
                button.textContent;

            button.disabled = true;

            button.textContent =
                "Analyzing...";
        } else {

            button.disabled = false;

            if (button.dataset.oldText) {
                button.textContent =
                    button.dataset.oldText;
            }
        }
    });
}


// ============================================================
// ERROR DISPLAY
// ============================================================

function showError(message) {

    const statusElement =
        document.getElementById("report-status");

    const badgeElement =
        document.getElementById("report-badge");

    if (statusElement) {
        statusElement.textContent =
            message;
    }

    if (badgeElement) {
        badgeElement.textContent =
            "ERROR";
    }
}


// ============================================================
// CONNECT BUTTONS TO YOUR HTML
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        // ----------------------------------------------------
        // MESSAGE BUTTON
        // ----------------------------------------------------

        const messageButton =
            document.getElementById(
                "analyze-message"
            );

        const messageInput =
            document.getElementById(
                "message-input"
            );

        if (
            messageButton &&
            messageInput
        ) {

            messageButton.addEventListener(
                "click",
                () => {

                    analyzeMessage(
                        messageInput.value
                    );

                }
            );
        }


        // ----------------------------------------------------
        // WEBSITE BUTTON
        // ----------------------------------------------------

        const websiteButton =
            document.getElementById(
                "analyze-website"
            );

        const websiteInput =
            document.getElementById(
                "website-input"
            );

        if (
            websiteButton &&
            websiteInput
        ) {

            websiteButton.addEventListener(
                "click",
                () => {

                    analyzeWebsite(
                        websiteInput.value
                    );

                }
            );
        }


        // ----------------------------------------------------
        // QR BUTTON
        // ----------------------------------------------------

        const qrButton =
            document.getElementById(
                "scan-qr"
            );

        const qrInput =
            document.getElementById(
                "qr-input"
            );

        if (
            qrButton &&
            qrInput
        ) {

            qrButton.addEventListener(
                "click",
                () => {

                    scanQRCode(
                        qrInput.files[0]
                    );

                }
            );
        }

    }
);
