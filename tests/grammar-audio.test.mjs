import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function read(relativePath) {
  return readFile(new URL(relativePath, root), "utf8");
}

test("each printed grammar heading has an audio control state", async () => {
  const [content, cues] = await Promise.all([
    read("public/content.md"),
    read("app/grammarAudioCues.ts"),
  ]);

  let pdfPage = 0;
  const headingKeys = [];
  for (const line of content.split(/\r?\n/)) {
    const page = line.match(/^### PDF 第(\d+)页/);
    if (page) pdfPage = Number(page[1]);
    const grammar = line.match(/^####\s+(\d+)[\s\u3000]/);
    if (grammar) headingKeys.push(`${pdfPage}:${grammar[1]}`);
  }

  const cueKeys = [...cues.matchAll(/^\s{2}"(\d+:\d+)": cue/gm)].map((match) => match[1]);
  const missing = headingKeys.filter((key) => !cueKeys.includes(key));

  assert.equal(headingKeys.length, 104);
  assert.equal(cueKeys.length, 99);
  assert.equal(new Set(cueKeys).size, 99);
  assert.deepEqual(missing, ["90:1", "91:2", "91:3", "92:4", "93:5"]);
});

test("the 間 / 間に cue starts at the spoken grammar transition", async () => {
  const cues = await read("app/grammarAudioCues.ts");
  const match = cues.match(/"22:2": cue\(1, ([\d.]+), ([\d.]+)/);

  assert.ok(match, "22:2 cue is present");
  const start = Number(match[1]);
  const end = Number(match[2]);
  assert.ok(start >= 660 && start <= 663, `expected a start near 11:01, received ${start}`);
  assert.ok(end >= 932 && end <= 934, `expected an end before grammar 3, received ${end}`);
});

test("targeted original-audio rechecks use the newly detected transitions", async () => {
  const cues = await read("app/grammarAudioCues.ts");
  const starts = new Map(
    [...cues.matchAll(/"(\d+:\d+)": cue\(\d+, ([\d.]+), ([\d.]+)/g)]
      .map((match) => [match[1], Number(match[2])]),
  );

  assert.equal(starts.get("24:2"), 313.5);
  assert.equal(starts.get("25:5"), 1238.3);
  assert.equal(starts.get("45:5"), 494);
  assert.equal(starts.get("53:4"), 962.4);
  assert.equal(starts.get("69:5"), 586.3);
  assert.equal(starts.get("77:3"), 819.6);

  for (const match of cues.matchAll(/cue\(\d+, ([\d.]+), ([\d.]+)/g)) {
    assert.ok(Number(match[2]) > Number(match[1]), `invalid cue range: ${match[0]}`);
  }
});

test("unclear single-grammar boundaries are explicitly marked for review", async () => {
  const cues = await read("app/grammarAudioCues.ts");
  const reviewCues = [...cues.matchAll(/cue\([^\n]+"review"\)/g)];

  assert.equal(reviewCues.length, 2);
  assert.match(cues, /kind\?: "section" \| "review"/);
});

test("grammar audio uses the original Bilibili player without publishing copied audio", async () => {
  const reader = await read("app/GrammarReader.tsx");

  assert.match(reader, /function audioPlayerUrl/);
  assert.match(reader, /autoplay=1/);
  assert.match(reader, /&t=\$\{Math\.floor\(start\)\}/);
  assert.match(reader, /className="audio-engine"/);
  assert.match(reader, /function mobilePlayerUrl/);
  assert.match(reader, /className="mobile-audio-frame"/);
  assert.match(reader, /navigator\.maxTouchPoints/);
  assert.match(reader, /请在播放器内点击/);
  assert.match(reader, /activeVideoKey/);
  assert.match(reader, /setActiveInlineVideo/);
  assert.match(reader, /看板书/);
  assert.match(reader, /听本组讲解/);
  assert.match(reader, /听讲解 · 待复核/);
  assert.match(reader, /暂无讲解/);
});
