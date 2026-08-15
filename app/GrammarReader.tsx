"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";

import {
  grammarAudioCueKey,
  grammarAudioCues,
  type GrammarAudioCue,
} from "./grammarAudioCues";

type ModuleKey = "overview" | "grammar" | "practice" | "focus" | "answers";

type VideoPart = {
  page: number;
  title: string;
  duration: number;
  cid: number;
};

type ActiveAudio = {
  key: string;
  cue: GrammarAudioCue;
  label: string;
  instance: number;
};

type PageSection = {
  pdfPage: number;
  bookPage?: number;
  title: string;
  lines: string[];
};

type ModuleDef = {
  key: ModuleKey;
  label: string;
  pages: number[];
};

type UnitDef = {
  id: string;
  group: string;
  eyebrow: string;
  title: string;
  modules: ModuleDef[];
};

const moduleLabels: Record<ModuleKey, string> = {
  overview: "导读",
  grammar: "语法",
  practice: "练习",
  focus: "重点辨析",
  answers: "答案解析",
};

const bilibiliBvid = "BV1xA411b7ri";

const videoPartData = [
  [1, "第一部 句子的语法 第1课", 1477, 178037383],
  [2, "第一部 句子的语法 第2课", 2069, 178121009],
  [3, "第三课", 1312, 182392067],
  [4, "第四课", 1417, 182411504],
  [5, "第五课", 1590, 189990550],
  [6, "第六课", 2209, 189995754],
  [7, "第七课（上）", 784, 198726588],
  [8, "第七课（下）", 1039, 198727868],
  [9, "第八课（上）", 494, 198729799],
  [10, "第八课（下）", 665, 198730504],
  [11, "第七・八课练习", 961, 199065488],
  [12, "第九课（上）", 882, 199068165],
  [13, "第九课（下）", 859, 199070526],
  [14, "第十课（上）", 560, 211109783],
  [15, "第十课（下）", 1053, 211110930],
  [16, "第九・十课练习", 765, 211114079],
  [17, "第十一课（上）", 369, 214636529],
  [18, "第十一课（下）", 446, 214642574],
  [19, "第十二课（上）", 775, 232737173],
  [20, "第十二课（下）", 438, 232737527],
  [21, "第十一・十二课练习", 622, 232737708],
  [22, "文法形式整理 A", 1091, 234091177],
  [23, "文法形式整理 A 练习", 598, 234092295],
  [24, "文法形式整理 B", 650, 238857161],
  [25, "文法形式整理 B 练习", 793, 238857386],
  [26, "文法形式整理 C", 1178, 241631335],
  [27, "文法形式整理 C 练习", 484, 241634313],
  [28, "文法形式整理 D＋练习", 1896, 243860309],
  [29, "文法形式整理 E＋练习", 1773, 247264208],
  [30, "文法形式整理 F＋练习", 856, 256129646],
  [31, "文法形式整理 H＋练习", 1433, 272554644],
  [32, "文法形式整理 I", 1071, 387505086],
  [33, "文法形式整理 J", 1231, 389726761],
  [34, "第2部 句型语法（书内 P102—111）", 654, 395754026],
  [35, "第3部 第1・2课", 1100, 397668445],
  [36, "第3部 第3・4课（上）", 803, 400264518],
  [37, "第3部 第3・4课（下）", 929, 403802216],
  [38, "第3部 第5・6课（上）", 1124, 404754024],
  [39, "第3部 第5・6课（下）", 1051, 406453977],
  [40, "第3部 第7・8课（书内 P132—137）", 412, 408616256],
  [41, "第3部 第9・10课（书内 P138—141）", 858, 408641924],
] as const;

const videoParts = new Map<number, VideoPart>(
  videoPartData.map(([page, title, duration, cid]) => [page, { page, title, duration, cid }]),
);

