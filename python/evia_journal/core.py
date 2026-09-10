"""Public event retention and unkeyed digest chain / Retenção e cadeia pública."""

import hashlib
import json
import re

from .contract import unique_ids, validate

GENESIS = "0" * 64
EVENT_FIELDS = ("id", "atMs", "sessionId", "kind", "outcome")
CHAIN_FIELDS = ("sequence", *EVENT_FIELDS, "previousHash")


def digest(record):
    canonical = {field: record[field] for field in CHAIN_FIELDS}
    # JSON has one numeric type. Normalize accepted integral floats for JS parity.
    canonical["sequence"] = int(canonical["sequence"])
    canonical["atMs"] = int(canonical["atMs"])
    data = json.dumps(canonical, ensure_ascii=False, separators=(",", ":"), allow_nan=False)
    return hashlib.sha256(data.encode("utf-8")).hexdigest()


def analyze(scenario):
    s = validate(scenario)
    unique_ids(s["events"])
    if any(event["atMs"] > s["nowMs"] for event in s["events"]):
        raise ValueError("Future event / Evento futuro")
    cutoff = max(0, s["nowMs"] - s["retentionMs"])
    retained = sorted(
        (event for event in s["events"] if event["atMs"] >= cutoff),
        key=lambda event: (event["atMs"], event["id"]),
    )
    records, previous = [], GENESIS
    for sequence, event in enumerate(retained):
        record = {"sequence": sequence, **event, "previousHash": previous}
        record["hash"] = digest(record)
        previous = record["hash"]
        records.append(record)
    return {
        "scenarioId": s["scenarioId"],
        "source": s["source"],
        "records": records,
        "rootHash": previous,
        "cutoffMs": cutoff,
        "nowMs": s["nowMs"],
        "retentionMs": s["retentionMs"],
        "excluded": len(s["events"]) - len(records),
    }


def verify_records(records, expected_root=None):
    """Detect edits against a separately retained root; this does not authenticate origin."""
    try:
        if not isinstance(records, list) or len(records) > 10000:
            raise ValueError("Invalid records")
        if expected_root is not None and (
            not isinstance(expected_root, str)
            or re.fullmatch(r"[a-f0-9]{64}", expected_root) is None
        ):
            raise ValueError("Invalid root")
        events, previous, previous_time = [], GENESIS, -1
        for sequence, record in enumerate(records):
            if not isinstance(record, dict) or set(record) != set(CHAIN_FIELDS) | {"hash"}:
                raise ValueError("Invalid record fields")
            if (
                isinstance(record["sequence"], bool)
                or record["sequence"] != sequence
                or record["atMs"] < previous_time
                or record["previousHash"] != previous
                or record["hash"] != digest(record)
            ):
                raise ValueError("Chain mismatch")
            previous, previous_time = record["hash"], record["atMs"]
            events.append({field: record[field] for field in EVENT_FIELDS})
        analyze(
            {
                "schemaVersion": 1,
                "scenarioId": "verification",
                "source": "manual",
                "nowMs": 86400000,
                "retentionMs": 86400000,
                "events": events,
            }
        )
        if expected_root is not None and expected_root != previous:
            raise ValueError("Root mismatch")
        return {"valid": True, "rootHash": previous, "count": len(records)}
    except (ValueError, TypeError, KeyError, OverflowError):
        return {"valid": False, "code": "INTEGRITY"}
