import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const [owner = "", repository = ""] =
  process.env.GITHUB_REPOSITORY?.split("/") ?? [];
const isUserSite =
  repository.toLowerCase() === `${owner.toLowerCase()}.github.io`;
const pagesBasePath =
  process.env.GITHUB_ACTIONS === "true" && repository && !isUserSite
    ? `/${repository}`
    : "";
const dist = path.join(root, "dist");
const client = path.join(dist, "client");
const prerendered = path.join(dist, "server", "prerendered-routes");
const pages = path.join(dist, "pages");
const indexFile = path.join(prerendered, "index.html");
const notFoundFile = path.join(prerendered, "404.html");

if (!existsSync(indexFile)) {
  throw new Error("Static index.html was not generated.");
}

const sourceContent = readFileSync(path.join(root, "public", "content.md"), "utf8");
const pageHeadings = sourceContent.match(/^### PDF 第\d+页/gm) ?? [];
if (pageHeadings.length !== 178) {
  throw new Error("Content validation failed: expected 178 page headings.");
}
if (sourceContent.includes("待极高复核") || sourceContent.includes("�")) {
  throw new Error("Content validation failed: unresolved marker or replacement character found.");
}

rmSync(pages, { recursive: true, force: true });
mkdirSync(pages, { recursive: true });

cpSync(path.join(client, "_next"), path.join(pages, "_next"), { recursive: true });
cpSync(indexFile, path.join(pages, "index.html"));
cpSync(existsSync(notFoundFile) ? notFoundFile : indexFile, path.join(pages, "404.html"));

if (pagesBasePath) {
  for (const htmlFile of ["index.html", "404.html"]) {
    const filePath = path.join(pages, htmlFile);
    const html = readFileSync(filePath, "utf8");
    writeFileSync(
      filePath,
      html.replaceAll("/_next/", `${pagesBasePath}/_next/`),
    );
  }
}

for (const asset of ["content.md", "og.png"]) {
  cpSync(path.join(root, "public", asset), path.join(pages, asset));
}

writeFileSync(path.join(pages, ".nojekyll"), "");

const html = readFileSync(path.join(pages, "index.html"), "utf8");
if (!html.includes("N3 文法研修室")) {
  throw new Error("Static page validation failed: title missing.");
}
if (pagesBasePath && !html.includes(`${pagesBasePath}/_next/`)) {
  throw new Error("Static page validation failed: GitHub Pages path missing.");
}

console.log("GitHub Pages artifact prepared at dist/pages.");

