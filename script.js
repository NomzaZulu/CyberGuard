/*
=========================================================
CYBERGUARD
Organisation Security

Frontend:
    index.html
    style.css
    script.js

Backend:
    Hugging Face Space
    saswatpatra/cyberguard_phishing

Available endpoints:
    /analyze_message
    /analyze_website
    /scan_qr
=========================================================
*/


import { Client, handle_file } from
    "https://cdn.jsdelivr.net/npm/@gradio/client/+esm";


// =======================================================
// HUGGING FACE SPACE
// =======================================================

const HF_SPACE = "saswatpatra/cyberguard_phishing";

let clientPromise = null;


// Connect once and reuse the connection.
async function getClient() {

    if (!clientPromise) {

        clientPromise = Client.connect(HF_SPACE);

    }

    return await clientPromise;
}


// =======================================================
// DOM ELEMENTS
// =======================================================

const tabs = document.querySelectorAll(".scanner-tab");

const panels = {
    message: document.getElementById("message-panel"),
    website: document.getElementById("website-panel"),
    qr: document.getElementById("qr-panel")
};

const messageInput =
    document.getElementById("message-input");

const websiteInput =
    document.getElementById("website-input");

const qrInput =
    document.getElementById("qr-input");

const uploadArea =
    document.getElementById("upload-area");

const fileSelected =
    document.getElementById("file-selected");

const analyzeMessageButton =
    document.getElementById("analyze-message-btn");

const analyzeWebsiteButton =
    document.getElementById("analyze-website-btn");

const analyzeQRButton =
    document.getElementById("analyze-qr-btn");

const clearQRButton =
    document.getElementById("clear-qr-btn");


// =======================================================
// REPORT ELEMENTS
// =======================================================

const reportCard =
    document.getElementById("report-card");

const reportLoading =
    document.getElementById("report-loading");

const reportError =
    document.getElementById("report-error");

const reportContent =
    document.getElementById("report-content");

const reportBadge =
    document.getElementById("report-badge");

const reportType =
    document.getElementById("report-type");

const resultStatus =
    document.getElementById("result-status");

const resultRisk =
    document.getElementById("result-risk");

const resultScore =
    document.getElementById("result-score");

const resultPrediction =
    document.getElementById("result-prediction");

const resultConfidence =
    document.getElementById("result-confidence");

const resultIndicators =
    document.getElementById("result-indicators");

const resultCategories =
    document.getElementById("result-categories");

const resultImpersonation =
    document.getElementById("result-impersonation");

const resultRecommendation =
    document.getElementById("result-recommendation");

const decodedContentWrapper =
    document.getElementById("decoded-content-wrapper");

const decodedContent =
    document.getElementById("decoded-content");


// =======================================================
// TAB SWITCHING
// =======================================================

tabs.forEach(tab => {

    tab.addEventListener("click", () => {

        const selectedTab =
            tab.dataset.tab;


        // Active tab
        tabs.forEach(item => {

            item.classList.remove("active");

        });

        tab.classList.add("active");


        // Active panel
        Object.values(panels).forEach(panel => {

            panel.classList.remove("active");

        });

        panels[selectedTab].classList.add("active");


        // Reset old report when changing scanner type
        resetReport();

    });

});


// =======================================================
// MESSAGE ANALYSIS
// =======================================================

analyzeMessageButton.addEventListener(
    "click",
    async () => {

        const message =
            messageInput.value.trim();


        if (!message) {

            showError(
                "Please enter a message before starting the analysis."
            );

            return;

        }


        setLoading(true, "MESSAGE");


        try {

            const client =
                await getClient();


            const result =
                await client.predict(
                    "/analyze_message",
                    {
                        message: message
                    }
                );


            const data =
                extractResult(result);


            displayReport(
                data,
                "MESSAGE ANALYSIS"
            );


        } catch (error) {

            console.error(
                "Message analysis error:",
                error
            );

            showError(
                getErrorMessage(error)
            );

        } finally {

            setLoading(false);

        }

    }
);


// =======================================================
// WEBSITE / URL ANALYSIS
// =======================================================

