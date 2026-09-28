/* =========================================================
   CYBERGUARD FRONTEND
   MODE 1 = REAL BACKEND
   MODE 2 = DEMO
   MODE 3 = DEMO
========================================================= */


/* =========================================================
   API CONFIGURATION
========================================================= */

// Because FastAPI is deployed inside /api/index.py
// we use the same Vercel domain.
const API_BASE = "/api";


/* =========================================================
   PAGE NAVIGATION
========================================================= */

function showPage(pageId) {

    const pages = document.querySelectorAll(".page");

    pages.forEach(page => {
        page.classList.remove("active-page");
    });

    const selectedPage = document.getElementById(pageId);

    if (selectedPage) {
        selectedPage.classList.add("active-page");
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   HELPER — ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    if (value === null || value === undefined) {
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
   HELPER — FORMAT OBJECT
========================================================= */

function formatValue(value) {

    if (value === null || value === undefined) {
        return "—";
    }

    if (typeof value === "object") {

        if (Array.isArray(value)) {
            return value
                .map(item => formatValue(item))
                .join(", ");
        }

        return Object.entries(value)
            .map(([key, val]) => {
                return `${key}: ${formatValue(val)}`;
            })
            .join("<br>");
    }

    return escapeHTML(value);
}


/* =========================================================
   HELPER — CREATE REPORT
========================================================= */

function createReportHTML(title, data, status = "ANALYZED") {

    let rows = "";

    if (typeof data === "object" && data !== null) {

        Object.entries(data).forEach(([key, value]) => {

            rows += `
                <div class="report-item">
                    <span>${escapeHTML(
                        key.replace(/_/g, " ")
                           .replace(/\b\w/g, char => char.toUpperCase())
                    )}</span>

                    <span>${formatValue(value)}</span>
                </div>
            `;

        });

    } else {

        rows = `
            <div class="report-item">
                <span>Result</span>
                <span>${formatValue(data)}</span>
            </div>
        `;

    }

    return `
        <div class="report-header">

            <h3>
                ${escapeHTML(title)}
            </h3>

            <span class="risk-badge">
                ${escapeHTML(status)}
            </span>

        </div>

        ${rows}
    `;
}


/* =========================================================
   HELPER — LOADING STATE
========================================================= */

function showLoading(element, title = "CYBERGUARD THREAT REPORT") {

    element.innerHTML = `

        <div class="report-header">

            <h3>
                ${escapeHTML(title)}
            </h3>

            <span class="risk-badge">
                ANALYZING
            </span>

        </div>

        <div class="report-item">

            <span>Status</span>

            <span>
                CyberGuard detection engine is analyzing...
            </span>

        </div>

    `;
}


/* =========================================================
   HELPER — API ERROR
========================================================= */

function showAPIError(element, error, title = "CYBERGUARD THREAT REPORT") {

    element.innerHTML = `

        <div class="report-header">

            <h3>
                ${escapeHTML(title)}
            </h3>

            <span class="risk-badge">
                ERROR
            </span>

        </div>

        <div class="report-item">

            <span>Status</span>

            <span>
                Analysis failed
            </span>

        </div>

        <div class="report-item">

            <span>Error</span>

            <span>
                ${escapeHTML(error)}
            </span>

        </div>

    `;
}


/* =========================================================
   MODE 1 — PHISHING
   MESSAGE ANALYSIS
========================================================= */

async function analyzePhishing() {

    const textElement =
        document.getElementById("phishingText");

    const result =
        document.getElementById("phishingResult");

    if (!textElement || !result) {
        return;
    }

    const text = textElement.value.trim();

    if (!text) {

        alert("Please enter a message first.");

        return;
    }


    /* Show loading */

    showLoading(
        result,
        "CYBERGUARD THREAT REPORT"
    );


    try {

        const response = await fetch(
            `${API_BASE}/analyze/message`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    message: text
                })
            }
        );


        /* Read backend response */

        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                `Server returned ${response.status}`
            );

        }


        /* Display actual engine result */

        result.innerHTML =
            createReportHTML(
                "CYBERGUARD THREAT REPORT",
                data,
                "ANALYZED"
            );


    } catch (error) {

        console.error(
            "Message analysis error:",
            error
        );

        showAPIError(
            result,
            error.message ||
            "Unable to connect to CyberGuard API."
        );

    }

}


/* =========================================================
   MODE 1 — URL ANALYSIS
========================================================= */