const videoPagesByUnit: Record<string, number[]> = {
  "part1-lesson-1": [1],
  "part1-lesson-2": [2],
  "part1-lesson-3": [3],
  "part1-lesson-4": [4],
  "part1-lesson-5": [5],
  "part1-lesson-6": [6],
  "part1-lesson-7": [7, 8, 11],
  "part1-lesson-8": [9, 10, 11],
  "part1-lesson-9": [12, 13, 16],
  "part1-lesson-10": [14, 15, 16],
  "part1-lesson-11": [17, 18, 21],
  "part1-lesson-12": [19, 20, 21],
  "part1-topic-a": [22, 23],
  "part1-topic-b": [24, 25],
  "part1-topic-c": [26, 27],
  "part1-topic-d": [28],
  "part1-topic-e": [29],
  "part1-topic-f": [30],
  "part1-topic-h": [31],
  "part1-topic-i": [32],
  "part1-topic-j": [33],
  "part2-lesson-1": [34],
  "part2-lesson-2": [34],
  "part2-lesson-3": [34],
  "part2-lesson-4": [34],
  "part2-summary": [34],
  "part3-lesson-1": [35],
  "part3-lesson-2": [35],
  "part3-summary-12": [35],
  "part3-lesson-3": [36, 37],
  "part3-lesson-4": [36, 37],
  "part3-summary-34": [36, 37],
  "part3-lesson-5": [38, 39],
  "part3-lesson-6": [38, 39],
  "part3-summary-56": [38, 39],
  "part3-lesson-7": [40],
  "part3-lesson-8": [40],
  "part3-summary-78": [40],
  "part3-lesson-9": [41],
  "part3-lesson-10": [41],
  "part3-summary-910": [41],
};

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = String(seconds % 60).padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function playerUrl(video: VideoPart) {
  return `https://player.bilibili.com/player.html?isOutside=true&bvid=${bilibiliBvid}&cid=${video.cid}&p=${video.page}&autoplay=0&danmaku=0`;
}

function audioPlayerUrl(video: VideoPart, start: number) {
  return `https://player.bilibili.com/player.html?isOutside=true&bvid=${bilibiliBvid}&cid=${video.cid}&p=${video.page}&autoplay=1&danmaku=0&muted=0&t=${Math.floor(start)}`;
}

function mobilePlayerUrl(video: VideoPart, start: number) {
  return `https://player.bilibili.com/player.html?isOutside=true&bvid=${bilibiliBvid}&cid=${video.cid}&p=${video.page}&autoplay=0&danmaku=0&t=${Math.floor(start)}`;
}