analyzeWebsiteButton.addEventListener(
    "click",
    async () => {

        const url =
            websiteInput.value.trim();


        if (!url) {

            showError(
                "Please enter a website URL before starting the analysis."
            );

            return;

        }


        setLoading(true, "WEBSITE ANALYSIS");


        try {

            const client =
                await getClient();


            const result =
                await client.predict(
                    "/analyze_website",
                    {
                        url: url
                    }
                );


            const data =
                extractResult(result);


            displayReport(
                data,
                "WEBSITE ANALYSIS"
            );


        } catch (error) {

            console.error(
                "Website analysis error:",
                error
            );

            showError(
                getErrorMessage(error)
            );

        } finally {

            setLoading(false);

        }

    }
);


// =======================================================
// QR FILE SELECTION
// =======================================================

qrInput.addEventListener(
    "change",
    () => {

        const file =
            qrInput.files[0];


        if (!file) {

            fileSelected.textContent = "";

            analyzeQRButton.disabled = true;

            return;

        }


        fileSelected.textContent =
            `Selected: ${file.name}`;


        analyzeQRButton.disabled = false;

    }
);


// =======================================================
// QR ANALYSIS
// =======================================================

analyzeQRButton.addEventListener(
    "click",
    async () => {

        const file =
            qrInput.files[0];


        if (!file) {

            showError(
                "Please select a QR-code image first."
            );

            return;

        }


        setLoading(true, "QR ANALYSIS");


        try {

            const client =
                await getClient();


            /*
             * Gradio's handle_file converts the
             * browser File into the format expected
             * by the Space's image input.
             */

            const result =
                await client.predict(
                    "/scan_qr",
                    {
                        image: handle_file(file)
                    }
                );


            const data =
                extractResult(result);


            displayReport(
                data,
                "QR ANALYSIS"
            );


        } catch (error) {

            console.error(
                "QR analysis error:",
                error
            );

            showError(
                getErrorMessage(error)
            );

        } finally {

            setLoading(false);

        }

    }
);


// =======================================================
// CLEAR MESSAGE / WEBSITE INPUTS
// =======================================================

document.querySelectorAll(
    "[data-clear]"
).forEach(button => {

    button.addEventListener(
        "click",
        () => {

            const target =
                document.getElementById(
                    button.dataset.clear
                );

            if (target) {

                target.value = "";

            }

            resetReport();

        }
    );

});


// =======================================================
// CLEAR QR
// =======================================================

clearQRButton.addEventListener(
    "click",
    () => {

        qrInput.value = "";

        fileSelected.textContent = "";

        analyzeQRButton.disabled = true;

        resetReport();

    }
);


// =======================================================
// DRAG & DROP QR
// =======================================================

uploadArea.addEventListener(
    "dragover",
    event => {

        event.preventDefault();

        uploadArea.classList.add("dragover");

    }
);

uploadArea.addEventListener(
    "dragleave",
    () => {

        uploadArea.classList.remove("dragover");

    }
);

uploadArea.addEventListener(
    "drop",
    event => {

        event.preventDefault();

        uploadArea.classList.remove("dragover");


        const file =
            event.dataTransfer.files[0];


        if (!file) {
            return;
        }


        if (!file.type.startsWith("image/")) {

            showError(
                "Please upload an image file containing the QR code."
            );

            return;

        }


        /*
         * DataTransfer lets us place the dropped file
         * into the normal file input.
         */

        const dataTransfer =
            new DataTransfer();

        dataTransfer.items.add(file);

        qrInput.files =
            dataTransfer.files;


        fileSelected.textContent =
            `Selected: ${file.name}`;


        analyzeQRButton.disabled = false;

    }
);


// =======================================================
// LOADING STATE
// =======================================================

function setLoading(
    loading,
    type = ""
) {

    reportError.classList.remove("active");

    if (loading) {

        reportLoading.classList.add("active");

        reportContent.style.display = "none";

        reportBadge.textContent = "ANALYSING";
        reportBadge.className =
            "report-badge neutral";

        reportType.textContent = type;

        reportCard.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    } else {

        reportLoading.classList.remove("active");

        reportContent.style.display = "block";

    }

}


// =======================================================
// ERROR
// =======================================================

function showError(message) {

    reportLoading.classList.remove("active");

    reportContent.style.display = "none";

    reportError.textContent = message;

    reportError.classList.add("active");

    reportBadge.textContent = "ERROR";

    reportBadge.className =
        "report-badge danger";

    reportType.textContent =
        "ANALYSIS FAILED";


    reportCard.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}


