"""Bilingual offline command line / Linha de comando offline bilíngue."""

import argparse
import sqlite3
import sys
from pathlib import Path

from .contract import read_json, write_json
from .core import analyze


def parser():
    root = argparse.ArgumentParser(description="Offline analysis / Análise offline")
    commands = root.add_subparsers(dest="command", required=True)
    command = commands.add_parser("analyze", help="Analyze JSON / Analisar JSON")
    command.add_argument("input", help="Scenario JSON / JSON do cenário")
    command.add_argument("output", help="Report JSON / JSON do relatório")
    command = commands.add_parser(
        "store", help="Archive validated analysis / Arquivar análise validada"
    )
    command.add_argument("input")
    command.add_argument("database")
    command = commands.add_parser("query", help="Run SQL review / Executar revisão SQL")
    command.add_argument("database")
    command.add_argument("output")
    command = commands.add_parser(
        "verify", help="Verify against externally retained root / Verificar com raiz externa"
    )
    command.add_argument("database")
    command.add_argument("scenario_id")
    command.add_argument("expected_root")
    command.add_argument("output")
    return root


def execute(args):
    if args.command == "analyze":
        write_json(args.output, analyze(read_json(args.input)))
    elif args.command == "store":
        from .storage import connect, store_analysis

        if Path(args.input).resolve() == Path(args.database).resolve():
            raise ValueError("Database must differ from input / Banco deve diferir da entrada")
        scenario = read_json(args.input)
        analyze(scenario)
        connection = connect(args.database)
        try:
            store_analysis(connection, scenario)
        finally:
            connection.close()
    elif args.command == "query":
        from .storage import connect, review

        if (
            not Path(args.database).is_file()
            or Path(args.database).resolve() == Path(args.output).resolve()
        ):
            raise ValueError(
                "Existing database and distinct output required / Exigidos banco existente e saída distinta"
            )
        connection = connect(args.database)
        try:
            write_json(args.output, review(connection))
        finally:
            connection.close()
    elif args.command == "verify":
        from .storage import connect, verify_export

        if (
            not Path(args.database).is_file()
            or Path(args.database).resolve() == Path(args.output).resolve()
        ):
            raise ValueError(
                "Existing database and distinct output required / Exigidos banco existente e saída distinta"
            )
        connection = connect(args.database)
        try:
            result = verify_export(connection, args.scenario_id, args.expected_root)
            write_json(args.output, result)
            if not result["valid"]:
                raise ValueError("Integrity check failed / Falha na integridade")
        finally:
            connection.close()


def main(argv=None):
    args = parser().parse_args(argv)
    try:
        if hasattr(args, "output"):
            for name in ("input", "csv", "database"):
                if (
                    hasattr(args, name)
                    and Path(getattr(args, name)).resolve() == Path(args.output).resolve()
                ):
                    raise ValueError(
                        "Input and output must differ / Entrada e saída devem ser diferentes"
                    )
        execute(args)
        return 0
    except (ValueError, OSError, sqlite3.Error) as error:
        print(f"Analysis failed / Falha na análise: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
