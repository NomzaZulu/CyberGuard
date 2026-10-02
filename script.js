/* ============================================================
   NORMALIZE RESULT
   Handles nested CyberGuard engine responses
   ============================================================ */

function normalizeResult(data) {

    let value = unwrapGradioData(data);

    /* If the engine returns JSON as a string */
    if (typeof value === "string") {

        const parsed = tryParseJson(value);

        if (parsed !== null) {
            value = parsed;
        }
    }

    const result = {
        raw: value,

        label: null,
        confidence: null,

        indicators: [],

        message: null,
        threat: null,

        status: null,
        riskLevel: null,
        riskScore: null,

        prediction: null,
        recommendation: null,

        categories: {},
        payload: null,
        payloadType: null
    };

    if (
        value === null ||
        value === undefined
    ) {
        return result;
    }

    /*
     * Gradio may return:
     *
     * [
     *   {
     *      payload: "...",
     *      payload_type: "TEXT",
     *      analysis: {
     *          ...
     *      }
     *   }
     * ]
     */

    let object = value;

    if (Array.isArray(value)) {

        result.indicators =
            flattenStrings(value);

        object =
            value.find(
                item =>
                    item &&
                    typeof item === "object"
            ) || value[0];
    }

    if (
        !object ||
        typeof object !== "object"
    ) {
        result.message =
            String(object);

        result.label =
            String(object);

        return result;
    }

    /*
     * Extract top-level payload information
     */

    if (object.payload !== undefined) {
        result.payload =
            object.payload;
    }

    if (object.payload_type !== undefined) {
        result.payloadType =
            object.payload_type;
    }

    /*
     * IMPORTANT:
     * The actual CyberGuard engine response puts
     * the useful information inside "analysis".
     */

    const analysis =
        object.analysis &&
        typeof object.analysis === "object"
            ? object.analysis
            : object;

    mergeObjectFields(
        result,
        analysis
    );

    /*
     * Also inspect top-level fields in case another
     * endpoint returns them there.
     */

    if (analysis !== object) {
        mergeObjectFields(
            result,
            object
        );
    }

    /*
     * Explicit engine fields
     */

    if (
        analysis.status !== undefined
    ) {
        result.status =
            String(analysis.status);
    }

    if (
        analysis.risk_level !== undefined
    ) {
        result.riskLevel =
            String(analysis.risk_level);
    }

    if (
        analysis.risk_score !== undefined
    ) {
        const score =
            Number(analysis.risk_score);

        if (Number.isFinite(score)) {
            result.riskScore = score;
        }
    }

    if (
        analysis.model_prediction !== undefined
    ) {
        result.prediction =
            String(
                analysis.model_prediction
            );
    }

    if (
        analysis.model_confidence !== undefined
    ) {
        const confidence =
            Number(
                analysis.model_confidence
            );

        if (Number.isFinite(confidence)) {
            result.confidence =
                confidence;
        }
    }

    if (
        analysis.recommendation !== undefined
    ) {
        result.recommendation =
            String(
                analysis.recommendation
            );
    }

    if (
        analysis.detected_categories !== undefined
    ) {
        result.categories =
            analysis.detected_categories;
    }

    /*
     * Better primary label
     */

    if (
        result.prediction
    ) {
        result.label =
            result.prediction;
    }

    /*
     * Better message
     */

    if (
        !result.message &&
        result.status
    ) {
        result.message =
            result.status;
    }

    /*
     * Recommendation should appear as an
     * indicator rather than raw JSON.
     */

    if (
        result.recommendation
    ) {
        result.indicators.push(
            `Recommendation: ${result.recommendation}`
        );
    }

    /*
     * Risk level
     */

    if (
        result.riskLevel
    ) {
        result.indicators.push(
            `Risk Level: ${result.riskLevel}`
        );
    }

    /*
     * Status
     */

    if (
        result.status
    ) {
        result.indicators.push(
            `Status: ${result.status}`
        );
    }

    /*
     * Remove duplicates
     */

    result.indicators = [
        ...new Set(
            result.indicators
                .filter(Boolean)
        )
    ];

    return result;
}


