-- Only retained public fields are persisted / Persistem apenas campos públicos retidos.
CREATE TABLE IF NOT EXISTS exports (
    scenario_id TEXT PRIMARY KEY,
    source TEXT NOT NULL CHECK(source IN ('synthetic', 'manual')),
    root_hash TEXT NOT NULL CHECK(length(root_hash) = 64),
    cutoff_ms INTEGER NOT NULL CHECK(cutoff_ms BETWEEN 0 AND 86400000),
    now_ms INTEGER NOT NULL CHECK(now_ms BETWEEN cutoff_ms AND 86400000),
    excluded_count INTEGER NOT NULL CHECK(excluded_count >= 0)
);
CREATE TABLE IF NOT EXISTS events (
    scenario_id TEXT NOT NULL REFERENCES exports(scenario_id),
    sequence INTEGER NOT NULL CHECK(sequence >= 0),
    event_id TEXT NOT NULL,
    at_ms INTEGER NOT NULL CHECK(at_ms BETWEEN 0 AND 86400000),
    session_id TEXT NOT NULL,
    kind TEXT NOT NULL CHECK(kind IN ('session-start', 'session-pause', 'session-stop', 'cue-presented', 'observation')),
    outcome TEXT NOT NULL CHECK(outcome IN ('ok', 'skipped', 'interrupted', 'unknown')),
    previous_hash TEXT NOT NULL CHECK(length(previous_hash) = 64),
    hash TEXT NOT NULL CHECK(length(hash) = 64),
    PRIMARY KEY(scenario_id, sequence),
    UNIQUE(scenario_id, event_id)
);
CREATE VIEW IF NOT EXISTS event_counts AS
SELECT scenario_id, kind, outcome, COUNT(*) AS event_count
FROM events GROUP BY scenario_id, kind, outcome;
