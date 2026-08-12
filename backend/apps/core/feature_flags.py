import os
from typing import Dict


class FeatureFlagEngine:
    """Dynamic Feature Flag Engine to enable/disable modules without redeploying code."""

    DEFAULTS: Dict[str, bool] = {
        'FEATURE_AI_ASSISTANT': True,
        'FEATURE_PAYMENTS': True,
        'FEATURE_VOICE_CALLS': True,
        'FEATURE_VIDEO_CALLS': True,
        'FEATURE_OCR': True,
        'FEATURE_RECOMMENDATIONS': True,
        'FEATURE_PUBLIC_API': True,
        'FEATURE_SMS_WHATSAPP': False,
    }

    @classmethod
    def is_enabled(cls, flag_name: str) -> bool:
        """Checks if a feature flag is enabled via Environment override or default."""
        env_val = os.environ.get(flag_name)
        if env_val is not None:
            return env_val.lower() in ('true', '1', 'yes')
        return cls.DEFAULTS.get(flag_name, False)

    @classmethod
    def get_all_flags(cls) -> Dict[str, bool]:
        """Returns map of all active feature flag states."""
        return {flag: cls.is_enabled(flag) for flag in cls.DEFAULTS}