/* ============================================================
   MERGE OBJECT FIELDS
   ============================================================ */

function mergeObjectFields(
    result,
    object
) {

    if (
        !object ||
        typeof object !== "object"
    ) {
        return;
    }


    /* --------------------------------------------------------
       LABEL / CLASSIFICATION
       -------------------------------------------------------- */

    const labelKeys = [
        "label",
        "prediction",
        "predicted_label",
        "class",
        "category",
        "result",
        "status",
        "threat"
    ];

    for (
        const key of labelKeys
    ) {

        if (
            object[key] !== undefined &&
            object[key] !== null &&
            typeof object[key] !== "object"
        ) {

            if (!result.label) {

                result.label =
                    String(
                        object[key]
                    );
            }

            break;
        }
    }


    /* --------------------------------------------------------
       CONFIDENCE
       -------------------------------------------------------- */

    const confidenceKeys = [
        "confidence",
        "score",
        "probability",
        "risk_score",
        "phishing_probability",
        "model_confidence"
    ];

    for (
        const key of confidenceKeys
    ) {

        if (
            object[key] !== undefined &&
            object[key] !== null
        ) {

            const number =
                Number(
                    object[key]
                );

            if (
                Number.isFinite(number)
            ) {

                /*
                 * Don't overwrite an already
                 * meaningful model confidence
                 */

                if (
                    result.confidence === null ||
                    key === "model_confidence"
                ) {
                    result.confidence =
                        number;
                }

                break;
            }
        }
    }


    /* --------------------------------------------------------
       INDICATORS / FINDINGS
       -------------------------------------------------------- */

    const indicatorKeys = [
        "indicators",
        "features",
        "reasons",
        "signals",
        "findings",
        "detections"
    ];

    for (
        const key of indicatorKeys
    ) {

        if (
            object[key] !== undefined &&
            object[key] !== null
        ) {

            result.indicators.push(
                ...flattenStrings(
                    object[key]
                )
            );
        }
    }


    /* --------------------------------------------------------
       MESSAGE / EXPLANATION
       -------------------------------------------------------- */

    const messageKeys = [
        "message",
        "explanation",
        "description",
        "details",
        "analysis"
    ];

    for (
        const key of messageKeys
    ) {

        if (
            typeof object[key] === "string"
        ) {

            if (!result.message) {

                result.message =
                    object[key];
            }

            break;
        }
    }


    /* --------------------------------------------------------
       THREAT
       -------------------------------------------------------- */

    if (
        object.threat !== undefined &&
        object.threat !== null &&
        typeof object.threat !== "object"
    ) {

        result.threat =
            String(
                object.threat
            );
    }

    if (
        !result.threat &&
        result.label
    ) {

        result.threat =
            result.label;
    }
}


/* ============================================================
   DETERMINE RISK
   ============================================================ */