function formatTimestamp(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

function bilibiliUrl(video: VideoPart) {
  return `https://www.bilibili.com/video/${bilibiliBvid}/?p=${video.page}`;
}

const p1LessonTitles = [
  "～とき",
  "～と関係して",
  "比べれば…～がいちばん",
  "～とは違って",
  "～だから",
  "もし、…",
  "～だそうだ",
  "絶対～ない・必ず～とは言えない",
  "～と望む",
  "～したほうがいい・～なさい",
  "～（よ）うと思う",
  "敬语",
];

const p1GrammarPages = [
  [22, 23], [24, 25], [28, 29], [30, 31], [36, 37], [38, 39],
  [42, 43], [44, 45], [50, 51], [52, 53], [56, 57], [58, 59],
];

const p1PracticePages = [
  [26, 27], [26, 27], [32, 33], [32, 33], [40, 41], [40, 41],
  [46, 47], [46, 47], [54, 55], [54, 55], [60, 61], [60, 61],
];

const p1TopicData = [
  ["A", "具有多种作用的助词", [64, 65], [66], [67], [176]],
  ["B", "具有助词作用的词语", [68, 69], [70], [71], [176]],
  ["C", "「こと・の」的用法", [72, 73], [74], [75], [177]],
  ["D", "「よう」的多种用法", [76, 77], [78], [79], [177]],
  ["E", "「わけ」的多种用法", [80, 81], [82], [83], [177, 178]],
  ["F", "「ばかり」的多种用法", [86, 87], [88], [89], [179]],
  ["G", "「する・なる」的整理", [90, 91, 92, 93], [94], [95], [179]],
  ["H", "「たら・ば・と・なら」的特殊用法", [96, 97], [98], [99], [179]],
  ["I", "后接固定表达的副词", [100, 101, 102, 103], [104, 105], [], [179]],
  ["J", "扩展动词或名词含义的语法形式", [106, 107, 108, 109], [110], [111], [180]],
] as const;

const p2Titles = [
  "句子的组合1——引用",
  "句子的组合2——名词的说明",
  "句子的组合3——「～という・～といった」",
  "句子的组合4——固定形式",
];

const p3Data = [
  ["句子开头与结尾的呼应", [128], [129], [186]],
  ["时态・～ている", [130], [131], [186]],
  ["保持叙述视点1——他动词・自动词", [134], [135], [187]],
  ["保持叙述视点2——～てくる・～ていく", [136], [137], [187, 188]],
  ["保持叙述视点3——被动・使役・使役被动", [140], [141], [189]],
  ["保持叙述视点4——授受表达", [142], [143], [189]],
  ["こ・そ・あ", [146], [147], [190]],
  ["は・が", [148], [149], [190]],
  ["接续表达", [152], [153], [191]],
  ["文章语气的统一", [154], [155], [191, 192]],
] as const;

function makeModules(
  grammar: readonly number[],
  practice: readonly number[] = [],
  focus: readonly number[] = [],
  answers: readonly number[] = [],
): ModuleDef[] {
  return [
    { key: "grammar" as const, pages: [...grammar] },
    { key: "practice" as const, pages: [...practice] },
    { key: "focus" as const, pages: [...focus] },
    { key: "answers" as const, pages: [...answers] },
  ]
    .filter((item) => item.pages.length > 0)
    .map((item) => ({ ...item, label: moduleLabels[item.key] }));
}

function createUnits(): UnitDef[] {
  const units: UnitDef[] = [
    {
      id: "exam-guide",
      group: "开始学习",
      eyebrow: "考试导读",
      title: "N3 语法题型与解题思路",
      modules: [{ key: "overview", label: "导读", pages: [16, 17, 18, 19] }],
    },
  ];

  p1LessonTitles.forEach((title, index) => {
    const lesson = index + 1;
    const answerPage = lesson <= 4 ? 170 : lesson <= 8 ? 172 : 174;
    units.push({
      id: "part1-lesson-" + lesson,
      group: "第1部 · 句子的语法1",
      eyebrow: "第 " + lesson + " 课",
      title,
      modules: makeModules(p1GrammarPages[index], p1PracticePages[index], [], [answerPage]),
    });
  });

  const part1Summaries: Array<[string, string, number[], number[]]> = [
    ["part1-summary-4", "第1—4课总结", [34, 35], [170, 171]],
    ["part1-summary-8", "第1—8课总结", [48, 49], [172, 173]],
    ["part1-summary-12", "第1—12课总结", [62, 63], [174, 175]],
  ];
  part1Summaries.forEach(([id, title, practice, answers]) => {
    units.push({
      id,
      group: "第1部 · 句子的语法1",
      eyebrow: "阶段复习",
      title,
      modules: makeModules([], practice, [], answers),
    });
  });

  p1TopicData.forEach(([letter, title, grammar, practice, focus, answers]) => {
    units.push({
      id: "part1-topic-" + letter.toLowerCase(),
      group: "第1部 · 文法形式整理",
      eyebrow: "专项 " + letter,
      title,
      modules: makeModules(grammar, practice, focus, answers),
    });
  });

  units.push(
    {
      id: "part1-topic-summary-ae",
      group: "第1部 · 文法形式整理",
      eyebrow: "阶段复习",
      title: "专项 A—E 总结",
      modules: makeModules([], [84, 85], [], [177, 178]),
    },
    {
      id: "part1-topic-summary-aj",
      group: "第1部 · 文法形式整理",
      eyebrow: "综合复习",
      title: "专项 A—J 总结",
      modules: makeModules([], [112, 113], [], [180, 181]),
    },
  );

  p2Titles.forEach((title, index) => {
    const firstPage = 116 + index * 2;
    units.push({
      id: "part2-lesson-" + (index + 1),
      group: "第2部 · 句子的语法2",
      eyebrow: "第 " + (index + 1) + " 课",
      title,
      modules: makeModules([firstPage], [firstPage + 1], [], [182, 183, 184, 185]),
    });
  });
  units.push({
    id: "part2-summary",
    group: "第2部 · 句子的语法2",
    eyebrow: "综合复习",
    title: "第1—4课总结",
    modules: makeModules([], [124, 125], [], [182, 183, 184, 185]),
  });

  p3Data.forEach(([title, grammar, practice, answers], index) => {
    units.push({
      id: "part3-lesson-" + (index + 1),
      group: "第3部 · 文章的语法",
      eyebrow: "第 " + (index + 1) + " 课",
      title,
      modules: makeModules(grammar, practice, [], answers),
    });
  });

  const p3Summaries: Array<[string, string, number[], number[]]> = [
    ["part3-summary-12", "第1・2课总结", [132, 133], [186]],
    ["part3-summary-34", "第3・4课总结", [138, 139], [187, 188]],
    ["part3-summary-56", "第5・6课总结", [144, 145], [189]],
    ["part3-summary-78", "第7・8课总结", [150, 151], [190]],
    ["part3-summary-910", "第9・10课总结", [156, 157], [192]],
  ];
  p3Summaries.forEach(([id, title, practice, answers]) => {
    units.push({
      id,
      group: "第3部 · 文章的语法",
      eyebrow: "阶段复习",
      title,
      modules: makeModules([], practice, [], answers),
    });
  });

  units.push(
    {
      id: "mock-test-1",
      group: "模拟试验",
      eyebrow: "第 1 回",
      title: "N3 语法模拟试验",
      modules: makeModules([], [160, 161, 162, 163], [], [193, 194, 195]),
    },
    {
      id: "mock-test-2",
      group: "模拟试验",
      eyebrow: "第 2 回",
      title: "N3 语法模拟试验",
      modules: makeModules([], [164, 165, 166, 167], [], [196, 197, 198, 199]),
    },
  );

  return units;
}

function parsePages(markdown: string): Map<number, PageSection> {
  const pages = new Map<number, PageSection>();
  let current: PageSection | null = null;

  for (const line of markdown.split(/\r?\n/)) {
    const heading = line.match(/^### PDF 第(\d+)页(?: \/ 书内第(\d+)页)?：(.*)$/);
    if (heading) {
      if (current) pages.set(current.pdfPage, current);
      current = {
        pdfPage: Number(heading[1]),
        bookPage: heading[2] ? Number(heading[2]) : undefined,
        title: heading[3].trim(),
        lines: [],
      };
      continue;
    }
    if (current) current.lines.push(line);
  }
  if (current) pages.set(current.pdfPage, current);
  return pages;
}

function InlineText({ text }: { text: string }) {
  const clean = text.replace(/\s{2}$/, "");
  const pattern = /(\*\*.+?\*\*|「[^」]+」)/g;
  const parts = clean.split(pattern).filter(Boolean);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={index}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("「") && part.endsWith("」")) {
          return <span className="jp-token" key={index}>{part}</span>;
        }
        return <Fragment key={index}>{part}</Fragment>;
      })}
    </>
  );
}

