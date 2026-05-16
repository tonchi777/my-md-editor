export function generateHtmlExport(
  html: string,
  title: string,
  isDark: boolean,
  customCss = ""
): string {
  const bg = isDark ? "#1e1e1e" : "#ffffff";
  const text = isDark ? "#d4d4d4" : "#1a1a1a";
  const textMuted = isDark ? "#8b8b8b" : "#6b6b6b";
  const border = isDark ? "#3c3c3c" : "#e0e0e0";
  const bgSecondary = isDark ? "#252526" : "#f5f5f5";
  const accent = isDark ? "#4fc3f7" : "#0066cc";
  const codeBg = isDark ? "#0d1117" : "#f6f8fa";
  const codeColor = isDark ? "#c9d1d9" : "#24292e";
  const mono = '"Cascadia Code","JetBrains Mono","Fira Code",Consolas,monospace';
  const prose = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif';

  const hljsComment  = isDark ? "#8b949e" : "#6a737d";
  const hljsKeyword  = isDark ? "#ff7b72" : "#d73a49";
  const hljsNumber   = isDark ? "#79c0ff" : "#005cc5";
  const hljsString   = isDark ? "#a5d6ff" : "#032f62";
  const hljsBuiltin  = isDark ? "#d2a8ff" : "#6f42c1";
  const hljsVar      = isDark ? "#ffa657" : "#e36209";
  const hljsTag      = isDark ? "#7ee787" : "#22863a";

  const css = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:${prose};line-height:1.7;font-size:16px;max-width:800px;margin:0 auto;padding:40px 32px;background:${bg};color:${text}}
h1,h2,h3,h4,h5,h6{margin:1.5em 0 0.5em;line-height:1.3;font-weight:600;color:${text}}
h1{font-size:2em;border-bottom:1px solid ${border};padding-bottom:.3em;margin-top:.5em}
h2{font-size:1.5em;border-bottom:1px solid ${border};padding-bottom:.2em}
h3{font-size:1.25em}h4{font-size:1.1em}
p{margin:.8em 0}
a{color:${accent};text-decoration:none}a:hover{text-decoration:underline}
ul,ol{margin:.8em 0;padding-left:2em}li{margin:.3em 0}
blockquote{border-left:4px solid ${border};padding:.5em 1em;margin:1em 0;color:${textMuted};font-style:italic}
code{font-family:${mono};font-size:.875em;background:${bgSecondary};padding:.15em .4em;border-radius:3px}
pre{margin:1em 0;border-radius:6px;overflow:auto}
pre code{background:none;padding:0;font-size:.875em;line-height:1.6;border-radius:0}
table{border-collapse:collapse;margin:1em 0;width:100%;font-size:.95em}
th,td{border:1px solid ${border};padding:.5em .75em;text-align:left}
th{background:${bgSecondary};font-weight:600}
img{max-width:100%;height:auto}
hr{border:none;border-top:1px solid ${border};margin:1.5em 0}
.hljs{display:block;overflow-x:auto;padding:1em 1.2em;background:${codeBg};color:${codeColor};border-radius:6px}
.hljs-comment,.hljs-quote{color:${hljsComment};font-style:italic}
.hljs-keyword,.hljs-selector-tag,.hljs-deletion{color:${hljsKeyword};font-weight:bold}
.hljs-number,.hljs-literal{color:${hljsNumber}}
.hljs-string,.hljs-addition{color:${hljsString}}
.hljs-title,.hljs-title.class_,.hljs-title.function_,.hljs-built_in{color:${hljsBuiltin}}
.hljs-variable,.hljs-attr,.hljs-attribute{color:${hljsVar}}
.hljs-type,.hljs-class{color:${hljsBuiltin}}
.hljs-tag,.hljs-name{color:${hljsTag}}
${customCss}`.trim();

  const safeTitle = title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>
  <style>${css}</style>
</head>
<body>
${html}
</body>
</html>`;
}
