/* =========================================================
   CYBERGUARD FRONTEND
   Organisation Threat Intelligence
========================================================= */


/*
============================================================
IMPORTANT
============================================================

Replace this with the URL of your deployed FastAPI backend.

Example:

const API_BASE_URL =
    "https://your-cyberguard-api.hf.space";

DO NOT put a trailing slash.

============================================================
*/

const API_BASE_URL =
    "YOUR_FASTAPI_BACKEND_URL";


/* =========================================================
   PAGE NAVIGATION
========================================================= */

function showPage(pageId) {

    const pages =
        document.querySelectorAll(".page");


    pages.forEach(page => {

        page.classList.remove("active-page");

    });


    const selectedPage =
        document.getElementById(pageId);


    if (selectedPage) {

        selectedPage.classList.add("active-page");

    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =========================================================
   API HELPER
========================================================= */

async function apiRequest(
    endpoint,
    options = {}
) {

    const url =
        API_BASE_URL.replace(/\/$/, "") +
        endpoint;


    try {

        const response =
            await fetch(url, options);


        const contentType =
            response.headers.get(
                "content-type"
            );


        let data;


        if (
            contentType &&
            contentType.includes("application/json")
        ) {

            data = await response.json();

        } else {

            const text =
                await response.text();

            data = {
                error: text
            };

        }


        if (!response.ok) {

            throw new Error(
                data.error ||
                `Request failed (${response.status})`
            );

        }


        return data;

    }

    catch (error) {

        console.error(
            "CyberGuard API error:",
            error
        );

        throw error;

    }

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   FORMAT VALUE
========================================================= */

function formatValue(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "—";

    }


    if (Array.isArray(value)) {

        if (value.length === 0) {

            return "None detected";

        }


        return value
            .map(item => escapeHTML(item))
            .join("<br>");

    }


    if (typeof value === "object") {

        return Object.entries(value)
            .map(
                ([key, val]) =>
                    `<strong>${escapeHTML(key)}:</strong> ${formatValue(val)}`
            )
            .join("<br>");

    }


    return escapeHTML(value);

}


/* =========================================================
   RISK CLASS
========================================================= */

function riskClass(level) {

    if (!level) {
        return "";
    }


    const value =
        level.toLowerCase();


    if (value.includes("high")) {
        return "report-danger";
    }


    if (value.includes("medium")) {
        return "report-warning";
    }


    if (
        value.includes("low") ||
        value.includes("safe")
    ) {

        return "report-safe";

    }


    return "";

}


/* =========================================================
   LOADING STATE
========================================================= */

function setLoading(
    button,
    loading,
    originalText
) {

    if (!button) {
        return;
    }


    if (loading) {

        button.dataset.originalText =
            button.innerHTML;

        button.innerHTML =
            "Analyzing...";

        button.classList.add(
            "loading"
        );

    } else {

        button.innerHTML =
            button.dataset.originalText ||
            originalText;

        button.classList.remove(
            "loading"
        );

    }

}


/* =========================================================
   PHISHING MESSAGE ANALYSIS
========================================================= */

async function analyzePhishing() {

    const input =
        document.getElementById(
            "phishingText"
        );


    const result =
        document.getElementById(
            "phishingResult"
        );


    const button =
        document.querySelector(
            '#phishing button[onclick="analyzePhishing()"]'
        );


    const message =
        input.value.trim();


    if (!message) {

        alert(
            "Please enter a message first."
        );

        return;

    }


    setLoading(
        button,
        true
    );


    result.innerHTML = `
        <div class="report-header">
            <h3>CYBERGUARD THREAT REPORT</h3>
            <span class="risk-badge">ANALYZING</span>
        </div>

        <div class="report-item">
            <span>Status</span>
            <span>Sending input to threat engine...</span>
        </div>
    `;


    try {

        const data =
            await apiRequest(
                "/api/analyze/message",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        message: message
                    })
                }
            );


        renderMessageReport(
            result,
            data
        );

    }

    catch (error) {

        renderError(
            result,
            error
        );

    }

    finally {

        setLoading(
            button,
            false
        );

    }

}


/* =========================================================
   MESSAGE REPORT
========================================================= */

