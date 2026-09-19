// Opera AI — designed & engineered by Gry KJ
// Turns workspace files into a self-contained HTML document for the live preview,
// and parses the agent's multi-file output.

type FileLike = { path: string; content: string };

export const SITE_ROOT = "site/";

export function parseAgentFiles(output: string): FileLike[] {
  const re = /=== FILE: (.+?) ===\n([\s\S]*?)\n?=== END ===/g;
  const files: FileLike[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(output))) {
    const path = m[1].trim().replace(/^\/+/, "");
    if (!path || path.includes("..")) continue;
    files.push({ path, content: m[2] });
  }
  return files;
}

export function hasSite(files: FileLike[]) {
  return files.some((f) => f.path === `${SITE_ROOT}index.html`);
}

export function buildSiteHtml(files: FileLike[]): string | null {
  const index = files.find((f) => f.path === `${SITE_ROOT}index.html`);
  if (!index) return null;
  const lookup = (rel: string) => {
    const clean = rel.replace(/^\.?\//, "").split("?")[0];
    return files.find((f) => f.path === `${SITE_ROOT}${clean}`)?.content;
  };
  let html = index.content;
  html = html.replace(/<link\b[^>]*href=["']([^"']+)["'][^>]*>/gi, (tag, href: string) => {
    if (!/rel=["']stylesheet["']/i.test(tag) || /^https?:/i.test(href)) return tag;
    const css = lookup(href);
    return css !== undefined ? `<style>\n${css}\n</style>` : tag;
  });
  html = html.replace(/<script\b([^>]*)src=["']([^"']+)["']([^>]*)><\/script>/gi, (tag, pre: string, src: string, post: string) => {
    if (/^https?:/i.test(src)) return tag;
    const js = lookup(src);
    const attrs = `${pre} ${post}`.replace(/\s+/g, " ").trim();
    return js !== undefined ? `<script ${attrs}>\n${js}\n</script>` : tag;
  });
  return html;
}