function MarkdownPage({
  page,
  activeAudioKey,
  activeVideoKey,
  useInlinePlayer,
  onToggleAudio,
  onToggleVideo,
}: {
  page: PageSection;
  activeAudioKey: string | null;
  activeVideoKey: string | null;
  useInlinePlayer: boolean;
  onToggleAudio: (key: string, cue: GrammarAudioCue, label: string) => void;
  onToggleVideo: (key: string, cue: GrammarAudioCue, label: string) => void;
}) {
  return (
    <section className="page-card">
      <header className="page-meta">
        <span>PDF {page.pdfPage}</span>
        {page.bookPage && <span>书内 {page.bookPage}</span>}
      </header>
      <h2>{page.title}</h2>
      <div className="page-body">
        {page.lines.map((line, index) => {
          const trimmed = line.trim();
          if (!trimmed) return <div className="line-space" key={index} />;
          if (trimmed === "---") return <hr key={index} />;
          if (/^\|[\s|:-]+\|$/.test(trimmed)) return null;
          if (trimmed.startsWith("|")) {
            const cells = trimmed.split("|").slice(1, -1).map((cell) => cell.trim());
            return (
              <div className="table-row" key={index}>
                {cells.map((cell, cellIndex) => <span key={cellIndex}><InlineText text={cell} /></span>)}
              </div>
            );
          }
          if (trimmed.startsWith("#### ")) {
            const heading = trimmed.slice(5);
            const cueKey = grammarAudioCueKey(page.pdfPage, heading);
            const cue = grammarAudioCues[cueKey];
            const isAudioPlaying = activeAudioKey === cueKey;
            const isVideoOpen = activeVideoKey === cueKey;
            const showInlinePlayer = useInlinePlayer ? isAudioPlaying : isVideoOpen;
            const video = cue ? videoParts.get(cue.videoPage) : undefined;
            return (
              <div className="grammar-heading-block" key={index}>
                <div className="grammar-heading">
                  <h3><InlineText text={heading} /></h3>
                  <div className="grammar-media-actions">
                    <button
                      type="button"
                      className={"grammar-audio-button " + (isAudioPlaying ? "is-playing" : "")}
                      disabled={!cue}
                      onClick={() => cue && onToggleAudio(cueKey, cue, heading)}
                      title={cue
                        ? cue.kind === "section"
                          ? "老师将相近语法放在同一段讲解；此时间点建议后续复核"
                          : cue.kind === "review"
                            ? "这一项的转写不够清楚，已保留当前最佳切点并标记待复核"
                            : `播放周业繁 P${cue.videoPage} ${formatTimestamp(cue.start)} 起的讲解`
                        : "配套视频未提供这一专项的讲解"}
                      aria-label={cue ? `${isAudioPlaying ? "停止" : "播放"}${heading}的讲解` : `${heading}暂无配套讲解`}
                    >
                      <span aria-hidden="true">{isAudioPlaying ? "■" : "▶"}</span>
                      {cue ? isAudioPlaying ? useInlinePlayer ? "收起播放器" : "停止" : cue.kind === "section" ? "听本组讲解" : cue.kind === "review" ? "听讲解 · 待复核" : "听讲解" : "暂无讲解"}
                    </button>
                    {!useInlinePlayer && (
                      <button
                        type="button"
                        className={"grammar-video-button " + (isVideoOpen ? "is-open" : "")}
                        disabled={!cue}
                        onClick={() => cue && onToggleVideo(cueKey, cue, heading)}
                        title={cue ? "展开对应时间点的视频，查看老师板书" : "暂无配套讲解视频"}
                        aria-label={cue ? `${isVideoOpen ? "收起" : "查看"}${heading}的老师板书` : `${heading}暂无配套板书`}
                      >
                        <span aria-hidden="true">{isVideoOpen ? "■" : "▣"}</span>
                        {cue ? isVideoOpen ? "收起板书" : "看板书" : "暂无板书"}
                      </button>
                    )}
                  </div>
                </div>
                {showInlinePlayer && cue && video && (
                  <section className="mobile-audio-panel" aria-label={`${heading}的讲解播放器`}>
                    <header>
                      <div>
                        <small>{useInlinePlayer ? "手机／平板播放" : "电脑端板书"} · P{video.page} {formatTimestamp(cue.start)}</small>
                        <b>{heading}</b>
                      </div>
                      <button type="button" onClick={() => useInlinePlayer ? onToggleAudio(cueKey, cue, heading) : onToggleVideo(cueKey, cue, heading)} aria-label="收起讲解播放器">收起</button>
                    </header>
                    <div className="mobile-audio-frame">
                      <iframe
                        src={mobilePlayerUrl(video, cue.start)}
                        title={`周业繁讲解：${heading}`}
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                        referrerPolicy="strict-origin-when-cross-origin"
                      />
                    </div>
                    <footer>
                      <span>请在播放器内点击 ▶，将从本条语法的讲解位置开始。</span>
                      <a href={bilibiliUrl(video)} target="_blank" rel="noreferrer">在B站打开 ↗</a>
                    </footer>
                  </section>
                )}
              </div>
            );
          }
          if (trimmed.startsWith(">")) {
            return <aside className="editor-note" key={index}><InlineText text={trimmed.replace(/^>\s*/, "")} /></aside>;
          }
          if (/^[-*]\s+/.test(trimmed)) {
            return <div className="bullet-line" key={index}><span>•</span><p><InlineText text={trimmed.replace(/^[-*]\s+/, "")} /></p></div>;
          }
          if (/^\d+[.．]\s*/.test(trimmed)) {
            const match = trimmed.match(/^(\d+)[.．]\s*(.*)$/)!;
            return <div className="question-line" key={index}><span>{match[1]}</span><p><InlineText text={match[2]} /></p></div>;
          }
          const tagged = trimmed.match(/^(【(?:解析|译文|接续|意思|注意|说明)】)(.*)$/);
          if (tagged) {
            return <p className="tagged-line" key={index}><b>{tagged[1]}</b><InlineText text={tagged[2]} /></p>;
          }
          if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
            return <p className="instruction" key={index}><InlineText text={trimmed} /></p>;
          }
          return <p key={index}><InlineText text={trimmed} /></p>;
        })}
      </div>
    </section>
  );
}

