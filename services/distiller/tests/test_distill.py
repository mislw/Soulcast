import pytest

from app.distill import build_persona_assets
from app.models import NormalizedMessage, ensure_normalized_score


def test_build_persona_assets_extracts_signature_phrases_and_defaults():
    messages = [
        NormalizedMessage(
            messageId="m1",
            userId="p1",
            conversationId="c1",
            senderRole="user",
            timestamp="2026-01-01T10:00:00Z",
            text="慢慢来，问题不大",
            replyTo=None,
            meta={"source": "wechat", "hasEmoji": False},
        ),
        NormalizedMessage(
            messageId="m2",
            userId="p1",
            conversationId="c1",
            senderRole="user",
            timestamp="2026-01-01T10:01:00Z",
            text="先别急，我们一步一步看",
            replyTo=None,
            meta={"source": "wechat", "hasEmoji": False},
        ),
    ]

    assets = build_persona_assets("p1", messages)

    assert "问题不大" in assets["profile"]["signaturePhrases"]
    assert len(assets["memories"]) >= 1
    assert assets["memories"][0]["memoryId"] == "p1-mem-1"
    assert "不伪造实时近况" in assets["policy"]["boundaries"]
    assert "不冒充本人对外发言" in assets["policy"]["boundaries"]


def test_build_persona_assets_only_uses_target_users_messages():
    messages = [
        NormalizedMessage(
            messageId="m1",
            userId="p1",
            conversationId="c1",
            senderRole="user",
            timestamp="2026-01-01T10:00:00Z",
            text="先别急，我们一步一步看",
            replyTo=None,
            meta={"source": "wechat", "hasEmoji": False},
        ),
        NormalizedMessage(
            messageId="m2",
            userId="someone-else",
            conversationId="c1",
            senderRole="user",
            timestamp="2026-01-01T10:01:00Z",
            text="慢慢来，问题不大",
            replyTo=None,
            meta={"source": "wechat", "hasEmoji": False},
        ),
    ]

    assets = build_persona_assets("p1", messages)

    assert "先别急" in assets["profile"]["signaturePhrases"]
    assert "问题不大" not in assets["profile"]["signaturePhrases"]
    assert assets["memories"][0]["evidenceRefs"] == ["m1"]


def test_build_persona_assets_filters_before_sorting_messages():
    messages = [
        NormalizedMessage(
            messageId="m1",
            userId="p1",
            conversationId="c1",
            senderRole="user",
            timestamp="2026-01-01T10:00:00Z",
            text="鎱㈡參鏉ワ紝闂涓嶅ぇ",
            replyTo=None,
            meta={"source": "wechat", "hasEmoji": False},
        ),
        NormalizedMessage(
            messageId="m2",
            userId="someone-else",
            conversationId="c1",
            senderRole="user",
            timestamp="not-a-timestamp",
            text="杩欐潯娑堟伅涓嶅簲褰卞搷 persona",
            replyTo=None,
            meta={"source": "wechat", "hasEmoji": False},
        ),
        NormalizedMessage(
            messageId="m3",
            userId="p1",
            conversationId="c1",
            senderRole="user",
            timestamp="2026-01-01T10:01:00Z",
            text="鍏堝埆鎬ワ紝鎴戜滑涓€姝ヤ竴姝ョ湅",
            replyTo=None,
            meta={"source": "wechat", "hasEmoji": False},
        ),
    ]

    assets = build_persona_assets("p1", messages)

    assert assets["memories"][0]["evidenceRefs"] == ["m1", "m3"]
    assert assets["profile"]["signaturePhrases"]


def test_ensure_normalized_score_rejects_out_of_range_values():
    with pytest.raises(ValueError):
        ensure_normalized_score(1.2)


