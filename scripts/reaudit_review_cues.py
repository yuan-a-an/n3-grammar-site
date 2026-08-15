"""Re-transcribe unclear cue boundaries from short original-audio windows."""

from __future__ import annotations

import json
from pathlib import Path
import re

from faster_whisper import WhisperModel
from faster_whisper.audio import decode_audio


SAMPLE_RATE = 16_000
REVIEW_CUES = [
    ("24:2", 2, 302.5, 275.0, 365.0),
    ("25:5", 2, 1252.2, 1225.0, 1325.0),
    ("31:5", 4, 515.7, 485.0, 575.0),
    ("45:5", 10, 477.4, 450.0, 535.0),
    ("53:4", 15, 958.9, 930.0, 1015.0),
    ("69:5", 24, 579.0, 550.0, 630.0),
    ("76:2", 28, 369.1, 340.0, 425.0),
    ("77:3", 28, 844.5, 815.0, 900.0),
]


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    snapshots = (
        root / "work" / "hf-cache" / "hub"
        / "models--Systran--faster-whisper-small" / "snapshots"
    )
    model_path = next(path for path in snapshots.iterdir() if (path / "model.bin").exists())
    model = WhisperModel(
        str(model_path),
        device="cuda",
        compute_type="float16",
    )
    audio_cache = {}
    transcript_cache = {}

    for key, part, current, clip_start, clip_end in REVIEW_CUES:
        if part not in audio_cache:
            audio_cache[part] = decode_audio(
                str(root / "work" / "audio" / f"p{part:02d}.m4a"),
                sampling_rate=SAMPLE_RATE,
            )
            transcript_cache[part] = json.loads(
                (root / "work" / "transcripts" / f"p{part:02d}.json").read_text(encoding="utf-8")
            )
        audio = audio_cache[part]
        clip = audio[int(clip_start * SAMPLE_RATE):int(clip_end * SAMPLE_RATE)]
        expected = transcript_cache[part]["expected_headings"]
        prompt = (
            "新完全掌握日语能力考试N3级语法。老师用中文讲解日语语法。"
            + "本课可能涉及："
            + "；".join(expected)
        )
        segments, _ = model.transcribe(
            clip,
            language="zh",
            beam_size=5,
            vad_filter=False,
            condition_on_previous_text=False,
            word_timestamps=True,
            initial_prompt=prompt,
        )
        print(f"### {key} / P{part:02d} / current={current:.1f}")
        for segment in segments:
            absolute_start = clip_start + float(segment.start)
            absolute_end = clip_start + float(segment.end)
            text = re.sub(r"\s+", "", segment.text)
            print(f"{absolute_start:8.2f}-{absolute_end:8.2f}  {text}")


if __name__ == "__main__":
    main()
