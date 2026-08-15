"""Build local ASR transcripts for the linked Bilibili course.

The downloaded audio and model cache stay under the ignored ``work`` folder.
Nothing from the video is copied into the published site.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
import re
import shutil
import sys
import time
from urllib.request import Request, urlopen

from faster_whisper import BatchedInferencePipeline, WhisperModel


BVID = "BV1xA411b7ri"
LECTURE_PARTS = [
    *range(1, 11),
    *range(12, 16),
    *range(17, 21),
    22,
    24,
    26,
    *range(28, 42),
]
VIDEO_PDF_PAGES = {
    1: [22, 23], 2: [24, 25], 3: [28, 29], 4: [30, 31],
    5: [36, 37], 6: [38, 39], 7: [42, 43], 8: [42, 43],
    9: [44, 45], 10: [44, 45], 12: [50, 51], 13: [50, 51],
    14: [52, 53], 15: [52, 53], 17: [56, 57], 18: [56, 57],
    19: [58, 59], 20: [58, 59], 22: [64, 65], 24: [68, 69],
    26: [72, 73], 28: [76, 77], 29: [80, 81], 30: [86, 87],
    31: [96, 97], 32: [100, 101, 102, 103], 33: [106, 107, 108, 109],
    34: [116, 118, 120, 122], 35: list(range(128, 134)),
    36: list(range(134, 140)), 37: list(range(134, 140)),
    38: list(range(140, 146)), 39: list(range(140, 146)),
    40: list(range(146, 152)), 41: list(range(152, 156)),
}
HEADERS = {
    "User-Agent": "Mozilla/5.0",
    "Referer": f"https://www.bilibili.com/video/{BVID}/",
}


def get_json(url: str, attempts: int = 3) -> dict:
    for attempt in range(attempts):
        try:
            with urlopen(Request(url, headers=HEADERS), timeout=60) as response:
                return json.load(response)
        except Exception:
            if attempt + 1 == attempts:
                raise
            time.sleep(2 ** attempt)
    raise RuntimeError("unreachable")


def download(url: str, target: Path, attempts: int = 3) -> None:
    partial = target.with_suffix(target.suffix + ".part")
    for attempt in range(attempts):
        try:
            with urlopen(Request(url, headers=HEADERS), timeout=180) as response:
                with partial.open("wb") as output:
                    shutil.copyfileobj(response, output)
            partial.replace(target)
            return
        except Exception:
            partial.unlink(missing_ok=True)
            if attempt + 1 == attempts:
                raise
            time.sleep(2 ** attempt)


def grammar_headings(markdown: str) -> dict[int, list[str]]:
    pages: dict[int, list[str]] = {}
    current_page: int | None = None
    for line in markdown.splitlines():
        page_match = re.match(r"^### PDF 第(\d+)页", line)
        if page_match:
            current_page = int(page_match.group(1))
            pages.setdefault(current_page, [])
            continue
        if current_page is not None and re.match(r"^####\s+\d+[\s　]", line):
            pages[current_page].append(re.sub(r"^####\s+", "", line).strip())
    return pages


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    work = root / "work"
    audio_dir = work / "audio"
    transcript_dir = work / "transcripts"
    audio_dir.mkdir(parents=True, exist_ok=True)
    transcript_dir.mkdir(parents=True, exist_ok=True)

    headings_by_page = grammar_headings((root / "public" / "content.md").read_text(encoding="utf-8"))
    view = get_json(f"https://api.bilibili.com/x/web-interface/view?bvid={BVID}")["data"]
    parts = {item["page"]: item for item in view["pages"]}

    model = WhisperModel("small", device="cuda", compute_type="float16")
    transcriber = BatchedInferencePipeline(model=model)

    for index, part_number in enumerate(LECTURE_PARTS, start=1):
        output_path = transcript_dir / f"p{part_number:02d}.json"
        if output_path.exists():
            print(json.dumps({"part": part_number, "status": "cached", "progress": f"{index}/{len(LECTURE_PARTS)}"}), flush=True)
            continue

        part = parts[part_number]
        audio_path = audio_dir / f"p{part_number:02d}.m4a"
        if not audio_path.exists():
            play = get_json(
                "https://api.bilibili.com/x/player/playurl"
                f"?bvid={BVID}&cid={part['cid']}&fnval=16&qn=64"
            )["data"]
            stream = min(play["dash"]["audio"], key=lambda item: item["bandwidth"])
            download(stream["baseUrl"], audio_path)

        expected = [
            heading
            for pdf_page in VIDEO_PDF_PAGES.get(part_number, [])
            for heading in headings_by_page.get(pdf_page, [])
        ]
        prompt = (
            "新完全掌握日语能力考试N3级语法。老师用中文讲解日语语法。"
            + "本段涉及："
            + "；".join(expected)
        )
        segments, info = transcriber.transcribe(
            str(audio_path),
            batch_size=16,
            language="zh",
            beam_size=5,
            vad_filter=True,
            condition_on_previous_text=True,
            initial_prompt=prompt,
        )
        result = {
            "part": part_number,
            "cid": part["cid"],
            "title": part["part"],
            "duration": info.duration,
            "expected_headings": expected,
            "segments": [
                {"start": round(segment.start, 3), "end": round(segment.end, 3), "text": segment.text.strip()}
                for segment in segments
            ],
        }
        output_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
        print(json.dumps({"part": part_number, "status": "done", "segments": len(result["segments"]), "progress": f"{index}/{len(LECTURE_PARTS)}"}, ensure_ascii=False), flush=True)

    return 0


if __name__ == "__main__":
    sys.exit(main())