function renderMessageReport(
    container,
    data
) {

    if (data.error) {

        renderError(
            container,
            new Error(data.error)
        );

        return;

    }


    const report =
        data.message_report || data;


    const riskLevel =
        report.risk_level ||
        "Unknown";


    const categories =
        report.detected_categories ||
        {};


    const categoryHTML =
        Object.entries(categories)
            .map(
                ([category, values]) => `
                    <div>
                        <strong>
                            ${escapeHTML(category)}
                        </strong>:
                        ${formatValue(values)}
                    </div>
                `
            )
            .join("");


    const combinations =
        report.high_risk_combinations ||
        [];


    const urls =
        data.url_reports ||
        [];


    container.innerHTML = `

        <div class="report-header">

            <h3>
                CYBERGUARD THREAT REPORT
            </h3>

            <span class="risk-badge">
                ANALYZED
            </span>

        </div>


        <div class="report-item">

            <span>
                Status
            </span>

            <span class="${riskClass(riskLevel)}">
                ${escapeHTML(report.status || "—")}
            </span>

        </div>


        <div class="report-item">

            <span>
                Risk Level
            </span>

            <span class="${riskClass(riskLevel)}">
                ${escapeHTML(riskLevel)}
            </span>

        </div>


        <div class="report-item">

            <span>
                Risk Score
            </span>

            <span>
                ${escapeHTML(report.risk_score ?? "—")} / 100
            </span>

        </div>


        <div class="report-item">

            <span>
                ML Prediction
            </span>

            <span>
                ${escapeHTML(report.model_prediction || "—")}
            </span>

        </div>


        <div class="report-item">

            <span>
                Model Confidence
            </span>

            <span>
                ${escapeHTML(report.model_confidence ?? "—")}%
            </span>

        </div>


        <div class="report-item">

            <span>
                Indicator Score
            </span>

            <span>
                ${escapeHTML(report.indicator_score ?? "—")}
            </span>

        </div>


        <div class="report-item">

            <span>
                Detected Categories
            </span>

            <span>
                ${categoryHTML || "None detected"}
            </span>

        </div>


        <div class="report-item">

            <span>
                High-Risk Combinations
            </span>

            <span>
                ${formatValue(combinations)}
            </span>

        </div>


        <div class="report-item">

            <span>
                Recommendation
            </span>

            <span>
                ${formatValue(report.recommendation)}
            </span>

        </div>


        <div class="report-item">

            <span>
                URLs Found
            </span>

            <span>
                ${urls.length}
            </span>

        </div>

    `;

}


/* =========================================================
   URL ANALYSIS
========================================================= */

async function analyzeURL() {

    const input =
        document.getElementById(
            "urlInput"
        );


    const result =
        document.getElementById(
            "urlResult"
        );


    const button =
        document.querySelector(
            '#url button[onclick="analyzeURL()"]'
        );


    const url =
        input.value.trim();


    if (!url) {

        alert(
            "Please enter a URL first."
        );

        return;

    }


    setLoading(
        button,
        true
    );


    result.innerHTML = `
        <div class="report-header">
            <h3>URL THREAT REPORT</h3>
            <span class="risk-badge">ANALYZING</span>
        </div>

        <div class="report-item">
            <span>Status</span>
            <span>Analyzing URL...</span>
        </div>
    `;


    try {

        const data =
            await apiRequest(
                "/api/analyze/url",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        url: url
                    })
                }
            );


        renderURLReport(
            result,
            data
        );

    }

    catch (error) {

        renderError(
            result,
            error
        );

    }

    finally {

        setLoading(
            button,
            false
        );

    }

}


/* =========================================================
   URL REPORT
========================================================= */

function renderURLReport(
    container,
    data
) {

    if (data.error) {

        renderError(
            container,
            new Error(data.error)
        );

        return;

    }


    const riskLevel =
        data.risk_level ||
        "Unknown";


    container.innerHTML = `

        <div class="report-header">

            <h3>
                URL THREAT REPORT
            </h3>

            <span class="risk-badge">
                ANALYZED
            </span>

        </div>


        <div class="report-item">

            <span>
                URL
            </span>

            <span>
                ${escapeHTML(data.url || "—")}
            </span>

        </div>


        <div class="report-item">

            <span>
                Status
            </span>

            <span class="${riskClass(riskLevel)}">
                ${escapeHTML(data.status || "—")}
            </span>

        </div>


        <div class="report-item">

            <span>
                Risk Level
            </span>

            <span class="${riskClass(riskLevel)}">
                ${escapeHTML(riskLevel)}
            </span>

        </div>


        <div class="report-item">

            <span>
                Risk Score
            </span>

            <span>
                ${escapeHTML(data.risk_score ?? "—")} / 100
            </span>

        </div>


        <div class="report-item">

            <span>
                Possible Impersonation
            </span>

            <span>
                ${formatValue(
                    data.possible_impersonated_brands
                )}
            </span>

        </div>


        <div class="report-item">

            <span>
                Indicators
            </span>

            <span>
                ${formatValue(
                    data.detected_indicators
                )}
            </span>

        </div>


        <div class="report-item">

            <span>
                Recommendation
            </span>

            <span>
                ${formatValue(
                    data.recommendation
                )}
            </span>

        </div>

    `;

}


