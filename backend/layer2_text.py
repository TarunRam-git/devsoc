"""
LAYER 2: Basic Text Processing (Local)
- spaCy NER for financial entities (amounts, dates, orgs, persons)
- PII detection using Microsoft Presidio (ML + rules based) + Custom Recognizers
- Profanity / prohibited phrase detection
- Obligation keyword extraction
"""

import re
import spacy
from pathlib import Path

# Microsoft Presidio for PII detection
from presidio_analyzer import AnalyzerEngine, RecognizerRegistry, Pattern, PatternRecognizer
from presidio_analyzer.nlp_engine import NlpEngineProvider

# Load spaCy model
nlp = spacy.load("en_core_web_sm")

# ---------------------------------------------------------------------------
# CUSTOM RECOGNIZERS FOR SENSITIVE DATA
# ---------------------------------------------------------------------------

# 1. Remote Access Code Recognizer (AnyDesk, TeamViewer, etc.)
#    Patterns: 1-1-0-9-1-8-5-8-5-9 or 1037498400 (9-10 digit codes)
remote_access_patterns = [
    Pattern(
        name="remote_access_dashed",
        regex=r"\b\d(?:[-.\s]\d){8,11}\b",  # 9-12 single digits with separators
        score=0.9,
    ),
    Pattern(
        name="remote_access_continuous", 
        regex=r"\b\d{9,12}\b",  # 9-12 continuous digits
        score=0.7,
    ),
]
remote_access_recognizer = PatternRecognizer(
    supported_entity="REMOTE_ACCESS_CODE",
    patterns=remote_access_patterns,
    name="RemoteAccessRecognizer",
    supported_language="en",
)

# 2. Sensitive Numeric Sequence Recognizer
#    Catches any sequence that looks like an ID, code, or account number
sensitive_number_patterns = [
    Pattern(
        name="numeric_sequence_6_plus",
        regex=r"\b\d{6,}\b",  # 6+ continuous digits
        score=0.5,
    ),
    Pattern(
        name="formatted_numeric_code",
        regex=r"\b\d{2,4}[-.\s]\d{2,4}[-.\s]\d{2,4}(?:[-.\s]\d{2,4})?\b",  # xx-xx-xx or xxxx-xxxx-xxxx
        score=0.6,
    ),
]
sensitive_number_recognizer = PatternRecognizer(
    supported_entity="SENSITIVE_NUMBER",
    patterns=sensitive_number_patterns,
    name="SensitiveNumberRecognizer", 
    supported_language="en",
)

# 3. Extended Phone Recognizer (international formats)
phone_patterns = [
    Pattern(
        name="phone_intl",
        regex=r"\+?\d{1,3}[-.\s]?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}",
        score=0.85,
    ),
    Pattern(
        name="phone_spoken",
        regex=r"\b(?:call|phone|mobile|cell|contact)(?:\s+(?:me|us|at))?\s*:?\s*\+?\d[\d\s.-]{8,15}\b",
        score=0.9,
    ),
]
phone_recognizer = PatternRecognizer(
    supported_entity="PHONE_NUMBER_EXTENDED",
    patterns=phone_patterns,
    name="ExtendedPhoneRecognizer",
    supported_language="en",
)

# 4. Aadhaar and Indian PAN Recognizer
india_id_patterns = [
    Pattern(
        name="aadhaar",
        regex=r"\b\d{4}[-.\s]?\d{4}[-.\s]?\d{4}\b",  # 12 digits in 4-4-4 format
        score=0.85,
    ),
    Pattern(
        name="pan_card",
        regex=r"\b[A-Z]{5}\d{4}[A-Z]\b",  # Indian PAN format
        score=0.95,
    ),
]
india_id_recognizer = PatternRecognizer(
    supported_entity="INDIA_ID",
    patterns=india_id_patterns,
    name="IndiaIDRecognizer",
    supported_language="en",
)

# ---------------------------------------------------------------------------
# PRESIDIO ANALYZER SETUP WITH CUSTOM RECOGNIZERS
# ---------------------------------------------------------------------------
# Create NLP engine configuration for Presidio
configuration = {
    "nlp_engine_name": "spacy",
    "models": [{"lang_code": "en", "model_name": "en_core_web_sm"}],
}