// =======================================================
// RESET REPORT
// =======================================================

function resetReport() {

    reportLoading.classList.remove("active");

    reportError.classList.remove("active");

    reportContent.style.display = "block";


    reportBadge.textContent =
        "WAITING";

    reportBadge.className =
        "report-badge neutral";


    reportType.textContent =
        "WAITING";


    resultStatus.textContent =
        "Awaiting analysis";

    resultRisk.textContent =
        "—";

    resultScore.textContent =
        "— / 100";

    resultPrediction.textContent =
        "—";

    resultConfidence.textContent =
        "—";

    resultIndicators.textContent =
        "None detected";

    resultCategories.textContent =
        "None detected";

    resultImpersonation.textContent =
        "None detected";

    resultRecommendation.textContent =
        "No analysis available.";


    decodedContentWrapper.style.display =
        "none";

    decodedContent.textContent =
        "";

}


// =======================================================
// EXTRACT GRADIO RESULT
// =======================================================

function extractResult(result) {

    /*
     * Gradio normally returns:
     *
     * {
     *     data: [...]
     * }
     *
     * The Space currently exposes a JSON output,
     * so the actual object can be inside data[0].
     */


    if (!result) {
        return {};
    }


    let data =
        result.data;


    if (Array.isArray(data)) {

        if (data.length === 1) {

            data = data[0];

        }

    }


    /*
     * Sometimes a JSON component may arrive
     * as a string. Try to parse it.
     */

    if (typeof data === "string") {

        try {

            return JSON.parse(data);

        } catch {

            return {
                message: data
            };

        }

    }


    if (
        data &&
        typeof data === "object"
    ) {

        return data;

    }


    return {
        result: data
    };

}


// =======================================================
// DISPLAY REPORT
// =======================================================

function displayReport(
    rawData,
    type
) {

    const data =
        normaliseResult(rawData);


    reportLoading.classList.remove("active");

    reportError.classList.remove("active");

    reportContent.style.display =
        "block";


    reportType.textContent =
        type;


    resultStatus.textContent =
        data.status || "Analysis completed";


    resultRisk.textContent =
        data.risk_level || "Unknown";


    resultScore.textContent =
        formatScore(data.risk_score);


    resultPrediction.textContent =
        formatValue(data.model_prediction);


    resultConfidence.textContent =
        formatConfidence(data.model_confidence);


    resultIndicators.textContent =
        formatCollection(data.indicators);


    resultCategories.textContent =
        formatCollection(data.categories);


    resultImpersonation.textContent =
        formatCollection(data.impersonation);


    resultRecommendation.textContent =
        data.recommendation ||
        "No additional recommendation provided.";


    /*
     * If QR analysis or another endpoint gives
     * decoded content, show it.
     */

    const decoded =
        data.decoded_content ||
        data.decoded_text ||
        data.payload;


    if (
        decoded &&
        typeof decoded === "string"
    ) {

        decodedContentWrapper.style.display =
            "block";

        decodedContent.textContent =
            decoded;

    } else {

        decodedContentWrapper.style.display =
            "none";

        decodedContent.textContent =
            "";

    }


    updateRiskBadge(
        data.risk_level,
        data.model_prediction
    );


    reportCard.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}


// =======================================================
// NORMALISE BACKEND RESPONSE
// =======================================================

function normaliseResult(data) {

    /*
     * Your existing engine uses fields such as:
     *
     * status
     * risk_level
     * risk_score
     * model_prediction
     * model_confidence
     * indicator_score
     * high_risk_combinations
     * detected_categories
     * recommendation
     *
     * We preserve those names here.
     */


    if (!data || typeof data !== "object") {

        return {
            status: "Analysis completed"
        };

    }


    return {

        status:
            data.status ||
            "Analysis completed",


        risk_level:
            data.risk_level ||
            data.risk ||
            "Unknown",


        risk_score:
            data.risk_score ??
            data.score ??
            null,


        model_prediction:
            data.model_prediction ||
            data.prediction ||
            null,


        model_confidence:
            data.model_confidence ??
            data.confidence ??
            null,


        indicators:
            data.indicators ||
            data.detected_indicators ||
            data.high_risk_combinations ||
            [],


        categories:
            data.detected_categories ||
            data.threat_categories ||
            data.categories ||
            {},


        impersonation:
            data.possible_impersonation ||
            data.impersonation ||
            data.impersonated_brands ||
            [],


        recommendation:
            data.recommendation ||
            data.organisation_recommendation ||
            data.organization_recommendation ||
            null,


        decoded_content:
            data.decoded_content ||
            data.decoded_text ||
            data.qr_content ||
            null,


        payload:
            data.payload ||
            null

    };

}