def test_build_persona_assets_is_stable_for_out_of_order_input():
    ordered_messages = [
        NormalizedMessage(
            messageId="m2",
            userId="p1",
            conversationId="c1",
            senderRole="user",
            timestamp="2026-01-01T10:00:00Z",
            text="先别急，我们一步一步看",
            replyTo=None,
            meta={"source": "wechat", "hasEmoji": False, "channel": "dm"},
        ),
        NormalizedMessage(
            messageId="m1",
            userId="p1",
            conversationId="c1",
            senderRole="user",
            timestamp="2026-01-01T10:00:00Z",
            text="慢慢来，问题不大",
            replyTo=None,
            meta={"source": "wechat", "hasEmoji": True, "channel": "dm"},
        ),
        NormalizedMessage(
            messageId="m3",
            userId="p1",
            conversationId="c1",
            senderRole="user",
            timestamp="2026-01-01T10:02:00Z",
            text="我们继续往下拆",
            replyTo=None,
            meta={"source": "wechat", "hasEmoji": False, "channel": "dm"},
        ),
    ]
    shuffled_messages = [ordered_messages[2], ordered_messages[0], ordered_messages[1]]

    ordered_assets = build_persona_assets("p1", ordered_messages)
    shuffled_assets = build_persona_assets("p1", shuffled_messages)

    assert shuffled_assets == ordered_assets
    assert ordered_assets["profile"]["signaturePhrases"] == ["问题不大", "慢慢来", "先别急"]
    assert ordered_assets["memories"][0]["validFrom"] == "2026-01-01T10:00:00Z"
    assert ordered_assets["memories"][0]["evidenceRefs"] == ["m1", "m2"]


def test_build_persona_assets_sorts_timestamps_with_offsets():
    messages = [
        NormalizedMessage(
            messageId="m3",
            userId="p1",
            conversationId="c1",
            senderRole="user",
            timestamp="2026-01-01T10:10:00+08:00",
            text="我们继续往下拆",
            replyTo=None,
            meta={"source": "wechat", "hasEmoji": False},
        ),
        NormalizedMessage(
            messageId="m2",
            userId="p1",
            conversationId="c1",
            senderRole="user",
            timestamp="2026-01-01T02:05:00Z",
            text="先别急，我们一步一步看",
            replyTo=None,
            meta={"source": "wechat", "hasEmoji": False},
        ),
        NormalizedMessage(
            messageId="m1",
            userId="p1",
            conversationId="c1",
            senderRole="user",
            timestamp="2026-01-01T10:00:00+08:00",
            text="慢慢来，问题不大",
            replyTo=None,
            meta={"source": "wechat", "hasEmoji": False},
        ),
    ]

    assets = build_persona_assets("p1", messages)

    assert assets["memories"][0]["validFrom"] == "2026-01-01T10:00:00+08:00"
    assert assets["memories"][0]["evidenceRefs"] == ["m1", "m2"]


def test_build_persona_assets_sorts_mixed_naive_and_aware_timestamps():
    messages = [
        NormalizedMessage(
            messageId="m2",
            userId="p1",
            conversationId="c1",
            senderRole="user",
            timestamp="2026-01-01T10:01:00Z",
            text="鍏堝埆鎬ワ紝鎴戜滑涓€姝ヤ竴姝ョ湅",
            replyTo=None,
            meta={"source": "wechat", "hasEmoji": False},
        ),
        NormalizedMessage(
            messageId="m1",
            userId="p1",
            conversationId="c1",
            senderRole="user",
            timestamp="2026-01-01T10:00:00",
            text="鎱㈡參鏉ワ紝闂涓嶅ぇ",
            replyTo=None,
            meta={"source": "wechat", "hasEmoji": False},
        ),
    ]

    assets = build_persona_assets("p1", messages)

    assert assets["memories"][0]["validFrom"] == "2026-01-01T10:00:00"
    assert assets["memories"][0]["evidenceRefs"] == ["m1", "m2"]


def test_build_persona_assets_copies_profile_boundaries():
    assets = build_persona_assets(
        "p1",
        [
            NormalizedMessage(
                messageId="m1",
                userId="p1",
                conversationId="c1",
                senderRole="user",
                timestamp="2026-01-01T10:00:00Z",
                text="慢慢来，问题不大",
                replyTo=None,
                meta={"source": "wechat", "hasEmoji": False},
            )
        ],
    )

    assert assets["profile"]["boundaries"] == assets["policy"]["boundaries"]
    assert assets["profile"]["boundaries"] is not assets["policy"]["boundaries"]