# Create NLP engine provider
provider = NlpEngineProvider(nlp_configuration=configuration)
nlp_engine = provider.create_engine()

# Create registry and add custom recognizers
registry = RecognizerRegistry()
registry.load_predefined_recognizers(nlp_engine=nlp_engine)
registry.add_recognizer(remote_access_recognizer)
registry.add_recognizer(sensitive_number_recognizer)
registry.add_recognizer(phone_recognizer)
registry.add_recognizer(india_id_recognizer)

# Create analyzer with the NLP engine and custom registry
analyzer = AnalyzerEngine(
    nlp_engine=nlp_engine, 
    supported_languages=["en"],
    registry=registry,
)

# Entity types to detect with Presidio (built-in + custom)
PRESIDIO_ENTITIES = [
    # Built-in entities
    "PERSON",           # Names
    "EMAIL_ADDRESS",    # Emails
    "PHONE_NUMBER",     # Phone numbers
    "US_SSN",           # Social Security Numbers
    "CREDIT_CARD",      # Credit card numbers
    "US_BANK_NUMBER",   # Bank account numbers
    "IP_ADDRESS",       # IP addresses
    "DATE_TIME",        # Dates and times
    "LOCATION",         # Addresses and locations
    "US_DRIVER_LICENSE", # Driver's license
    "US_PASSPORT",      # Passport numbers
    "IBAN_CODE",        # International Bank Account Numbers
    "NRP",              # Nationality, religious or political group
    "MEDICAL_LICENSE",  # Medical license numbers
    "URL",              # URLs
    # Custom entities
    "REMOTE_ACCESS_CODE",    # AnyDesk, TeamViewer codes
    "SENSITIVE_NUMBER",      # Any suspicious numeric sequence
    "PHONE_NUMBER_EXTENDED", # International phone formats
    "INDIA_ID",              # Aadhaar, PAN
]

# ---------------------------------------------------------------------------
# PII PATTERNS (Legacy Regex - kept for comparison)
# ---------------------------------------------------------------------------
PII_PATTERNS = {
    # English / International
    "phone": re.compile(
        r"\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b"
    ),
    "email": re.compile(
        r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"
    ),
    "ssn": re.compile(
        r"\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b"
    ),
    "credit_card": re.compile(
        r"\b(?:\d{4}[-.\s]?){3}\d{4}\b"
    ),
    "aadhaar": re.compile(
        r"\b\d{4}[-.\s]?\d{4}[-.\s]?\d{4}\b"
    ),
    "pan": re.compile(
        r"\b[A-Z]{5}\d{4}[A-Z]\b"
    ),
    "account_number": re.compile(
        r"\b(?:a/?c|account)\s*(?:no\.?|number|#)?\s*:?\s*\d{9,18}\b", re.IGNORECASE
    ),
    # Russian
    "phone_ru": re.compile(
        r"\+?7[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{2}[-.\s]?\d{2}"
    ),
    "passport_ru": re.compile(
        r"\b\d{4}\s?\d{6}\b"
    ),
    "inn_ru": re.compile(
        r"\b\d{10}(?:\d{2})?\b"
    ),
    "snils_ru": re.compile(
        r"\b\d{3}[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{2}\b"
    ),
}

# ---------------------------------------------------------------------------
# FINANCIAL ENTITY PATTERNS
# ---------------------------------------------------------------------------
FINANCIAL_PATTERNS = {
    "currency_amount": re.compile(
        r"(?:(?:Rs\.?|INR|USD|\$|€|£|₹)\s*\d[\d,]*(?:\.\d{1,2})?)"
        r"|(?:\d[\d,]*(?:\.\d{1,2})?\s*(?:rupees|dollars|euros|pounds|lakhs?|crores?|thousand|hundred))",
        re.IGNORECASE,
    ),
    "currency_rub": re.compile(
        r"(?:\d[\d\s,]*(?:[.,]\d{1,2})?\s*(?:рублей|руб\.?|₽))"
        r"|(?:\d[\d\s,]*(?:[.,]\d{1,2})?\s*(?:тысяч|миллион(?:ов|а)?|млн)\s*(?:рублей|долларов|евро)?)"
        r"|(?:\d[\d\s,]*(?:[.,]\d{1,2})?\s*(?:долларов|евро))",
        re.IGNORECASE,
    ),
    "percentage": re.compile(
        r"\b\d+(?:[.,]\d+)?\s*(?:%|percent|per\s*cent|процент(?:ов|а)?)\b", re.IGNORECASE
    ),
    "date_reference": re.compile(
        r"\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4})"
        r"|(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s*\d{2,4})"
        r"|(?:\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})"
        r"|(?:\d{1,2}\s+(?:января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s*\d{2,4}?)",
        re.IGNORECASE,
    ),
    "loan_term": re.compile(
        r"\b\d+\s*(?:months?|years?|days?|EMI|installments?|месяц(?:ев|а)?|лет|год(?:а|ов)?|дней|дня)\b",
        re.IGNORECASE,
    ),
}

