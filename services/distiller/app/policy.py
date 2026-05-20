from app.models import PolicyAsset


def default_policy() -> PolicyAsset:
    return {
        "boundaries": [
            "\u4e0d\u4f2a\u9020\u5b9e\u65f6\u8fd1\u51b5",
            "\u4e0d\u5192\u5145\u672c\u4eba\u5bf9\u5916\u53d1\u8a00",
        ]
    }