function determineRisk(
    normalized
) {

    /*
     * FIRST:
     * Trust the explicit risk_level returned
     * by the CyberGuard engine.
     */

    if (
        normalized.riskLevel
    ) {

        const risk =
            normalized.riskLevel
                .toLowerCase();

        if (
            risk.includes("critical") ||
            risk.includes("high")
        ) {

            return {
                className: "danger",

                label: "HIGH RISK",

                title:
                    "Potential phishing threat detected",

                description:
                    normalized.message ||
                    "The CyberGuard engine identified indicators associated with a potentially dangerous input."
            };
        }

        if (
            risk.includes("medium") ||
            risk.includes("moderate")
        ) {

            return {
                className: "warning",

                label: "REVIEW",

                title:
                    "Further review recommended",

                description:
                    normalized.message ||
                    "The analysis contains signals that should be reviewed before treating the input as safe."
            };
        }

        if (
            risk.includes("low") ||
            risk.includes("safe")
        ) {

            return {
                className: "safe",

                label: "LOW RISK",

                title:
                    "No immediate threat detected",

                description:
                    normalized.message ||
                    "The CyberGuard engine did not identify strong indicators of an immediate threat."
            };
        }
    }


    /*
     * SECOND:
     * Trust the model prediction.
     */

    if (
        normalized.prediction
    ) {

        const prediction =
            normalized.prediction
                .toLowerCase();

        if (
            prediction.includes("phishing") ||
            prediction.includes("malicious") ||
            prediction.includes("spam") ||
            prediction.includes("danger")
        ) {

            return {
                className: "danger",

                label: "HIGH RISK",

                title:
                    "Potential phishing threat detected",

                description:
                    normalized.message ||
                    "The detection model classified this input as potentially malicious."
            };
        }

        if (
            prediction.includes("benign") ||
            prediction.includes("safe") ||
            prediction.includes("legitimate") ||
            prediction.includes("ham")
        ) {

            return {
                className: "safe",

                label: "LOW RISK",

                title:
                    "No immediate threat detected",

                description:
                    normalized.message ||
                    "The detection model classified this input as benign."
            };
        }
    }


    /*
     * THIRD:
     * Fall back to the existing confidence logic.
     */

    if (
        normalized.confidence !== null
    ) {

        const confidence =
            normalizeConfidence(
                normalized.confidence
            );

        if (
            confidence >= 0.75
        ) {

            return {
                className: "danger",

                label: "HIGH RISK",

                title:
                    "High-confidence detection",

                description:
                    "The detection engine returned a high-confidence threat classification."
            };
        }

        if (
            confidence >= 0.45
        ) {

            return {
                className: "warning",

                label: "REVIEW",

                title:
                    "Further review recommended",

                description:
                    "The result contains signals that should be reviewed before treating the input as safe."
            };
        }

        return {
            className: "safe",

            label: "LOW RISK",

            title:
                "No immediate threat detected",

            description:
                "The detection engine returned a lower-risk classification."
        };
    }


    /*
     * Final fallback
     */

    return {
        className: "warning",

        label: "REVIEW",

        title:
            "Analysis completed",

        description:
            normalized.message ||
            "The engine returned a result. Review the available indicators before making a decision."
    };
}


/* ============================================================
   BUILD USER-FRIENDLY INDICATORS
   ============================================================ */

function buildIndicators(
    normalized
) {

    const indicators = [];


    /*
     * Classification
     */

    if (
        normalized.prediction
    ) {

        indicators.push(
            `Detection: ${normalized.prediction}`
        );

    } else if (
        normalized.label
    ) {

        indicators.push(
            `Classification: ${normalized.label}`
        );
    }


    /*
     * Status
     */

    if (
        normalized.status
    ) {

        indicators.push(
            `Status: ${normalized.status}`
        );
    }


    /*
     * Risk level
     */

    if (
        normalized.riskLevel
    ) {

        indicators.push(
            `Risk Level: ${normalized.riskLevel}`
        );
    }


    /*
     * Confidence
     */

    if (
        normalized.confidence !== null
    ) {

        indicators.push(
            `Detection Confidence: ${formatConfidence(normalized.confidence)}`
        );
    }


    /*
     * Explanation
     */

    if (
        normalized.message &&
        normalized.message !== normalized.status
    ) {

        indicators.push(
            normalized.message
        );
    }


    /*
     * Detected indicators
     */

    normalized.indicators.forEach(
        item => {

            if (
                !item.startsWith("Recommendation:") &&
                !item.startsWith("Risk Level:") &&
                !item.startsWith("Status:")
            ) {

                indicators.push(
                    item
                );
            }
        }
    );


    /*
     * Recommendation
     */

    if (
        normalized.recommendation
    ) {

        indicators.push(
            `Recommended action: ${normalized.recommendation}`
        );
    }


    /*
     * Remove duplicates
     */

    const unique =
        [
            ...new Set(
                indicators
                    .filter(Boolean)
            )
        ];


    /*
     * Don't dump 20 pieces of
     * engine metadata into the UI.
     */

    if (
        unique.length === 0
    ) {

        unique.push(
            "No additional indicators were returned by the detection engine."
        );
    }


    return unique.slice(
        0,
        10
    );
}
