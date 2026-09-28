/* =========================================================
   CYBERGUARD API
========================================================= */

async function callCyberGuardAPI(endpoint, options = {}) {

    try {

        const response = await fetch(endpoint, {
            ...options,
            headers: {
                ...(options.body instanceof FormData
                    ? {}
                    : {
                        "Content-Type": "application/json"
                    }),
                ...(options.headers || {})
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.detail ||
                data.error ||
                `API request failed (${response.status})`
            );
        }

        return data;

    } catch (error) {

        console.error("CyberGuard API Error:", error);

        throw error;
    }
}


/* =========================================================
   MESSAGE / EMAIL / SMS / SOCIAL MESSAGE ANALYSIS
========================================================= */

async function analyzeMessage(message) {

    if (!message || !message.trim()) {
        throw new Error("Message is required.");
    }

    return await callCyberGuardAPI(
        "/analyze/message",
        {
            method: "POST",
            body: JSON.stringify({
                message: message.trim()
            })
        }
    );
}


/* =========================================================
   URL ANALYSIS
========================================================= */

async function analyzeURL(url) {

    if (!url || !url.trim()) {
        throw new Error("URL is required.");
    }

    return await callCyberGuardAPI(
        "/analyze/url",
        {
            method: "POST",
            body: JSON.stringify({
                url: url.trim()
            })
        }
    );
}


/* =========================================================
   FRAUDULENT WEBSITE ANALYSIS
========================================================= */

async function analyzeWebsite(url) {

    if (!url || !url.trim()) {
        throw new Error("Website URL is required.");
    }

    return await callCyberGuardAPI(
        "/analyze/website",
        {
            method: "POST",
            body: JSON.stringify({
                url: url.trim()
            })
        }
    );
}


/* =========================================================
   QR CODE ANALYSIS
========================================================= */

async function analyzeQR(file) {

    if (!file) {
        throw new Error("QR image is required.");
    }

    const formData = new FormData();

    formData.append("file", file);

    return await callCyberGuardAPI(
        "/analyze/qr",
        {
            method: "POST",
            body: formData
        }
    );
}


/* =========================================================
   DIGITAL IMPERSONATION ANALYSIS
========================================================= */

async function analyzeImpersonation(
    claimedIdentity,
    senderEmail,
    message
) {

    if (!claimedIdentity || !claimedIdentity.trim()) {
        throw new Error("Claimed identity is required.");
    }

    if (!message || !message.trim()) {
        throw new Error("Message is required.");
    }

    return await callCyberGuardAPI(
        "/analyze/impersonation",
        {
            method: "POST",
            body: JSON.stringify({
                claimed_identity: claimedIdentity.trim(),
                sender_email: senderEmail
                    ? senderEmail.trim()
                    : "",
                message: message.trim()
            })
        }
    );
}


/* =========================================================
   LANDING PAGE CONTROL
========================================================= */

const landingPage =
    document.getElementById("landingPage");

const appPage =
    document.getElementById("appPage");


function enterCyberGuard() {

    if (landingPage) {
        landingPage.style.display = "none";
    }

    if (appPage) {
        appPage.classList.remove("hidden-app");
    }

    window.scrollTo({
        top: 0,
        behavior: "instant"
    });
}


function exitCyberGuard() {

    if (appPage) {
        appPage.classList.add("hidden-app");
    }

    if (landingPage) {
        landingPage.style.display = "block";
    }

    window.scrollTo({
        top: 0,
        behavior: "instant"
    });
}


function scrollToSection(id) {

    const section =
        document.getElementById(id);

    if (!section) return;

    section.scrollIntoView({
        behavior: "smooth"
    });
}