# ---------------------------------------------------------------------------
# PROFANITY / PROHIBITED PHRASES
# ---------------------------------------------------------------------------
PROFANITY_WORDS = {
    "damn", "hell", "shit", "fuck", "bastard", "ass", "crap",
    "idiot", "stupid", "dumb", "moron", "shut up",
}

PROHIBITED_PHRASES = [
    "we will take legal action immediately",
    "your credit score will be ruined",
    "we'll seize your assets",
    "you must decide right now",
    "this is your last chance",
    "don't tell anyone about this offer",
    "zero fees",
    "guaranteed approval",
    "risk-free investment",
]

# ---------------------------------------------------------------------------
# OBLIGATION KEYWORDS
# ---------------------------------------------------------------------------
OBLIGATION_KEYWORDS = [
    # English
    "must", "shall", "required", "mandatory", "obligated",
    "need to", "have to", "should", "will be charged",
    "agree to", "consent", "acknowledge", "confirm",
    "i promise", "we guarantee", "committed to",
    "by signing", "terms and conditions", "cooling off",
    "within 30 days", "penalty", "fee", "interest rate",
    # Russian
    "должен", "обязан", "необходимо", "обещаю", "гарантирую",
    "подтверждаю", "согласен", "обязательно", "штраф", "комиссия",
    "процент", "условия", "договор", "контракт",
    "в течение", "обязуюсь", "ответственность",
    # Hindi
    "ज़रूरी", "अनिवार्य", "वादा", "सहमत", "शर्तें",
]


def detect_pii_regex(text: str) -> list[dict]:
    """LEGACY: Detect PII entities using regex patterns (kept for comparison)."""
    findings = []
    for pii_type, pattern in PII_PATTERNS.items():
        for match in pattern.finditer(text):
            findings.append({
                "type": pii_type,
                "value": match.group(),
                "start": match.start(),
                "end": match.end(),
                "risk": "high",
                "method": "regex",
            })
    return findings


# ---------------------------------------------------------------------------
# PII FILTERING AND CORRECTIONS
# ---------------------------------------------------------------------------

# Deny list: Common words/brands that are NOT PII
# These get incorrectly flagged as PERSON or LOCATION
DENY_LIST = {
    # Applications & Software
    "anydesk", "teamviewer", "zoom", "skype", "whatsapp", "telegram",
    "chrome", "firefox", "safari", "edge", "opera",
    "windows", "macos", "linux", "ubuntu",
    # Phone/Device brands (not person names)
    "pixel", "iphone", "samsung", "motorola", "oneplus", "xiaomi",
    "huawei", "nokia", "sony", "lg", "oppo", "vivo", "realme",
    "android", "ios",
    # Tech/Financial terms
    "google", "apple", "microsoft", "amazon", "facebook", "meta",
    "paypal", "venmo", "cashapp", "cash app", "zelle",
    "bitcoin", "ethereum", "crypto",
    # Common false positives
    "support", "help", "hello", "ok", "okay", "yes", "no",
    "vpn", "qr", "wifi", "usb", "sim",
}

# Names that are commonly misclassified as LOCATION but are actually PERSON
PERSON_NOT_LOCATION = {
    "maryam", "stephen", "michael", "omar", "adam", "sarah", "john",
    "david", "james", "robert", "william", "joseph", "charles",
    "mary", "patricia", "jennifer", "linda", "elizabeth", "susan",
    "ali", "ahmed", "mohammed", "fatima", "ayesha", "hassan",
    "raj", "priya", "amit", "sunita", "vikram", "anita",
}

