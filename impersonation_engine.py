# ============================================================
# CYBERGUARD
# DIGITAL IMPERSONATION DETECTION ENGINE
# ============================================================

import os
import re

from supabase import create_client


# ============================================================
# 1. SUPABASE CONFIGURATION
# ============================================================

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")


if not SUPABASE_URL or not SUPABASE_KEY:

    raise RuntimeError(
        "SUPABASE_URL and SUPABASE_KEY environment "
        "variables are required."
    )


supabase = create_client(
    SUPABASE_URL,
    SUPABASE_KEY
)


# ============================================================
# 2. FIND TRUSTED IDENTITY
# ============================================================

def find_trusted_identity(
    claimed_identity="",
    sender_email=""
):

    # --------------------------------------------------------
    # SEARCH BY OFFICIAL EMAIL FIRST
    # --------------------------------------------------------

    if sender_email:

        result = (
            supabase
            .table("trusted_identities")
            .select("*")
            .eq(
                "official_email",
                sender_email
            )
            .execute()
        )

        if result.data:

            return result.data[0]


    # --------------------------------------------------------
    # SEARCH BY NAME / IDENTITY
    # --------------------------------------------------------

    if claimed_identity:

        result = (
            supabase
            .table("trusted_identities")
            .select("*")
            .ilike(
                "name",
                f"%{claimed_identity}%"
            )
            .execute()
        )

        if result.data:

            return result.data[0]


    # --------------------------------------------------------
    # NO MATCH
    # --------------------------------------------------------

    return None


# ============================================================
# 3. ANALYZE DIGITAL IMPERSONATION
# ============================================================

def analyze_digital_impersonation(
    claimed_identity,
    sender_email,
    message
):

    # --------------------------------------------------------
    # BASIC CLEANING
    # --------------------------------------------------------

    claimed_identity = (
        claimed_identity or ""
    ).strip()

    sender_email = (
        sender_email or ""
    ).strip()

    message = (
        message or ""
    ).strip()


    # --------------------------------------------------------
    # FIND TRUSTED IDENTITY
    # --------------------------------------------------------

    identity = find_trusted_identity(
        claimed_identity=claimed_identity,
        sender_email=sender_email
    )


    # --------------------------------------------------------
    # INITIAL VALUES
    # --------------------------------------------------------

    score = 0

    indicators = []


    # ========================================================
    # 4. TRUSTED IDENTITY FOUND
    # ========================================================

    if identity:

        official_email = (
            identity.get(
                "official_email"
            ) or ""
        ).lower().strip()

        official_domain = (
            identity.get(
                "official_domain"
            ) or ""
        ).lower().strip()

        supplied_email = (
            sender_email or ""
        ).lower().strip()


        # ====================================================
        # 5. EMAIL COMPARISON
        # ====================================================

        if supplied_email:

            if supplied_email != official_email:

                score += 40

                indicators.append(
                    "Sender email does not match "
                    "the trusted identity"
                )


            # ------------------------------------------------
            # DOMAIN COMPARISON
            # ------------------------------------------------

            if "@" in supplied_email:

                sender_domain = (
                    supplied_email
                    .split("@", 1)[1]
                    .lower()
                )

                if (
                    official_domain
                    and sender_domain
                    != official_domain
                ):

                    score += 30

                    indicators.append(
                        "Sender email domain does not "
                        "match the organization's "
                        "official domain"
                    )


    # ========================================================
    # 6. TRUSTED IDENTITY NOT FOUND
    # ========================================================

    else:

        score += 20

        indicators.append(
            "Claimed identity was not found "
            "in the trusted identity database"
        )


    # ========================================================
    # 7. MESSAGE ANALYSIS
    # ========================================================

    text = message.lower()


    # --------------------------------------------------------
    # URGENCY / PRESSURE
    # --------------------------------------------------------

    urgency_terms = [

        "urgent",
        "immediately",
        "act now",
        "within",
        "expires",
        "suspended",
        "blocked",
        "last warning",
        "account will be closed",
        "account has been suspended"
    ]


    matched_urgency = [

        term
        for term in urgency_terms
        if term in text
    ]


    if matched_urgency:

        score += 15

        indicators.append(
            "Urgency or pressure detected: "
            + ", ".join(
                matched_urgency
            )
        )


    # --------------------------------------------------------
    # CREDENTIAL / SENSITIVE INFORMATION
    # --------------------------------------------------------

    credential_terms = [

        "password",
        "otp",
        "pin",
        "cvv",
        "verification code",
        "one time password",
        "login",
        "credit card",
        "debit card",
        "bank details"
    ]


    matched_credentials = [

        term
        for term in credential_terms
        if term in text
    ]


    if matched_credentials:

        score += 20

        indicators.append(
            "Sensitive credential-related "
            "request detected: "
            + ", ".join(
                matched_credentials
            )
        )


    # --------------------------------------------------------
    # PAYMENT / FINANCIAL REQUEST
    # --------------------------------------------------------

    payment_terms = [

        "pay",
        "payment",
        "transfer",
        "send money",
        "fee",
        "bank account",
        "upi"
    ]


    matched_payment_terms = [

        term
        for term in payment_terms
        if term in text
    ]


    if matched_payment_terms:

        score += 15

        indicators.append(
            "Financial request detected: "
            + ", ".join(
                matched_payment_terms
            )
        )


    # ========================================================
    # 8. FINAL SCORE
    # ========================================================

    score = min(
        score,
        100
    )


    # ========================================================
    # 9. RISK LEVEL
    # ========================================================

    if score >= 75:

        risk_level = "High Risk"

        status = (
            "Potential Digital Impersonation"
        )


    elif score >= 40:

        risk_level = "Medium Risk"

        status = (
            "Suspicious Identity Activity"
        )


    else:

        risk_level = "Low Risk"

        status = (
            "No Immediate Impersonation Indicators"
        )


    # ========================================================
    # 10. RECOMMENDATION
    # ========================================================

    if score >= 75:

        recommendation = (
            "Do not trust the communication or "
            "provide sensitive information. "
            "Verify the person's identity through "
            "an independent official channel."
        )


    elif score >= 40:

        recommendation = (
            "The communication contains identity "
            "or behavioral inconsistencies. "
            "Verify the sender through an official "
            "channel before taking action."
        )


    else:

        recommendation = (
            "No major impersonation indicators "
            "were detected. Continue to verify "
            "unexpected requests independently."
        )


    # ========================================================
    # 11. RETURN CYBERGUARD REPORT
    # ========================================================

    return {

        "status": status,

        "risk_level": risk_level,

        "risk_score": score,

        "claimed_identity":
            claimed_identity,

        "sender_email":
            sender_email,

        "trusted_identity_found":
            bool(identity),

        "trusted_identity":
            identity,

        "detected_indicators":
            indicators,

        "recommendation":
            recommendation
    }
