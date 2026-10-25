"""
Launch the Streamlit UI from the project root (same as: streamlit run src/main.py).
"""
import subprocess
import sys
from pathlib import Path


def main() -> None:
    root = Path(__file__).resolve().parent
    cmd = [
        sys.executable,
        "-m",
        "streamlit",
        "run",
        str(root / "src" / "main.py"),
        *sys.argv[1:],
    ]
    raise SystemExit(subprocess.run(cmd, cwd=str(root)).returncode)


if __name__ == "__main__":
    main()