# Entity type corrections based on context keywords
CONTEXT_CORRECTIONS = {
    # If these words appear near the entity, reclassify
    "speaking to": "PERSON",
    "my name is": "PERSON", 
    "name is": "PERSON",
    "this is": "PERSON",
    "manager is": "PERSON",
    "colleague": "PERSON",
    "daughter": "PERSON",
    "son": "PERSON",
    "mr.": "PERSON",
    "mrs.": "PERSON",
    "ms.": "PERSON",
    "dr.": "PERSON",
}


def _should_filter_entity(value: str, entity_type: str) -> bool:
    """Check if an entity should be filtered out (false positive)."""
    value_lower = value.lower().strip()
    
    # Filter out deny-listed items
    if value_lower in DENY_LIST:
        return True
    
    # Filter very short values (likely false positives)
    if len(value_lower) < 2:
        return True
    
    # Filter single digits or simple numbers for PERSON/LOCATION
    if entity_type in ("PERSON", "LOCATION") and value_lower.isdigit():
        return True
    
    return False


def _correct_entity_type(value: str, entity_type: str, text: str, start: int) -> str:
    """Correct entity type based on the value and surrounding context."""
    value_lower = value.lower().strip()
    
    # Fix LOCATION -> PERSON for known names
    if entity_type == "LOCATION" and value_lower in PERSON_NOT_LOCATION:
        return "PERSON"
    
    # Check surrounding context for type corrections
    # Look at 50 characters before the entity
    context_start = max(0, start - 50)
    context = text[context_start:start].lower()
    
    for keyword, correct_type in CONTEXT_CORRECTIONS.items():
        if keyword in context:
            return correct_type
    
    return entity_type


def _calculate_confidence(result, text: str) -> float:
    """
    Calculate a more nuanced confidence score based on multiple factors.
    Presidio often returns 0.85 as a default, so we adjust based on context.
    """
    base_score = result.score
    value = text[result.start:result.end].lower()
    entity_type = result.entity_type
    
    # Boost confidence for exact pattern matches (custom recognizers)
    if entity_type in ("REMOTE_ACCESS_CODE", "INDIA_ID", "CREDIT_CARD", "US_SSN"):
        return min(0.95, base_score + 0.1)
    
    # Boost for longer, more specific values
    if len(value) > 10:
        base_score = min(0.95, base_score + 0.05)
    
    # Reduce confidence for very short values
    if len(value) < 4:
        base_score = max(0.4, base_score - 0.15)
    
    # Reduce confidence for common words that might be names
    common_words = {"one", "two", "three", "four", "five", "the", "and", "for"}
    if value in common_words:
        base_score = max(0.3, base_score - 0.3)
    
    # Check if value appears multiple times with same classification (more confident)
    # This is already handled by deduplication
    
    return round(base_score, 3)


def detect_pii(text: str, score_threshold: float = 0.5) -> list[dict]:
    """
    Detect PII entities using Microsoft Presidio with post-processing.
    
    Improvements over basic Presidio:
    - Filters out known non-PII (apps, brands, common words)
    - Corrects misclassified entity types (LOCATION → PERSON for names)
    - Context-aware type corrections
    - Deduplication of overlapping entities
    - Adjusted confidence scoring
    
    Args:
        text: The text to analyze
        score_threshold: Minimum confidence score (0.0 to 1.0)
    
    Returns:
        List of detected PII entities with type, value, position, and confidence
    """
    findings = []
    
    try:
        # Analyze text with Presidio
        results = analyzer.analyze(
            text=text,
            entities=PRESIDIO_ENTITIES,
            language="en",
            score_threshold=score_threshold,
        )
        
        # Post-process results
        seen_positions = set()  # For deduplication
        
        for result in results:
            value = text[result.start:result.end]
            entity_type = result.entity_type
            
            # Skip if this position was already processed (overlapping entities)
            pos_key = (result.start, result.end)
            if pos_key in seen_positions:
                continue
            seen_positions.add(pos_key)
            
            # Filter out false positives
            if _should_filter_entity(value, entity_type):
                continue
            
            # Correct entity type if needed
            corrected_type = _correct_entity_type(value, entity_type, text, result.start)
            
            # Calculate adjusted confidence
            confidence = _calculate_confidence(result, text)
            
            # Skip if below threshold after adjustment
            if confidence < score_threshold:
                continue
            
            findings.append({
                "type": corrected_type,
                "value": value,
                "start": result.start,
                "end": result.end,
                "confidence": confidence,
                "risk": "high" if confidence >= 0.8 else "medium" if confidence >= 0.5 else "low",
                "method": "presidio",
            })
            
    except Exception as e:
        # Fallback to regex if Presidio fails
        print(f"Presidio error, falling back to regex: {e}")
        return detect_pii_regex(text)
    
    # Sort by position
    findings.sort(key=lambda x: x["start"])
    
    return findings


