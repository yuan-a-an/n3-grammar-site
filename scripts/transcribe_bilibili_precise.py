"""Create word-level transcripts used to audit per-grammar audio cue points.

This is deliberately separate from the fast first-pass transcript. The fast
pass is useful for finding a broad section; these word timestamps are used for
the actual player seek positions.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
import sys

from faster_whisper import BatchedInferencePipeline, WhisperModel

from transcribe_bilibili import LECTURE_PARTS


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    source_dir = root / "work" / "transcripts"
    audio_dir = root / "work" / "audio"
    output_dir = root / "work" / "transcripts-precise"
    output_dir.mkdir(parents=True, exist_ok=True)

    model = WhisperModel("small", device="cuda", compute_type="float16")
    transcriber = BatchedInferencePipeline(model=model)

    for index, part_number in enumerate(LECTURE_PARTS, start=1):
        output_path = output_dir / f"p{part_number:02d}.json"
        if output_path.exists():
            print(json.dumps({
                "part": part_number,
                "status": "cached",
                "progress": f"{index}/{len(LECTURE_PARTS)}",
            }), flush=True)
            continue

        first_pass = json.loads(
            (source_dir / f"p{part_number:02d}.json").read_text(encoding="utf-8")
        )
        expected = first_pass["expected_headings"]
        prompt = (
            "新完全掌握日语能力考试N3级语法。老师用中文讲解日语语法。"
            + "本段涉及："
            + "；".join(expected)
        )
        segments, info = transcriber.transcribe(
            str(audio_dir / f"p{part_number:02d}.m4a"),
            language="zh",
            beam_size=5,
            vad_filter=True,
            condition_on_previous_text=True,
            word_timestamps=True,
            batch_size=16,
            initial_prompt=prompt,
        )

        result = {
            "part": part_number,
            "title": first_pass["title"],
            "duration": info.duration,
            "expected_headings": expected,
            "segments": [],
        }
        for segment in segments:
            result["segments"].append({
                "start": round(segment.start, 3),
                "end": round(segment.end, 3),
                "text": segment.text.strip(),
                "words": [
                    {
                        "start": round(word.start, 3),
                        "end": round(word.end, 3),
                        "word": word.word,
                    }
                    for word in (segment.words or [])
                ],
            })

        output_path.write_text(
            json.dumps(result, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        print(json.dumps({
            "part": part_number,
            "status": "done",
            "segments": len(result["segments"]),
            "progress": f"{index}/{len(LECTURE_PARTS)}",
        }, ensure_ascii=False), flush=True)

    return 0


if __name__ == "__main__":
    os.environ.setdefault("PYTHONUTF8", "1")
    sys.exit(main())
