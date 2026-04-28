import type { ChapterFormattingPreferences } from "../../modules/chapters/chapter-formatting.service";

export type DocExportInput = {
  title: string;
  body: string;
  preferences: ChapterFormattingPreferences;
};

export type DocExportPayload = {
  fileName: string;
  contentType: string;
  body: string;
};

const WORD_COMPATIBLE_DOC_MIME = "application/msword; charset=utf-8";

export function sanitizeDocFileName(title: string): string {
  const normalizedTitle = title
    .trim()
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);

  return `${normalizedTitle.length > 0 ? normalizedTitle : "chapter"}.doc`;
}

export function createDocExportPayload(input: DocExportInput): DocExportPayload {
  const safeTitle = escapeHtml(input.title);
  const safeBody = input.body
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("\n");

  return {
    fileName: sanitizeDocFileName(input.title),
    contentType: WORD_COMPATIBLE_DOC_MIME,
    body: `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${safeTitle}</title>
  <style>
    body {
      font-family: ${input.preferences.fontFamily}, serif;
      font-size: ${input.preferences.fontSize}px;
      line-height: ${input.preferences.lineHeight};
      color: #111827;
    }
    h1 {
      font-size: ${Math.round(input.preferences.fontSize * 1.6)}px;
      margin-bottom: 24px;
    }
    p {
      margin: 0 0 16px;
    }
  </style>
</head>
<body>
  <h1>${safeTitle}</h1>
  ${safeBody.length > 0 ? safeBody : "<p></p>"}
</body>
</html>`
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