// =======================================================
// FORMAT SCORE
// =======================================================

function formatScore(score) {

    if (
        score === null ||
        score === undefined ||
        score === ""
    ) {

        return "— / 100";

    }


    const numeric =
        Number(score);


    if (Number.isNaN(numeric)) {

        return `${score} / 100`;

    }


    return `${Math.round(numeric)} / 100`;

}


// =======================================================
// FORMAT CONFIDENCE
// =======================================================

function formatConfidence(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "—";

    }


    const numeric =
        Number(value);


    if (Number.isNaN(numeric)) {

        return String(value);

    }


    /*
     * Backend may already return 0–100.
     */

    if (numeric <= 1) {

        return `${Math.round(numeric * 100)}%`;

    }


    return `${Math.round(numeric)}%`;

}


// =======================================================
// FORMAT GENERIC VALUE
// =======================================================

function formatValue(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "—";

    }


    if (
        typeof value === "object"
    ) {

        return Object.entries(value)
            .map(
                ([key, val]) =>
                    `${key}: ${val}`
            )
            .join(", ");

    }


    return String(value);

}


// =======================================================
// FORMAT COLLECTION
// =======================================================

function formatCollection(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "None detected";

    }


    if (
        Array.isArray(value)
    ) {

        if (value.length === 0) {

            return "None detected";

        }


        return value
            .map(item => {

                if (
                    typeof item === "object"
                ) {

                    return Object.entries(item)
                        .map(
                            ([key, val]) =>
                                `${key}: ${val}`
                        )
                        .join(", ");

                }

                return String(item);

            })
            .join(" • ");

    }


    if (
        typeof value === "object"
    ) {

        const entries =
            Object.entries(value);


        if (entries.length === 0) {

            return "None detected";

        }


        return entries
            .map(
                ([key, val]) =>
                    `${key}: ${formatValue(val)}`
            )
            .join(" • ");

    }


    return String(value);

}


// =======================================================
// RISK BADGE
// =======================================================

function updateRiskBadge(
    riskLevel,
    prediction
) {

    const risk =
        String(
            riskLevel || ""
        ).toLowerCase();


    const model =
        String(
            prediction || ""
        ).toLowerCase();


    reportBadge.className =
        "report-badge";


    /*
     * High-risk / phishing
     */

    if (
        risk.includes("high") ||
        risk.includes("critical") ||
        model.includes("phish") ||
        model.includes("malicious")
    ) {

        reportBadge.textContent =
            "THREAT";

        reportBadge.classList.add(
            "danger"
        );

        return;

    }


    /*
     * Medium / suspicious
     */

    if (
        risk.includes("medium") ||
        risk.includes("suspicious") ||
        risk.includes("moderate")
    ) {

        reportBadge.textContent =
            "SUSPICIOUS";

        reportBadge.classList.add(
            "warning"
        );

        return;

    }


    /*
     * Low / benign
     */

    if (
        risk.includes("low") ||
        risk.includes("safe") ||
        model.includes("benign")
    ) {

        reportBadge.textContent =
            "LOW RISK";

        reportBadge.classList.add(
            "safe"
        );

        return;

    }


    reportBadge.textContent =
        "ANALYSED";

    reportBadge.classList.add(
        "neutral"
    );

}


// =======================================================
// ERROR MESSAGE HELPER
// =======================================================

function getErrorMessage(error) {

    if (!error) {

        return "The detection engine returned an unknown error.";

    }


    if (error.message) {

        return error.message;

    }


    return String(error);

}


// =======================================================
// INITIAL STATE
// =======================================================

resetReport();


// =======================================================
// OPTIONAL: CONNECT ON PAGE LOAD
// =======================================================

/*
 * We intentionally don't block page loading if the
 * Hugging Face Space is waking up.
 *
 * The connection will happen when the user actually
 * runs an analysis.
 */

console.log(
    "CyberGuard frontend loaded."
);

console.log(
    `Backend: Hugging Face Space ${HF_SPACE}`
);
