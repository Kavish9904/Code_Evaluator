import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# API Configuration
LLM_API_URL = os.getenv("LLM_API_URL", "https://api.openai.com/v1/chat/completions")
LLM_API_KEY = os.getenv("LLM_API_KEY", "")

# Model Configuration - Single model approach
DEFAULT_MODEL = "gpt-4o-mini"
BACKUP_MODEL = "gpt-4o-mini"  # Same as default for simplicity

# Generation Parameters
TEMPERATURE = float(os.getenv("TEMPERATURE", "0.2"))
MAX_TOKENS = int(os.getenv("MAX_TOKENS", "4000"))
REQUEST_TIMEOUT = int(os.getenv("REQUEST_TIMEOUT", "60"))

# Security Configuration
SECURITY_CHECK_ENABLED = os.getenv("SECURITY_CHECK_ENABLED", "true").lower() == "true"
INJECTION_CHECKS_ENABLED = os.getenv("INJECTION_CHECKS_ENABLED", "true").lower() == "true"
DETECTION_CHECKS_ENABLED = os.getenv("DETECTION_CHECKS_ENABLED", "true").lower() == "true"

# Supported Languages
SUPPORTED_LANGUAGES = [
    "java",
    "python",
    "cpp",
    "javascript",
    "csharp"
]

# Logging configuration
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FILE = os.getenv("LOG_FILE", "llm_evaluator.log")

# Application settings
APP_HOST = os.getenv("APP_HOST", "0.0.0.0")
APP_PORT = int(os.getenv("APP_PORT", "8000"))
DEBUG_MODE = os.getenv("DEBUG_MODE", "false").lower() == "true"