/* ============================================================
   CYBERGUARD - UI EVENT RECOVERY
   Keeps existing backend/engine logic untouched.
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

    console.log("[CyberGuard] UI event recovery initialized.");

    /* --------------------------------------------------------
       SIDEBAR NAVIGATION
       -------------------------------------------------------- */

    document.querySelectorAll(".nav-item").forEach((button) => {

        button.onclick = function () {

            const view = this.dataset.view;

            if (!view) return;

            if (typeof navigateTo === "function") {
                navigateTo(view);
            }
        };
    });


    /* --------------------------------------------------------
       BUTTONS THAT OPEN A VIEW
       -------------------------------------------------------- */

    document.querySelectorAll("[data-view-target]").forEach((button) => {

        button.onclick = function () {

            const target = this.dataset.viewTarget;

            if (!target) return;

            if (typeof navigateTo === "function") {
                navigateTo(target);
            }
        };
    });


    /* --------------------------------------------------------
       PHISHING ANALYSIS TABS
       -------------------------------------------------------- */

    document.querySelectorAll(".analysis-tab").forEach((button) => {

        button.onclick = function () {

            const analysis =
                this.dataset.analysis;

            if (!analysis) return;

            if (typeof activateAnalysis === "function") {
                activateAnalysis(analysis);
            }
        };
    });


    /* --------------------------------------------------------
       QUICK ACTIONS
       -------------------------------------------------------- */

    document.querySelectorAll(".quick-action").forEach((button) => {

        button.onclick = function () {

            const analysis =
                this.dataset.analysis || "message";

            if (typeof navigateTo === "function") {
                navigateTo("phishing");
            }

            if (typeof activateAnalysis === "function") {
                activateAnalysis(analysis);
            }
        };
    });


    /* --------------------------------------------------------
       OPEN PHISHING SCANNER
       -------------------------------------------------------- */

    const openPhishing =
        document.querySelector("#openPhishingButton");

    if (openPhishing) {

        openPhishing.onclick = function () {

            if (typeof navigateTo === "function") {
                navigateTo("phishing");
            }

            if (typeof activateAnalysis === "function") {
                activateAnalysis("message");
            }
        };
    }


    /* --------------------------------------------------------
       MESSAGE SCAN
       -------------------------------------------------------- */

    const scanMessage =
        document.querySelector("#scanMessageButton");

    if (scanMessage) {

        scanMessage.onclick = function () {

            if (typeof analyzeMessage === "function") {
                analyzeMessage();
            }
        };
    }


    /* --------------------------------------------------------
       CLEAR MESSAGE
       -------------------------------------------------------- */

    const clearMessage =
        document.querySelector("#clearMessageButton");

    if (clearMessage) {

        clearMessage.onclick = function () {

            const input =
                document.querySelector("#messageInput");

            if (input) {
                input.value = "";
                input.dispatchEvent(
                    new Event("input", {
                        bubbles: true
                    })
                );
            }

            if (typeof resetResult === "function") {
                resetResult("message");
            }
        };
    }


    /* --------------------------------------------------------
       URL / WEBSITE MODE
       -------------------------------------------------------- */

    document.querySelectorAll(
        "[data-url-mode]"
    ).forEach((button) => {

        button.onclick = function () {

            const mode =
                this.dataset.urlMode;

            if (!mode) return;

            if (typeof updateUrlModeUI === "function") {

                /*
                 * Existing code reads state.currentUrlMode.
                 * Update it when available.
                 */
                if (
                    typeof state !== "undefined"
                ) {
                    state.currentUrlMode = mode;
                }

                updateUrlModeUI();
            }
        };
    });


    /* --------------------------------------------------------
       URL ANALYSIS
       -------------------------------------------------------- */

    const scanUrl =
        document.querySelector("#scanUrlButton");

    if (scanUrl) {

        scanUrl.onclick = function () {

            if (typeof analyzeUrl === "function") {
                analyzeUrl();
            }
        };
    }


    /* --------------------------------------------------------
       QR CHOOSE IMAGE
       -------------------------------------------------------- */

    const chooseQr =
        document.querySelector("#chooseQrButton");

    const qrInput =
        document.querySelector("#qrInput");

    if (chooseQr && qrInput) {

        chooseQr.onclick = function () {
            qrInput.click();
        };
    }


    /* --------------------------------------------------------
       QR FILE INPUT
       -------------------------------------------------------- */

    if (qrInput) {

        qrInput.onchange = function () {

            const file =
                this.files &&
                this.files[0];

            if (!file) return;

            if (typeof setQrFile === "function") {
                setQrFile(file);
            }
        };
    }


    /* --------------------------------------------------------
       QR SCAN
       -------------------------------------------------------- */

    const scanQr =
        document.querySelector("#scanQrButton");

    if (scanQr) {

        scanQr.onclick = function () {

            if (typeof analyzeQr === "function") {
                analyzeQr();
            }
        };
    }


    /* --------------------------------------------------------
       QR REMOVE
       -------------------------------------------------------- */

    const removeQr =
        document.querySelector("#removeQrButton");

    if (removeQr) {

        removeQr.onclick = function () {

            if (typeof clearQrFile === "function") {
                clearQrFile();
            }
        };
    }


    /* --------------------------------------------------------
       MOBILE MENU
       -------------------------------------------------------- */

    const mobileMenu =
        document.querySelector("#mobileMenu");

    if (mobileMenu) {

        mobileMenu.onclick = function () {

            const sidebar =
                document.querySelector("#sidebar");

            if (sidebar) {
                sidebar.classList.toggle(
                    "mobile-open"
                );
            }
        };
    }


    /* --------------------------------------------------------
       RAW RESPONSE TOGGLES
       -------------------------------------------------------- */

    document.querySelectorAll(
        "[data-raw-toggle]"
    ).forEach((button) => {

        button.onclick = function () {

            const targetId =
                this.dataset.rawToggle;

            if (!targetId) return;

            const target =
                document.querySelector(
                    targetId
                );

            if (!target) return;

            target.classList.toggle("hidden");

            this.classList.toggle("active");
        };
    });


    /* --------------------------------------------------------
       ORGANISATION SAVE
       -------------------------------------------------------- */

    const saveOrganisation =
        document.querySelector(
            "#saveOrganisationButton"
        );

    if (saveOrganisation) {

        saveOrganisation.onclick = function () {

            const input =
                document.querySelector(
                    "#organisationInput"
                );

            if (!input) return;

            const value =
                input.value.trim();

            if (!value) {

                if (
                    typeof showToast === "function"
                ) {
                    showToast(
                        "Organisation name required",
                        "Enter an organisation name first.",
                        "error"
                    );
                }

                return;
            }

            if (
                typeof state !== "undefined"
            ) {
                state.organisation = value;
            }

            localStorage.setItem(
                "cyberguard_organisation",
                value
            );

            if (
                typeof updateOrganisationUI ===
                "function"
            ) {
                updateOrganisationUI();
            }

            if (
                typeof showToast === "function"
            ) {
                showToast(
                    "Organisation updated",
                    "Your organisation name has been updated.",
                    "success"
                );
            }
        };
    }


    /* --------------------------------------------------------
       NEW ANALYSIS
       -------------------------------------------------------- */

    document.querySelectorAll(
        "#newAnalysisButton, [data-new-analysis]"
    ).forEach((button) => {

        button.onclick = function () {

            if (typeof navigateTo === "function") {
                navigateTo("phishing");
            }

            if (typeof activateAnalysis === "function") {
                activateAnalysis("message");
            }

            const input =
                document.querySelector(
                    "#messageInput"
                );

            if (input) {
                input.focus();
            }
        };
    });


    /* --------------------------------------------------------
       CLEAR HISTORY
       -------------------------------------------------------- */

    const clearHistory =
        document.querySelector(
            "#clearHistoryButton"
        );

    if (clearHistory) {

        clearHistory.onclick = function () {

            if (
                typeof state !== "undefined"
            ) {
                state.history = [];
            }

            localStorage.removeItem(
                "cyberguard_analysis_history"
            );

            if (
                typeof renderHistory ===
                "function"
            ) {
                renderHistory();
            }

            if (
                typeof showToast ===
                "function"
            ) {
                showToast(
                    "History cleared",
                    "Analysis history has been removed.",
                    "success"
                );
            }
        };
    }


    console.log(
        "[CyberGuard] UI controls successfully bound."
    );

});