/* =========================================================
   WEBSITE ANALYSIS
========================================================= */

async function analyzeWebsite() {

    const input =
        document.getElementById(
            "websiteInput"
        );


    const result =
        document.getElementById(
            "urlResult"
        );


    const button =
        document.querySelector(
            '#url button[onclick="analyzeWebsite()"]'
        );


    const url =
        input.value.trim();


    if (!url) {

        alert(
            "Please enter a website URL first."
        );

        return;

    }


    setLoading(
        button,
        true
    );


    result.innerHTML = `
        <div class="report-header">
            <h3>WEBSITE THREAT REPORT</h3>
            <span class="risk-badge">ANALYZING</span>
        </div>

        <div class="report-item">
            <span>Status</span>
            <span>Analyzing website...</span>
        </div>
    `;


    try {

        const data =
            await apiRequest(
                "/api/analyze/website",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        url: url
                    })
                }
            );


        renderWebsiteReport(
            result,
            data
        );

    }

    catch (error) {

        renderError(
            result,
            error
        );

    }

    finally {

        setLoading(
            button,
            false
        );

    }

}


/* =========================================================
   WEBSITE REPORT
========================================================= */

function renderWebsiteReport(
    container,
    data
) {

    if (data.error) {

        renderError(
            container,
            new Error(data.error)
        );

        return;

    }


    const riskLevel =
        data.risk_level ||
        "Unknown";


    container.innerHTML = `

        <div class="report-header">

            <h3>
                WEBSITE THREAT REPORT
            </h3>

            <span class="risk-badge">
                ANALYZED
            </span>

        </div>


        <div class="report-item">

            <span>
                Website
            </span>

            <span>
                ${escapeHTML(data.url || "—")}
            </span>

        </div>


        <div class="report-item">

            <span>
                Status
            </span>

            <span class="${riskClass(riskLevel)}">
                ${escapeHTML(data.status || "—")}
            </span>

        </div>


        <div class="report-item">

            <span>
                Risk Level
            </span>

            <span class="${riskClass(riskLevel)}">
                ${escapeHTML(riskLevel)}
            </span>

        </div>


        <div class="report-item">

            <span>
                Risk Score
            </span>

            <span>
                ${escapeHTML(data.risk_score ?? "—")} / 100
            </span>

        </div>


        <div class="report-item">

            <span>
                Possible Impersonation
            </span>

            <span>
                ${formatValue(
                    data.possible_impersonated_brands
                )}
            </span>

        </div>


        <div class="report-item">

            <span>
                Website Indicators
            </span>

            <span>
                ${formatValue(
                    data.website_indicators
                )}
            </span>

        </div>


        <div class="report-item">

            <span>
                Recommendation
            </span>

            <span>
                ${formatValue(
                    data.recommendation
                )}
            </span>

        </div>

    `;

}


/* =========================================================
   QR CODE ANALYSIS
========================================================= */

async function analyzeQR(file) {

    const result =
        document.getElementById(
            "phishingResult"
        );


    result.innerHTML = `
        <div class="report-header">
            <h3>QR THREAT REPORT</h3>
            <span class="risk-badge">ANALYZING</span>
        </div>

        <div class="report-item">
            <span>Status</span>
            <span>Scanning QR code...</span>
        </div>
    `;


    const formData =
        new FormData();


    formData.append(
        "file",
        file
    );


    try {

        const data =
            await apiRequest(
                "/api/analyze/qr",
                {
                    method: "POST",
                    body: formData
                }
            );


        renderQRReport(
            result,
            data
        );

    }

    catch (error) {

        renderError(
            result,
            error
        );

    }

}


/* =========================================================
   QR REPORT
========================================================= */

function renderQRReport(
    container,
    data
) {

    if (data.error) {

        renderError(
            container,
            new Error(data.error)
        );

        return;

    }


    const analysis =
        data.analysis || {};


    container.innerHTML = `

        <div class="report-header">

            <h3>
                QR THREAT REPORT
            </h3>

            <span class="risk-badge">
                ANALYZED
            </span>

        </div>


        <div class="report-item">

            <span>
                QR Status
            </span>

            <span>
                ${escapeHTML(
                    data.status ||
                    "QR code detected"
                )}
            </span>

        </div>


        <div class="report-item">

            <span>
                Payload Type
            </span>

            <span>
                ${escapeHTML(
                    data.payload_type ||
                    "—"
                )}
            </span>

        </div>


        <div class="report-item">

            <span>
                Payload
            </span>

            <span>
                ${escapeHTML(
                    data.payload ||
                    "—"
                )}
            </span>

        </div>


        <div class="report-item">

            <span>
                Analysis
            </span>

            <span>
                ${formatValue(analysis)}
            </span>

        </div>

    `;

}


