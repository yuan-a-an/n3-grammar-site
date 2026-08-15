import type { Metadata } from "next";
import "./globals.css";
import "./reader.css";

const repository = process.env.GITHUB_REPOSITORY?.split("/") ?? [];
const owner = repository[0] ?? "";
const repo = repository[1] ?? "";
const isGitHubBuild = process.env.GITHUB_ACTIONS === "true";
const isUserSite = repo.toLowerCase() === (owner + ".github.io").toLowerCase();
const basePath = isGitHubBuild && repo && !isUserSite ? "/" + repo : "";
const siteRoot = isGitHubBuild && owner ? "https://" + owner + ".github.io" + basePath + "/" : "http://localhost:3000/";
const siteUrl = new URL(siteRoot);
const ogImage = new URL("og.png", siteUrl).toString();

export const metadata: Metadata = {
  title: {
    default: "N3 文法研修室",
    template: "%s · N3 文法研修室",
  },
  description: "把《新完全掌握 N3 语法》校正版整理成按课阅读的学习空间。",
  metadataBase: siteUrl,
  openGraph: {
    title: "N3 文法研修室",
    description: "按课学习语法、练习与答案解析。",
    type: "website",
    url: siteUrl,
    images: [
      { url: ogImage, width: 1732, height: 909, alt: "N3 文法研修室" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "N3 文法研修室",
    description: "按课学习语法、练习与答案解析。",
    images: [ogImage],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
