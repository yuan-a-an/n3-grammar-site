"""Print transcript context for every grammar audio cue.

This is a local QA helper: it joins the published grammar heading, the current
cue and the word-level ASR transcript so each seek point can be reviewed in
context without replaying the whole lecture.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import re


CUE_PATTERN = re.compile(
    r'^\s+"(?P<key>\d+:\d+)": cue\('
    r'(?P<part>\d+), (?P<start>[\d.]+), (?P<end>[\d.]+)'
    r'(?P<kind>, "(?:section|review)")?'
)
PAGE_PATTERN = re.compile(r"^### PDF 第(?P<page>\d+)页")
HEADING_PATTERN = re.compile(r"^####\s+(?P<number>\d+)[\s　](?P<heading>.+)$")


def grammar_headings(markdown: str) -> dict[str, str]:
    headings: dict[str, str] = {}
    current_page: int | None = None
    for line in markdown.splitlines():
        page_match = PAGE_PATTERN.match(line)
        if page_match:
            current_page = int(page_match.group("page"))
            continue
        heading_match = HEADING_PATTERN.match(line)
        if current_page is not None and heading_match:
            key = f'{current_page}:{heading_match.group("number")}'
            headings[key] = heading_match.group("heading").strip()
    return headings


def words(data: dict) -> list[dict]:
    return [word for segment in data["segments"] for word in segment.get("words", [])]


def context_at(items: list[dict], start: float, before: float = 12, after: float = 38) -> str:
    selected = [
        re.sub(r"\s+", "", item["word"])
        for item in items
        if float(item["end"]) >= start - before and float(item["start"]) <= start + after
    ]
    return "".join(selected)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--part", type=int, action="append", help="Only report this Bilibili part (repeatable).")
    parser.add_argument("--kind", choices=("exact", "section", "review"), help="Only report one cue kind.")
    args = parser.parse_args()

    root = Path(__file__).resolve().parents[1]
    headings = grammar_headings((root / "public" / "content.md").read_text(encoding="utf-8"))
    cues = []
    for line in (root / "app" / "grammarAudioCues.ts").read_text(encoding="utf-8").splitlines():
        match = CUE_PATTERN.match(line)
        if match:
            cues.append({
                "key": match.group("key"),
                "part": int(match.group("part")),
                "start": float(match.group("start")),
                "end": float(match.group("end")),
                "kind": match.group("kind")[3:-1] if match.group("kind") else "exact",
            })

    transcript_cache: dict[int, list[dict]] = {}
    for cue in cues:
        if args.part and cue["part"] not in args.part:
            continue
        if args.kind and cue["kind"] != args.kind:
            continue
        part = cue["part"]
        if part not in transcript_cache:
            transcript = json.loads(
                (root / "work" / "transcripts-precise" / f"p{part:02d}.json").read_text(encoding="utf-8")
            )
            transcript_cache[part] = words(transcript)
        heading = headings.get(cue["key"], "[heading missing]")
        context = context_at(transcript_cache[part], cue["start"])
        print(
            f'{cue["key"]}\tP{part:02d}\t{cue["kind"]}\t'
            f'{cue["start"]:.1f}-{cue["end"]:.1f}\t{heading}\n  {context}'
        )


if __name__ == "__main__":
    main()