async function analyzeURL() {

    const urlInput =
        document.getElementById("urlInput");

    const result =
        document.getElementById("urlResult");

    if (!urlInput || !result) {
        return;
    }

    const url =
        urlInput.value.trim();


    if (!url) {

        alert("Please enter a URL first.");

        return;
    }


    /* Show loading */

    showLoading(
        result,
        "URL THREAT REPORT"
    );


    try {

        const response = await fetch(
            `${API_BASE}/analyze/url`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    url: url
                })
            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                `Server returned ${response.status}`
            );

        }


        /* Display real URL engine result */

        result.innerHTML =
            createReportHTML(
                "URL THREAT REPORT",
                data,
                "ANALYZED"
            );


    } catch (error) {

        console.error(
            "URL analysis error:",
            error
        );

        showAPIError(
            result,
            error.message ||
            "Unable to connect to CyberGuard API.",
            "URL THREAT REPORT"
        );

    }

}


/* =========================================================
   MODE 1 — FRAUDULENT WEBSITE ANALYSIS
========================================================= */

async function analyzeWebsite() {

    /*
       Your current HTML does not have an ID on the
       website input, so we locate it from the URL scanner.
    */

    const urlScanner =
        document.querySelector(".url-scanner");

    const result =
        document.getElementById("urlResult");

    if (!urlScanner || !result) {
        return;
    }


    const inputs =
        urlScanner.querySelectorAll(
            'input[type="url"]'
        );


    /*
       First input = URL analyzer
       Second input = Website analyzer
    */

    if (inputs.length < 2) {

        alert(
            "Website input field was not found."
        );

        return;
    }


    const websiteURL =
        inputs[1].value.trim();


    if (!websiteURL) {

        alert(
            "Please enter a website URL first."
        );

        return;
    }


    showLoading(
        result,
        "WEBSITE THREAT REPORT"
    );


    try {

        const response = await fetch(
            `${API_BASE}/analyze/website`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    url: websiteURL
                })
            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                `Server returned ${response.status}`
            );

        }


        result.innerHTML =
            createReportHTML(
                "WEBSITE THREAT REPORT",
                data,
                "ANALYZED"
            );


    } catch (error) {

        console.error(
            "Website analysis error:",
            error
        );

        showAPIError(
            result,
            error.message ||
            "Unable to connect to CyberGuard API.",
            "WEBSITE THREAT REPORT"
        );

    }

}


/* =========================================================
   MODE 1 — QR CODE ANALYSIS
========================================================= */

async function analyzeQR(file) {

    const result =
        document.getElementById("phishingResult");

    if (!result) {
        return;
    }


    if (!file) {

        alert(
            "Please select a QR image first."
        );

        return;
    }


    showLoading(
        result,
        "QR THREAT REPORT"
    );


    try {

        /*
           QR endpoint expects multipart/form-data
        */

        const formData =
            new FormData();

        formData.append(
            "file",
            file
        );


        const response = await fetch(
            `${API_BASE}/analyze/qr`,
            {
                method: "POST",
                body: formData
            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                `Server returned ${response.status}`
            );

        }


        result.innerHTML =
            createReportHTML(
                "QR THREAT REPORT",
                data,
                "ANALYZED"
            );


    } catch (error) {

        console.error(
            "QR analysis error:",
            error
        );

        showAPIError(
            result,
            error.message ||
            "Unable to connect to CyberGuard API.",
            "QR THREAT REPORT"
        );

    }

}


/* =========================================================
   QR FILE SELECTION
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
            function () {

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

                    const heading =
                        uploadArea.querySelector(
                            "h4"
                        );

                    const description =
                        uploadArea.querySelector(
                            "p"
                        );


                    if (heading) {

                        heading.textContent =
                            file.name;

                    }


                    if (description) {

                        description.textContent =
                            "QR image selected — click to change";

                    }

                }


                /*
                   Automatically send QR image
                   to CyberGuard backend.
                */

                analyzeQR(file);

            }
        );

    }
);


/* =========================================================
   MODE 2 — ACCOUNT TAKEOVER
   DEMO ONLY
========================================================= */

function demoAccountAnalysis() {

    const result =
        document.getElementById(
            "accountResult"
        );

    if (!result) {
        return;
    }


    result.innerHTML = `

        <div class="report-header">

            <h3>
                ACCOUNT THREAT REPORT
            </h3>

            <span class="risk-badge">
                DEMO
            </span>

        </div>


        <div class="report-item">

            <span>
                Status
            </span>

            <span>
                Activity submitted
            </span>

        </div>


        <div class="report-item">

            <span>
                Behaviour
            </span>

            <span>
                Demo analysis
            </span>

        </div>


        <div class="report-item">

            <span>
                Detection engine
            </span>

            <span>
                Coming soon
            </span>

        </div>


        <div class="report-item">

            <span>
                Recommendation
            </span>

            <span>
                Account takeover engine not connected
            </span>

        </div>

    `;

}


/* =========================================================
   INITIALIZATION
========================================================= */

console.log(
    "CyberGuard frontend initialized."
);

console.log(
    "Mode 1: REAL BACKEND"
);

console.log(
    "Mode 2: DEMO"
);

console.log(
    "Mode 3: DEMO"
);
