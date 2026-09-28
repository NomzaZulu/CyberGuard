# ============================================================
# CYBERGUARD - DIGITAL IMPERSONATION DETECTION
# ============================================================

import os
import re

from supabase import create_client


# ============================================================
# SUPABASE CONNECTION
# ============================================================

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = None

if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(
        SUPABASE_URL,
        SUPABASE_KEY
    )


# ============================================================
# BASIC TEXT ANALYSIS
# ============================================================

def detect_impersonation_indicators(message):

    text = message.lower()

    indicators = []

    urgency_terms = [
        "urgent",
        "immediately",
        "act now",
        "within",
        "as soon as possible",
        "last warning",
        "account will be blocked",
        "account will be suspended"
    ]

    credential_terms = [
        "password",
        "otp",
        "one time password",
        "pin",
        "cvv",
        "verification code",
        "login details",
        "bank details",
        "card details"
    ]

    financial_terms = [
        "send money",
        "transfer money",
        "payment",
        "pay",
        "fee",
        "refund",
        "bank account",
        "upi"
    ]

    authority_terms = [
        "principal",
        "director",
        "professor",
        "teacher",
        "manager",
        "ceo",
        "government officer",
        "official",
        "bank manager",
        "administrator"
    ]

    for term in urgency_terms:

        if term in text:

            indicators.append(
                f"Urgency or pressure detected: {term}"
            )

    for term in credential_terms:

        if term in text:

            indicators.append(
                f"Sensitive-information request: {term}"
            )

    for term in financial_terms:

        if term in text:

            indicators.append(
                f"Financial-related request: {term}"
            )

    for term in authority_terms:

        if term in text:

            indicators.append(
                f"Authority-related language: {term}"
            )

    return indicators


# ============================================================
# COMMUNICATION STYLE ANALYSIS
# ============================================================

def analyze_communication_style(message):

    text = message.lower()

    score = 0
    indicators = []

    urgency_words = [
        "urgent",
        "immediately",
        "act now",
        "hurry",
        "last warning"
    ]

    credential_words = [
        "otp",
        "password",
        "pin",
        "cvv",
        "verification code"
    ]

    financial_words = [
        "payment",
        "send money",
        "transfer",
        "fee",
        "refund"
    ]

    urgency_matches = [
        word for word in urgency_words
        if word in text
    ]

    credential_matches = [
        word for word in credential_words
        if word in text
    ]

    financial_matches = [
        word for word in financial_words
        if word in text
    ]

    if urgency_matches:

        score += 20

        indicators.append(
            "Pressure or urgency in communication"
        )

    if credential_matches:

        score += 30

        indicators.append(
            "Request for sensitive credentials"
        )

    if financial_matches:

        score += 25

        indicators.append(
            "Financial request detected"
        )

    if text.count("!") >= 3:

        score += 5

        indicators.append(
            "Excessive use of exclamation marks"
        )

    if len(message) < 25:

        score += 5

        indicators.append(
            "Very short communication"
        )

    return {
        "score": min(score, 100),
        "indicators": indicators
    }


# ============================================================
# EMAIL / DOMAIN ANALYSIS
# ============================================================

def analyze_sender(sender_email):

    if not sender_email:

        return {
            "valid": False,
            "domain": "",
            "local_part": "",
        }

    sender_email = sender_email.strip().lower()

    match = re.match(
        r"^([^@\s]+)@([^@\s]+\.[^@\s]+)$",
        sender_email
    )

    if not match:

        return {
            "valid": False,
            "domain": "",
            "local_part": "",
        }

    return {
        "valid": True,
        "domain": match.group(2),
        "local_part": match.group(1)
    }


# ============================================================
# TRUSTED IDENTITY LOOKUP
# ============================================================

def find_trusted_identity(
    claimed_identity,
    sender_email=None
):

    if supabase is None:

        return {
            "found": False,
            "error": "Supabase is not configured"
        }

    query = supabase \
        .table("trusted_identities") \
        .select("*")

    if claimed_identity:

        query = query.ilike(
            "organization",
            f"%{claimed_identity}%"
        )

    result = query.execute()

    records = result.data or []

    sender_info = analyze_sender(
        sender_email
    )

    # --------------------------------------------------------
    # Try exact domain match first
    # --------------------------------------------------------

    if sender_info["valid"]:

        sender_domain = sender_info["domain"]

        for record in records:

            official_domain = (
                record.get("official_domain")
                or ""
            ).lower().strip()

            if official_domain == sender_domain:

                return {
                    "found": True,
                    "match_type": "domain",
                    "record": record
                }

    # --------------------------------------------------------
    # Try exact official email match
    # --------------------------------------------------------

    if sender_email:

        normalized_email = (
            sender_email.strip().lower()
        )

        for record in records:

            official_email = (
                record.get("official_email")
                or ""
            ).lower().strip()

            if official_email == normalized_email:

                return {
                    "found": True,
                    "match_type": "email",
                    "record": record
                }

    # --------------------------------------------------------
    # Identity exists but sender did not match
    # --------------------------------------------------------

    if records:

        return {
            "found": True,
            "match_type": "identity_only",
            "record": records[0]
        }

    return {
        "found": False,
        "match_type": "none",
        "record": None
    }


