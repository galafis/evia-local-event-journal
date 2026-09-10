"""Store retention-limited exports only / Armazena somente exportações com retenção."""

import sqlite3
from importlib.resources import files

from .core import analyze, verify_records


def connect(path):
    connection = sqlite3.connect(path)
    connection.execute("PRAGMA foreign_keys = ON")
    connection.executescript(
        files(__package__).joinpath("sql/schema.sql").read_text(encoding="utf-8")
    )
    return connection


def store_analysis(connection, scenario):
    result = analyze(scenario)
    with connection:
        connection.execute(
            "INSERT INTO exports VALUES (?, ?, ?, ?, ?, ?)",
            (
                scenario["scenarioId"],
                scenario["source"],
                result["rootHash"],
                result["cutoffMs"],
                result["nowMs"],
                result["excluded"],
            ),
        )
        connection.executemany(
            "INSERT INTO events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                (
                    scenario["scenarioId"],
                    row["sequence"],
                    row["id"],
                    row["atMs"],
                    row["sessionId"],
                    row["kind"],
                    row["outcome"],
                    row["previousHash"],
                    row["hash"],
                )
                for row in result["records"]
            ],
        )
    return result


def verify_export(connection, scenario_id, expected_root):
    """The trusted root must be supplied by the caller, outside this mutable archive."""
    if (
        connection.execute("SELECT 1 FROM exports WHERE scenario_id = ?", (scenario_id,)).fetchone()
        is None
    ):
        raise ValueError("Unknown export / Exportação desconhecida")
    columns = ("sequence", "id", "atMs", "sessionId", "kind", "outcome", "previousHash", "hash")
    rows = connection.execute(
        "SELECT sequence, event_id, at_ms, session_id, kind, outcome, previous_hash, hash "
        "FROM events WHERE scenario_id = ? ORDER BY sequence",
        (scenario_id,),
    )
    return verify_records([dict(zip(columns, row)) for row in rows], expected_root)


def review(connection):
    cursor = connection.execute(
        files(__package__).joinpath("sql/review.sql").read_text(encoding="utf-8")
    )
    columns = [column[0] for column in cursor.description]
    return [dict(zip(columns, row)) for row in cursor]