/* =========================================================
   QR FILE INPUT
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const qrInput =
            document.getElementById(
                "qrInput"
            );


        if (!qrInput) {
            return;
        }


        qrInput.addEventListener(
            "change",
            async function () {

                if (
                    !qrInput.files ||
                    qrInput.files.length === 0
                ) {

                    return;

                }


                const file =
                    qrInput.files[0];


                const uploadArea =
                    qrInput.closest(
                        ".upload-area"
                    );


                if (uploadArea) {

                    const title =
                        uploadArea.querySelector(
                            "h4"
                        );

                    const text =
                        uploadArea.querySelector(
                            "p"
                        );


                    if (title) {

                        title.textContent =
                            file.name;

                    }


                    if (text) {

                        text.textContent =
                            "Scanning QR image...";

                    }

                }


                await analyzeQR(file);

            }
        );

    }
);


/* =========================================================
   ACCOUNT TAKEOVER ANALYSIS
========================================================= */

function analyzeAccountActivity() {

    const failed =
        document.getElementById(
            "failedLogins"
        ).value;


    const location =
        document.getElementById(
            "loginLocation"
        ).value;


    const device =
        document.getElementById(
            "deviceInfo"
        ).value;


    const session =
        document.getElementById(
            "sessionBehaviour"
        ).value;


    const result =
        document.getElementById(
            "accountResult"
        );


    const failedCount =
        Number(failed) || 0;


    const indicators = [];


    if (failedCount >= 5) {

        indicators.push(
            `${failedCount} failed login attempts`
        );

    }


    if (location) {

        indicators.push(
            `Login location: ${location}`
        );

    }


    if (device) {

        indicators.push(
            `Device: ${device}`
        );

    }


    if (session) {

        indicators.push(
            `Session behaviour: ${session}`
        );

    }


    let risk = 0;


    if (failedCount >= 10) {

        risk += 50;

    } else if (failedCount >= 5) {

        risk += 30;

    }


    if (device) {

        risk += 20;

    }


    if (session) {

        risk += 20;

    }


    risk =
        Math.min(
            risk,
            100
        );


    let level =
        "Low Risk";


    if (risk >= 75) {

        level =
            "High Risk";

    } else if (risk >= 30) {

        level =
            "Medium Risk";

    }


    result.innerHTML = `

        <div class="report-header">

            <h3>
                ACCOUNT THREAT REPORT
            </h3>

            <span class="risk-badge">
                ANALYZED
            </span>

        </div>


        <div class="report-item">

            <span>
                Status
            </span>

            <span class="${riskClass(level)}">
                ${risk >= 30
                    ? "Suspicious Account Activity"
                    : "No Immediate Threat Detected"}
            </span>

        </div>


        <div class="report-item">

            <span>
                Risk Level
            </span>

            <span class="${riskClass(level)}">
                ${level}
            </span>

        </div>


        <div class="report-item">

            <span>
                Risk Score
            </span>

            <span>
                ${risk} / 100
            </span>

        </div>


        <div class="report-item">

            <span>
                Indicators
            </span>

            <span>
                ${formatValue(indicators)}
            </span>

        </div>


        <div class="report-item">

            <span>
                Recommendation
            </span>

            <span>
                ${
                    risk >= 30
                    ? "Verify the activity, review active sessions and secure the affected account."
                    : "Continue monitoring account activity."
                }
            </span>

        </div>

    `;

}


/* =========================================================
   API CONNECTION ERROR
========================================================= */

function renderError(
    container,
    error
) {

    container.innerHTML = `

        <div class="report-header">

            <h3>
                CYBERGUARD ERROR
            </h3>

            <span class="risk-badge">
                ERROR
            </span>

        </div>


        <div class="report-item">

            <span>
                Status
            </span>

            <span class="report-danger">
                Backend connection failed
            </span>

        </div>


        <div class="report-item">

            <span>
                Details
            </span>

            <span>
                ${escapeHTML(
                    error.message ||
                    "Unknown error"
                )}
            </span>

        </div>


        <div class="report-item">

            <span>
                Check
            </span>

            <span>
                Make sure the FastAPI backend is running,
                the API URL is correct and CORS is configured.
            </span>

        </div>

    `;

}


/* =========================================================
   INITIALIZATION
========================================================= */

console.log(
    "CyberGuard frontend loaded."
);

console.log(
    "API:",
    API_BASE_URL
);
