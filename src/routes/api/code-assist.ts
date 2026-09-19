import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { z } from "zod";

const bodySchema = z.object({
  action: z.enum(["explain", "refactor", "fix", "ask", "build"]),
  code: z.string().max(60_000),
  filename: z.string().max(200),
  language: z.string().max(40),
  instruction: z.string().max(4000).optional(),
  terminal: z.string().max(8000).optional(),
  // Agent mode: the whole project so the agent can create / edit several files at once.
  project: z.array(z.object({ path: z.string().max(200), content: z.string().max(40_000) })).max(40).optional(),
});

const ACTION_PROMPTS: Record<z.infer<typeof bodySchema>["action"], string> = {
  explain:
    "Explain this code line-by-line (group trivial lines). Start with a one-paragraph summary, then a numbered breakdown. Keep it tight.",
  refactor:
    "Refactor this code for readability, performance and idiomatic style without changing behaviour. Return the FULL refactored file in one fenced code block first, then a short bullet list of what changed.",
  fix: "Find bugs and syntax errors (use the terminal output if provided). Return the FULL fixed file in one fenced code block first, then a short list of the fixes.",
  ask: "Answer the developer's question about this code. Be concrete and show code when useful.",
  build: [
    "You are an autonomous web-building agent (like a mini Lovable). The developer describes a website or a change; you create or edit the project files.",
    "The project is a static site previewed in the browser: use plain HTML, CSS and JavaScript only (no build tools, no npm packages, no frameworks). The entry point MUST be `site/index.html`. Put styles in `site/style.css` and scripts in `site/app.js` and reference them with relative paths (`style.css`, `app.js`). Make it beautiful, responsive and complete.",
    "OUTPUT FORMAT (strict): first one short sentence describing what you built. Then, for every file you create or fully rewrite, output exactly:",
    "=== FILE: <path> ===",
    "<full file content>",
    "=== END ===",
    "Always output the FULL content of each file (never diffs, never placeholders like '...rest unchanged'). Only include files that change. Do not wrap the blocks in markdown fences.",
  ].join("\n"),
};

export const Route = createFileRoute("/api/code-assist")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = bodySchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return new Response("Invalid request", { status: 400 });
        const { action, code, filename, language, instruction, terminal, project } = parsed.data;

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey: key,
          headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
        });

        const prompt =
          action === "build"
            ? [
                "Current project files:",
                ...(project?.length
                  ? project.map((f) => `=== FILE: ${f.path} ===\n${f.content}\n=== END ===`)
                  : ["(empty project)"]),
                `\nDeveloper request: ${instruction ?? ""}`,
              ].join("\n")
            : [
                `File: ${filename} (${language})`,
                "```" + language.toLowerCase(),
                code,
                "```",
                terminal ? `\nTerminal output:\n\`\`\`\n${terminal}\n\`\`\`` : "",
                instruction ? `\nDeveloper instruction: ${instruction}` : "",
              ].join("\n");

        const result = streamText({
          model: gateway.chat("google/gemini-3.8-flash"),
          system: `You are Opera AI's coding assistant inside a cloud IDE. Reply in the same language the developer writes in (Arabic or English), but keep code and identifiers in English. Use Markdown with fenced code blocks tagged with the language. ${ACTION_PROMPTS[action]}`,
          prompt,
          abortSignal: request.signal,
        });

        return result.toTextStreamResponse();
      },
    },
  },
});
