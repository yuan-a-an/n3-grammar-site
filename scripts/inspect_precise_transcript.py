"""Inspect a word-level ASR time range in short timestamped chunks."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import re


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("part", type=int)
    parser.add_argument("start", type=float)
    parser.add_argument("end", type=float)
    parser.add_argument("--seconds", type=float, default=4.0)
    args = parser.parse_args()

    root = Path(__file__).resolve().parents[1]
    data = json.loads(
        (root / "work" / "transcripts-precise" / f"p{args.part:02d}.json").read_text(encoding="utf-8")
    )
    items = [
        word
        for segment in data["segments"]
        for word in segment.get("words", [])
        if float(word["end"]) >= args.start and float(word["start"]) <= args.end
    ]
    if not items:
        return

    chunk: list[dict] = []
    chunk_start = float(items[0]["start"])
    for item in items:
        chunk.append(item)
        text = re.sub(r"\s+", "", item["word"])
        elapsed = float(item["end"]) - chunk_start
        if elapsed >= args.seconds or re.search(r"[。！？!?]$", text):
            value = "".join(re.sub(r"\s+", "", word["word"]) for word in chunk)
            print(f'{chunk_start:8.2f}-{float(item["end"]):8.2f}  {value}')
            chunk = []
            chunk_start = float(item["end"])
    if chunk:
        value = "".join(re.sub(r"\s+", "", word["word"]) for word in chunk)
        print(f'{chunk_start:8.2f}-{float(chunk[-1]["end"]):8.2f}  {value}')


if __name__ == "__main__":
    main()