def extract_financial_entities(text: str) -> list[dict]:
    """Extract financial entities (amounts, dates, percentages, loan terms)."""
    entities = []
    for ent_type, pattern in FINANCIAL_PATTERNS.items():
        for match in pattern.finditer(text):
            entities.append({
                "type": ent_type,
                "value": match.group(),
                "start": match.start(),
                "end": match.end(),
            })
    return entities


def extract_spacy_entities(text: str) -> list[dict]:
    """Extract named entities using spaCy NER."""
    doc = nlp(text)
    return [
        {
            "text": ent.text,
            "label": ent.label_,
            "start": ent.start_char,
            "end": ent.end_char,
        }
        for ent in doc.ents
        if ent.label_ in {"PERSON", "ORG", "GPE", "MONEY", "DATE", "CARDINAL", "PERCENT"}
    ]


def detect_profanity(text: str) -> list[dict]:
    """Detect profanity and prohibited phrases."""
    findings = []
    text_lower = text.lower()

    # Check prohibited phrases
    for phrase in PROHIBITED_PHRASES:
        idx = text_lower.find(phrase)
        if idx != -1:
            findings.append({
                "type": "prohibited_phrase",
                "value": phrase,
                "start": idx,
                "severity": "high",
            })

    # Check profanity words
    words = re.findall(r"\b\w+\b", text_lower)
    for word in words:
        if word in PROFANITY_WORDS:
            findings.append({
                "type": "profanity",
                "value": word,
                "severity": "medium",
            })

    return findings


def extract_obligations(text: str) -> list[dict]:
    """Extract sentences containing obligation keywords (word-boundary matching)."""
    doc = nlp(text)
    obligations = []

    for sent in doc.sents:
        sent_lower = sent.text.lower()
        matched_keywords = []
        for kw in OBLIGATION_KEYWORDS:
            # Use word-boundary regex to avoid substring matches
            # e.g. prevent "продолжение" from matching "должен"
            pattern = r'(?<!\w)' + re.escape(kw) + r'(?!\w)'
            if re.search(pattern, sent_lower):
                matched_keywords.append(kw)
        if matched_keywords:
            obligations.append({
                "sentence": sent.text.strip(),
                "keywords": matched_keywords,
                "start": sent.start_char,
                "end": sent.end_char,
            })

    return obligations


def load_policy_rules(policy_dir: str = "../data/policies") -> dict:
    """Load policy documents for reference."""
    rules = {}
    policy_path = Path(policy_dir)
    if policy_path.exists():
        for f in policy_path.iterdir():
            if f.suffix in (".txt", ".ttx"):
                rules[f.stem] = f.read_text(encoding="utf-8", errors="ignore")
    return rules


def run_layer2(transcript: str, language: str = "en") -> dict:
    """Run complete Layer 2 pipeline on transcript text."""
    pii = detect_pii(transcript)
    financial_entities = extract_financial_entities(transcript)
    # spaCy NER — only run on English (en_core_web_sm)
    if language.lower().startswith("en"):
        spacy_entities = extract_spacy_entities(transcript)
    else:
        spacy_entities = []  # spaCy en model not applicable for non-English
    profanity = detect_profanity(transcript)
    obligations = extract_obligations(transcript)

    # Risk summary
    risk_level = "low"
    if len(pii) > 0:
        risk_level = "medium"
    if any(p["severity"] == "high" for p in profanity) or len(pii) > 3:
        risk_level = "high"

    return {
        "layer": "text_processing",
        "pii_detected": pii,
        "pii_count": len(pii),
        "financial_entities": financial_entities,
        "named_entities": spacy_entities,
        "profanity_findings": profanity,
        "obligation_sentences": obligations,
        "risk_level": risk_level,
    }
