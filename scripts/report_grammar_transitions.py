"""Report likely spoken grammar transitions near the current player cues."""

from __future__ import annotations

import json
from pathlib import Path
import re


TRANSITION_PATTERN = re.compile(
    r"(?:"
    r"第[一二三四五六七八九十两0-9]+个(?:的)?(?:语法|用法)"
    r"|最上面(?:的)?第[一二三四五六七八九十两0-9]+个(?:语法|用法)"
    r"|(?:下面一个|下边一个|下一个|最后一个)(?:的)?(?:语法|用法)"
    r")"
)
CUE_PATTERN = re.compile(
    r'^\s+"(?P<key>\d+:\d+)": cue\('
    r'(?P<part>\d+), (?P<start>[\d.]+), (?P<end>[\d.]+)'
)


def transcript_chars(data: dict) -> tuple[str, list[float]]:
    characters: list[str] = []
    times: list[float] = []
    for segment in data["segments"]:
        for word in segment.get("words", []):
            token = re.sub(r"\s+", "", word["word"])
            characters.extend(token)
            times.extend([float(word["start"])] * len(token))
    return "".join(characters), times


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    precise_dir = root / "work" / "transcripts-precise"
    cues = []
    for line in (root / "app" / "grammarAudioCues.ts").read_text(encoding="utf-8").splitlines():
        match = CUE_PATTERN.match(line)
        if match:
            cues.append({
                "key": match.group("key"),
                "part": int(match.group("part")),
                "start": float(match.group("start")),
            })

    by_part: dict[int, list[dict]] = {}
    for cue in cues:
        by_part.setdefault(cue["part"], []).append(cue)

    for part, part_cues in sorted(by_part.items()):
        path = precise_dir / f"p{part:02d}.json"
        if not path.exists():
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        text, times = transcript_chars(data)
        candidates = []
        for match in TRANSITION_PATTERN.finditer(text):
            if match.start() >= len(times):
                continue
            start = times[match.start()]
            left = max(0, match.start() - 28)
            right = min(len(text), match.end() + 40)
            candidates.append({
                "start": start,
                "phrase": match.group(0),
                "context": text[left:right],
            })

        print(f"### P{part:02d} {data['title']}")
        for cue in part_cues:
            nearby = [item for item in candidates if abs(item["start"] - cue["start"]) <= 100]
            nearby.sort(key=lambda item: abs(item["start"] - cue["start"]))
            print(f"{cue['key']} current={cue['start']:.1f}")
            for item in nearby[:4]:
                print(
                    f"  {item['start']:.2f} {item['phrase']} | {item['context']}"
                )


if __name__ == "__main__":
    main()
