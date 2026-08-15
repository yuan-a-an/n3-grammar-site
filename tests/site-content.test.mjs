import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function read(relativePath) {
  return readFile(new URL(relativePath, root), "utf8");
}

test("corrected book content is complete and clean", async () => {
  const content = await read("public/content.md");
  const headings = [...content.matchAll(/^### PDF 第(\d+)页/gm)];

  assert.equal(headings.length, 178);
  assert.equal(new Set(headings.map((match) => match[1])).size, 178);
  assert.doesNotMatch(content, /待极高复核|�/);
  assert.ok(content.length > 130_000);
});

test("reader exposes the requested learning modules", async () => {
  const source = await read("app/GrammarReader.tsx");

  for (const label of ["导读", "语法", "练习", "重点辨析", "答案解析"]) {
    assert.match(source, new RegExp(label));
  }
  assert.match(source, /function createUnits\(\): UnitDef\[\]/);
  assert.match(source, /localStorage\.setItem/);
  assert.match(source, /fetch\(contentUrl/);
  assert.match(source, /BV1xA411b7ri/);
  assert.match(source, /player\.bilibili\.com\/player\.html/);

  const videoData = source.match(/const videoPartData = \[(.*?)\] as const;/s)?.[1] ?? "";
  assert.equal([...videoData.matchAll(/^\s+\[\d+,/gm)].length, 41);
});

test("GitHub Pages deployment uses the prepared artifact", async () => {
  const workflow = await read(".github/workflows/deploy-pages.yml");

  assert.match(workflow, /npm run build:pages/);
  assert.match(workflow, /actions\/upload-pages-artifact@v5/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
});