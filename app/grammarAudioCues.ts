export type GrammarAudioCue = {
  videoPage: number;
  start: number;
  end: number;
  kind?: "section" | "review";
};

const cue = (
  videoPage: number,
  start: number,
  end: number,
  kind?: "section" | "review",
): GrammarAudioCue => ({ videoPage, start, end, ...(kind ? { kind } : {}) });

// The keys are `${PDF page}:${grammar number}`. Timestamps were aligned against
// a word-level local speech-to-text pass of the linked Bilibili course. A
// `section` cue is intentionally broader because the teacher explains several
// printed headings together. A `review` cue covers one heading whose boundary
// is still obscured by unclear audio or an unreliable word alignment.
export const grammarAudioCues: Record<string, GrammarAudioCue> = {
  "22:1": cue(1, 172, 660.5),
  "22:2": cue(1, 661.5, 932.6),
  "23:3": cue(1, 933.6, 1123.5),
  "23:4": cue(1, 1124.5, 1475),

  "24:1": cue(2, 18.5, 301.5),
  "24:2": cue(2, 313.5, 468),
  "24:3": cue(2, 469, 932.5),
  "25:4": cue(2, 933.5, 1237.3),
  "25:5": cue(2, 1238.3, 1391.7),

  "28:1": cue(3, 14.5, 561.6),
  "28:2": cue(3, 562.6, 868.6),
  "29:3": cue(3, 869.6, 1188.7),
  "29:4": cue(3, 1189.7, 1311),

  "30:1": cue(4, 14.8, 196.2),
  "30:2": cue(4, 197.2, 303, "section"),
  "30:3": cue(4, 304, 428.2, "section"),
  "31:4": cue(4, 429.2, 514.7, "section"),
  "31:5": cue(4, 515.7, 789.9, "review"),

  "36:1": cue(5, 52.5, 659.2),
  "36:2": cue(5, 660.2, 1251.4),
  "36:3": cue(5, 1252.4, 1380.7),
  "37:4": cue(5, 1381.7, 1493.4),
  "37:5": cue(5, 1494.4, 1589),

  "38:1": cue(6, 19.5, 179.1),
  "38:2": cue(6, 180.1, 351.7, "section"),
  "38:3": cue(6, 352.7, 540.6),
  "39:4": cue(6, 541.6, 728.2),
  "39:5": cue(6, 729.2, 947),

  "42:1": cue(7, 212, 614.6),
  "42:2": cue(7, 615.6, 783),
  "43:3": cue(8, 8.7, 225.7),
  "43:4": cue(8, 226.7, 605.9),
  "43:5": cue(8, 606.9, 1038),

  "44:1": cue(9, 20.6, 264.2),
  "44:2": cue(9, 265.2, 493),
  "44:3": cue(10, 7.5, 389.8),
  "45:4": cue(10, 390.8, 493),
  "45:5": cue(10, 494, 664),

  "50:1": cue(12, 18, 881),
  "50:2": cue(13, 6.9, 593.1),
  "51:3": cue(13, 594.1, 858),

  "52:1": cue(14, 3.6, 451.7),
  "52:2": cue(14, 452.7, 559),
  "53:3": cue(15, 8, 957.9),
  "53:4": cue(15, 962.4, 1052),

  "56:1": cue(17, 10.4, 161.2),
  "56:2": cue(17, 162.2, 368),
  "57:3": cue(18, 4.3, 281.2),
  "57:4": cue(18, 282.2, 445),

  "58:1": cue(19, 3.1, 774, "section"),
  "58:2": cue(20, 0.7, 305.7, "section"),
  "59:2": cue(20, 0.7, 305.7, "section"),
  "59:3": cue(20, 306.7, 374.9, "section"),
  "59:4": cue(20, 375.9, 438, "section"),

  "68:1": cue(24, 15.2, 88.1),
  "68:2": cue(24, 89.1, 286.2),
  "68:3": cue(24, 287.2, 441.6, "section"),
  "69:3": cue(24, 442.6, 496.6, "section"),
  "69:4": cue(24, 497.6, 578, "section"),
  "69:5": cue(24, 586.3, 648),

  "76:1": cue(28, 24, 368.1),
  "76:2": cue(28, 369.1, 818.6, "review"),
  "77:3": cue(28, 819.6, 1018),
  "77:4": cue(28, 1019, 1079, "section"),

  "80:1": cue(29, 18.8, 267.4),
  "80:2": cue(29, 268.4, 587.7),
  "81:3": cue(29, 588.7, 756.9),

  "86:1": cue(30, 21.4, 157.7),
  "86:2": cue(30, 158.7, 285.8),
  "86:3": cue(30, 286.8, 393.2, "section"),
  "87:3": cue(30, 286.8, 393.2, "section"),
  "87:4": cue(30, 394.2, 448.8),
  "87:5": cue(30, 449.8, 855, "section"),

  "96:1": cue(31, 171.8, 827.7, "section"),
  "97:1": cue(31, 171.8, 827.7, "section"),
  "97:2": cue(31, 828.7, 860, "section"),
  "97:3": cue(31, 861, 956.9),

  "116:1": cue(34, 19, 72.9, "section"),
  "116:2": cue(34, 73.9, 118.5, "section"),
  "116:3": cue(34, 119.5, 148.4, "section"),
  "116:4": cue(34, 149.4, 197.4, "section"),
  "118:1": cue(34, 198.4, 241.6, "section"),
  "118:2": cue(34, 242.6, 269.9, "section"),
  "118:3": cue(34, 270.9, 297.4, "section"),
  "118:4": cue(34, 298.4, 351.5, "section"),
  "118:5": cue(34, 352.5, 406.1, "section"),
  "120:1": cue(34, 407.1, 426.5, "section"),
  "120:2": cue(34, 427.5, 444.1, "section"),
  "120:3": cue(34, 445.1, 458.8, "section"),
  "120:4": cue(34, 459.8, 487.7, "section"),
  "120:5": cue(34, 488.7, 514.6, "section"),
  "122:1": cue(34, 515.6, 647.6, "section"),
  "122:2": cue(34, 515.6, 647.6, "section"),
  "122:3": cue(34, 515.6, 647.6, "section"),
  "122:4": cue(34, 515.6, 647.6, "section"),
  "122:5": cue(34, 515.6, 647.6, "section"),
  "122:6": cue(34, 515.6, 647.6, "section"),
  "122:7": cue(34, 515.6, 647.6, "section"),
  "123:8": cue(34, 515.6, 647.6, "section"),
};

export function grammarAudioCueKey(pdfPage: number, heading: string) {
  const number = heading.match(/^(\d+)[\s\u3000]/)?.[1];
  return number ? `${pdfPage}:${number}` : "";
}