# ============================================================
# RISK CALCULATION
# ============================================================

def calculate_impersonation_risk(
    identity_result,
    communication_result,
    sender_email
):

    score = 0
    reasons = []

    # --------------------------------------------------------
    # Identity verification
    # --------------------------------------------------------

    if not identity_result.get("found"):

        score += 25

        reasons.append(
            "Claimed identity could not be verified"
        )

    else:

        match_type = identity_result.get(
            "match_type"
        )

        if match_type == "domain":

            reasons.append(
                "Sender domain matches trusted identity"
            )

        elif match_type == "email":

            reasons.append(
                "Sender email matches trusted identity"
            )

        elif match_type == "identity_only":

            score += 30

            reasons.append(
                "Claimed identity exists but sender "
                "could not be matched to the trusted identity"
            )

    # --------------------------------------------------------
    # Invalid sender
    # --------------------------------------------------------

    sender_info = analyze_sender(
        sender_email
    )

    if sender_email and not sender_info["valid"]:

        score += 20

        reasons.append(
            "Sender email format is invalid"
        )

    # --------------------------------------------------------
    # Communication style
    # --------------------------------------------------------

    communication_score = communication_result[
        "score"
    ]

    score += communication_score

    reasons.extend(
        communication_result["indicators"]
    )

    score = min(score, 100)

    # --------------------------------------------------------
    # Risk level
    # --------------------------------------------------------

    if score >= 75:

        risk_level = "High Risk"

    elif score >= 30:

        risk_level = "Medium Risk"

    else:

        risk_level = "Low Risk"

    return score, risk_level, reasons


# ============================================================
# MAIN IMPERSONATION ANALYZER
# ============================================================

def analyze_digital_impersonation(
    claimed_identity,
    sender_email,
    message
):

    identity_result = find_trusted_identity(
        claimed_identity,
        sender_email
    )

    communication_result = (
        analyze_communication_style(
            message
        )
    )

    general_indicators = (
        detect_impersonation_indicators(
            message
        )
    )

    score, risk_level, reasons = (
        calculate_impersonation_risk(
            identity_result,
            communication_result,
            sender_email
        )
    )

    # Remove duplicates
    all_indicators = []

    for indicator in (
        general_indicators + reasons
    ):

        if indicator not in all_indicators:

            all_indicators.append(indicator)

    # --------------------------------------------------------
    # Status
    # --------------------------------------------------------

    if score >= 75:

        status = (
            "Potential Digital Impersonation Detected"
        )

    elif score >= 30:

        status = (
            "Suspicious Identity Communication"
        )

    else:

        status = (
            "No Immediate Impersonation Threat Detected"
        )

    # --------------------------------------------------------
    # Recommendation
    # --------------------------------------------------------

    if score >= 75:

        recommendation = (
            "Do not trust the communication based solely "
            "on the claimed identity. Verify the sender "
            "through an independent official channel "
            "before taking any action."
        )

    elif score >= 30:

        recommendation = (
            "The communication contains characteristics "
            "associated with possible impersonation. "
            "Verify the sender independently before "
            "sharing information or making payments."
        )

    else:

        recommendation = (
            "No major impersonation indicators were "
            "detected. Continue to verify unexpected "
            "communications through trusted channels."
        )

    return {

        "claimed_identity":
            claimed_identity,

        "sender_email":
            sender_email,

        "status":
            status,

        "risk_level":
            risk_level,

        "risk_score":
            score,

        "identity_verification": {

            "verified":
                identity_result.get(
                    "found",
                    False
                ),

            "match_type":
                identity_result.get(
                    "match_type",
                    "none"
                ),

            "trusted_identity":
                identity_result.get(
                    "record"
                )
        },

        "communication_analysis":
            communication_result,

        "detected_indicators":
            all_indicators,

        "recommendation":
            recommendation
    }
