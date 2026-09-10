import copy
import sqlite3
import unittest

from evia_journal.core import GENESIS, analyze, verify_records
from evia_journal.storage import connect, review, store_analysis, verify_export
from test_contract import nominal


class JournalTests(unittest.TestCase):
    def test_retention_cutoff_is_inclusive(self):
        s = nominal()
        s["retentionMs"] = 1000
        result = analyze(s)
        self.assertTrue(all(row["atMs"] >= 9000 for row in result["records"]))
        self.assertTrue(any(row["atMs"] == 9000 for row in result["records"]))

    def test_empty_export_uses_genesis(self):
        s = nominal()
        s["events"] = []
        result = analyze(s)
        self.assertEqual(result["rootHash"], GENESIS)
        self.assertTrue(verify_records([], GENESIS)["valid"])

    def test_tamper_and_wrong_external_root_detected(self):
        result = analyze(nominal())
        records = copy.deepcopy(result["records"])
        records[0]["outcome"] = "unknown"
        self.assertFalse(verify_records(records, result["rootHash"])["valid"])
        self.assertFalse(verify_records(result["records"], GENESIS)["valid"])

    def test_truncation_detected_against_external_root(self):
        result = analyze(nominal())
        self.assertFalse(verify_records(result["records"][:-1], result["rootHash"])["valid"])

    def test_free_text_and_future_events_rejected(self):
        for key, value in (("text", "unexpected free text"), ("atMs", 10001)):
            s = nominal()
            s["events"][0][key] = value
            with self.assertRaises(ValueError):
                analyze(s)

    def test_sql_only_retains_selected_events(self):
        s = nominal()
        s["retentionMs"] = 1000
        connection = connect(":memory:")
        result = store_analysis(connection, s)
        self.assertEqual(review(connection)[0]["retained_count"], 2)
        self.assertEqual(connection.execute("SELECT MIN(at_ms) FROM events").fetchone()[0], 9000)
        self.assertTrue(verify_export(connection, s["scenarioId"], result["rootHash"])["valid"])
        connection.execute(
            "UPDATE events SET outcome = CASE WHEN outcome = 'ok' THEN 'skipped' ELSE 'ok' END WHERE sequence = 0"
        )
        self.assertFalse(verify_export(connection, s["scenarioId"], result["rootHash"])["valid"])
        connection.close()

    def test_duplicate_export_rejected_without_replacement(self):
        connection = connect(":memory:")
        store_analysis(connection, nominal())
        before = review(connection)
        with self.assertRaises(sqlite3.IntegrityError):
            store_analysis(connection, nominal())
        self.assertEqual(before, review(connection))
        connection.close()

    def test_sql_failure_rolls_back_export_and_events(self):
        connection = connect(":memory:")
        connection.execute(
            "CREATE TRIGGER reject_event BEFORE INSERT ON events WHEN NEW.sequence = 1 BEGIN SELECT RAISE(ABORT, 'test'); END"
        )
        with self.assertRaises(sqlite3.IntegrityError):
            store_analysis(connection, nominal())
        self.assertEqual(connection.execute("SELECT COUNT(*) FROM exports").fetchone()[0], 0)
        self.assertEqual(connection.execute("SELECT COUNT(*) FROM events").fetchone()[0], 0)
        connection.close()