export default function GrammarReader() {
  const units = useMemo(() => createUnits(), []);
  const [pages, setPages] = useState<Map<number, PageSection>>(new Map());
  const [loadError, setLoadError] = useState("");
  const [selectedId, setSelectedId] = useState(units[1].id);
  const [activeModule, setActiveModule] = useState<ModuleKey>("grammar");
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [fontScale, setFontScale] = useState(1);
  const [dark, setDark] = useState(false);
  const [activeVideoPage, setActiveVideoPage] = useState<number | null>(null);
  const [activeAudio, setActiveAudio] = useState<ActiveAudio | null>(null);
  const [activeInlineVideo, setActiveInlineVideo] = useState<ActiveAudio | null>(null);

  const [useInlinePlayer, setUseInlinePlayer] = useState(false);

  useEffect(() => {
    const coarsePointer = window.matchMedia("(pointer: coarse)");
    const updatePlaybackMode = () => {
      setUseInlinePlayer(coarsePointer.matches || navigator.maxTouchPoints > 1);
    };

    updatePlaybackMode();
    coarsePointer.addEventListener("change", updatePlaybackMode);
    return () => coarsePointer.removeEventListener("change", updatePlaybackMode);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const restoreFrame = window.requestAnimationFrame(() => {
      const storedUnit = localStorage.getItem("n3-current-unit");
      const storedDone = localStorage.getItem("n3-completed");
      const storedTheme = localStorage.getItem("n3-theme");
      if (storedUnit && units.some((unit) => unit.id === storedUnit)) setSelectedId(storedUnit);
      if (storedDone) {
        try {
          setCompleted(new Set(JSON.parse(storedDone) as string[]));
        } catch {
          localStorage.removeItem("n3-completed");
        }
      }
      if (storedTheme === "dark") setDark(true);
    });

    const contentUrl = new URL("content.md", new URL(".", window.location.href));
    fetch(contentUrl, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.text();
      })
      .then((text) => setPages(parsePages(text)))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setLoadError("学习内容没有加载成功，请刷新页面重试。");
        }
      });

    return () => {
      window.cancelAnimationFrame(restoreFrame);
      controller.abort();
    };
  }, [units]);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("n3-theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    if (!activeAudio || useInlinePlayer) return;
    const instance = activeAudio.instance;
    const remaining = Math.max(1, activeAudio.cue.end - activeAudio.cue.start) * 1000;
    const timeout = window.setTimeout(() => {
      setActiveAudio((current) => current?.instance === instance ? null : current);
    }, remaining);
    return () => window.clearTimeout(timeout);
  }, [activeAudio, useInlinePlayer]);

  const selected = units.find((unit) => unit.id === selectedId) ?? units[0];
  const currentModule = selected.modules.find((item) => item.key === activeModule) ?? selected.modules[0];
  const lessonVideos = (videoPagesByUnit[selected.id] ?? [])
    .map((page) => videoParts.get(page))
    .filter(Boolean) as VideoPart[];
  const activeVideo = lessonVideos.find((video) => video.page === activeVideoPage) ?? lessonVideos[0];

  const unitText = useCallback((unit: UnitDef) => unit.modules
    .flatMap((module) => module.pages)
    .map((pageNumber) => pages.get(pageNumber))
    .filter(Boolean)
    .map((page) => page!.title + "\n" + page!.lines.join("\n"))
    .join("\n"), [pages]);

  const filteredUnits = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return units;
    return units.filter((unit) => (unit.eyebrow + " " + unit.title + " " + unitText(unit)).toLowerCase().includes(term));
  }, [query, unitText, units]);

  const groupedUnits = useMemo(() => {
    const groups = new Map<string, UnitDef[]>();
    filteredUnits.forEach((unit) => groups.set(unit.group, [...(groups.get(unit.group) ?? []), unit]));
    return groups;
  }, [filteredUnits]);

  function selectUnit(unit: UnitDef) {
    setSelectedId(unit.id);
    setActiveModule(unit.modules[0].key);
    setActiveVideoPage(null);
    setActiveAudio(null);
    setActiveInlineVideo(null);
    setDrawerOpen(false);
    localStorage.setItem("n3-current-unit", unit.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleGrammarAudio(key: string, cue: GrammarAudioCue, label: string) {
    setActiveInlineVideo(null);
    setActiveAudio((current) => current?.key === key
      ? null
      : { key, cue, label, instance: Date.now() });
  }

  function toggleGrammarVideo(key: string, cue: GrammarAudioCue, label: string) {
    setActiveAudio(null);
    setActiveInlineVideo((current) => current?.key === key
      ? null
      : { key, cue, label, instance: Date.now() });
  }

  function toggleComplete() {
    setCompleted((previous) => {
      const next = new Set(previous);
      if (next.has(selected.id)) next.delete(selected.id);
      else next.add(selected.id);
      localStorage.setItem("n3-completed", JSON.stringify([...next]));
      return next;
    });
  }

  const progress = Math.round((completed.size / units.length) * 100);
  const modulePages = currentModule.pages.map((pageNumber) => pages.get(pageNumber)).filter(Boolean) as PageSection[];

  return (
    <div className="reader-shell" style={{ "--reader-scale": fontScale } as React.CSSProperties}>
      <header className="mobile-bar">
        <button className="icon-button" onClick={() => setDrawerOpen(true)} aria-label="打开课程目录">☰</button>
        <div><b>N3 文法研修室</b><span>{selected.eyebrow}</span></div>
        <button className="icon-button" onClick={() => setDark((value) => !value)} aria-label="切换明暗主题">{dark ? "☀" : "☾"}</button>
      </header>

      {drawerOpen && <button className="drawer-scrim" onClick={() => setDrawerOpen(false)} aria-label="关闭课程目录" />}

      <aside className={"sidebar " + (drawerOpen ? "is-open" : "")}>
        <div className="brand-block">
          <button className="close-drawer" onClick={() => setDrawerOpen(false)} aria-label="关闭课程目录">×</button>
          <p className="kicker">新完全掌握 · N3</p>
          <h1>文法研修室</h1>
          <p>按课学习，随时接着上次的进度。</p>
        </div>

        <label className="search-box">
          <span>⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索语法或例句" />
          {query && <button onClick={() => setQuery("")} aria-label="清除搜索">×</button>}
        </label>

        <div className="progress-card">
          <div><span>学习进度</span><b>{progress}%</b></div>
          <div className="progress-track"><i style={{ width: progress + "%" }} /></div>
          <small>{completed.size} / {units.length} 个学习单元</small>
        </div>

        <nav className="course-nav" aria-label="课程目录">
          {[...groupedUnits.entries()].map(([group, groupUnits]) => (
            <section key={group}>
              <h2>{group}</h2>
              {groupUnits.map((unit) => (
                <button className={unit.id === selected.id ? "active" : ""} key={unit.id} onClick={() => selectUnit(unit)}>
                  <span className={(completed.has(unit.id) ? "done " : "") + "unit-mark"}>{completed.has(unit.id) ? "✓" : ""}</span>
                  <span><small>{unit.eyebrow}</small>{unit.title}</span>
                </button>
              ))}
            </section>
          ))}
          {filteredUnits.length === 0 && <p className="empty-search">没有找到相关内容。</p>}
        </nav>
      </aside>

      <main className="reader-main">
        <div className="reader-toolbar">
          <div className="breadcrumb"><span>{selected.group}</span><b>／</b><span>{selected.eyebrow}</span></div>
          <div className="toolbar-actions">
            <div className="font-control" aria-label="字号调整">
              <button onClick={() => setFontScale((value) => Math.max(.88, value - .08))}>A−</button>
              <button onClick={() => setFontScale(1)}>A</button>
              <button onClick={() => setFontScale((value) => Math.min(1.24, value + .08))}>A＋</button>
            </div>
            <button className="theme-button" onClick={() => setDark((value) => !value)}>{dark ? "浅色" : "夜读"}</button>
          </div>
        </div>

        <article className="lesson-wrap">
          <header className="lesson-hero">
            <div>
              <p>{selected.eyebrow}</p>
              <h1>{selected.title}</h1>
              <span>{selected.modules.map((module) => module.label).join(" · ")}</span>
            </div>
            <button className={"complete-button " + (completed.has(selected.id) ? "completed" : "")} onClick={toggleComplete}>
              {completed.has(selected.id) ? "✓ 已学完" : "标记为已学完"}
            </button>
          </header>

          {activeVideo && (
            <section className="video-study" aria-labelledby="video-study-title">
              <div className="video-study-head">
                <div>
                  <span className="video-badge">配套视频课</span>
                  <h2 id="video-study-title">周业繁 · N3语法课程</h2>
                  <p>当前课程已匹配到 B 站原视频，可边看讲解边核对下方教材内容。</p>
                </div>
                <a href={bilibiliUrl(activeVideo)} target="_blank" rel="noreferrer">在 B 站打开 ↗</a>
              </div>

              {lessonVideos.length > 1 && (
                <div className="video-parts" aria-label="视频分集">
                  {lessonVideos.map((video) => (
                    <button
                      className={video.page === activeVideo.page ? "active" : ""}
                      key={video.page}
                      onClick={() => {
                        setActiveAudio(null);
                        setActiveInlineVideo(null);
                        setActiveVideoPage(video.page);
                      }}
                    >
                      <b>P{video.page}</b>
                      <span>{video.title}</span>
                      <small>{formatDuration(video.duration)}</small>
                    </button>
                  ))}
                </div>
              )}

              <div className="video-frame">
                <iframe
                  key={activeVideo.page}
                  src={playerUrl(activeVideo)}
                  title={`周业繁 N3语法课程 P${activeVideo.page}：${activeVideo.title}`}
                  loading="lazy"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>

              <div className="video-caption">
                <span><b>P{activeVideo.page}</b>{activeVideo.title}</span>
                <small>{formatDuration(activeVideo.duration)} · 默认关闭自动播放与弹幕</small>
              </div>
            </section>
          )}

          <div className="module-tabs" role="tablist" aria-label="课程模块">
            {selected.modules.map((module) => (
              <button
                role="tab"
                aria-selected={currentModule.key === module.key}
                className={currentModule.key === module.key ? "active" : ""}
                key={module.key}
                onClick={() => setActiveModule(module.key)}
              >
                {module.label}<span>{module.pages.length}</span>
              </button>
            ))}
          </div>

          {loadError && <div className="status-card error">{loadError}</div>}
          {!loadError && pages.size === 0 && <div className="status-card"><span className="loading-dot" />正在整理课程内容…</div>}
          {pages.size > 0 && modulePages.length === 0 && <div className="status-card">本模块暂无内容。</div>}
          {modulePages.map((page) => (
            <MarkdownPage
              page={page}
              key={page.pdfPage}
              activeAudioKey={activeAudio?.key ?? null}
              activeVideoKey={activeInlineVideo?.key ?? null}
              useInlinePlayer={useInlinePlayer}
              onToggleAudio={toggleGrammarAudio}
              onToggleVideo={toggleGrammarVideo}
            />
          ))}

          {pages.size > 0 && (
            <footer className="lesson-footer">
              <button disabled={units.indexOf(selected) === 0} onClick={() => selectUnit(units[units.indexOf(selected) - 1])}>← 上一单元</button>
              <span>仅供个人学习 · 进度保存在当前设备 · 公开发布前请确认内容授权</span>
              <button disabled={units.indexOf(selected) === units.length - 1} onClick={() => selectUnit(units[units.indexOf(selected) + 1])}>下一单元 →</button>
            </footer>
          )}
        </article>
      </main>

      {activeAudio && !useInlinePlayer && (() => {
        const video = videoParts.get(activeAudio.cue.videoPage);
        if (!video) return null;
        return (
          <>
            <iframe
              className="audio-engine"
              key={activeAudio.instance}
              src={audioPlayerUrl(video, activeAudio.cue.start)}
              title={`周业繁讲解音频：${activeAudio.label}`}
              allow="autoplay"
              referrerPolicy="strict-origin-when-cross-origin"
            />
            <div className="audio-now-playing" role="status" aria-live="polite">
              <span className="audio-pulse" aria-hidden="true"><i /><i /><i /></span>
              <span className="audio-now-copy">
                <small>正在播放 · P{video.page} {formatTimestamp(activeAudio.cue.start)}</small>
                <b>{activeAudio.label}</b>
              </span>
              {activeAudio.cue.kind === "section" && <em>整组讲解 · 待复核</em>}
              {activeAudio.cue.kind === "review" && <em>切点 · 待复核</em>}
              <button type="button" onClick={() => setActiveAudio(null)} aria-label="停止讲解音频">■ 停止</button>
            </div>
          </>
        );
      })()}
    </div>
  );
}

