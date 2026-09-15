/**
 * Talk to the bot from the terminal, against the fixture store.
 *
 *   npm run chat
 *
 * No Shopify, no database, no browser. This is where persona work happens —
 * tuning the prompt through a theme editor and a tunnel is miserable.
 */

import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import type Anthropic from "@anthropic-ai/sdk";
import { runTurn } from "../src/agent/pipeline.js";
import { createCatalog, createProvider } from "../src/factory.js";

const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

async function main(): Promise<void> {
  const provider = createProvider();
  const catalog = createCatalog();
  const profile = await catalog.getProfile();
  const settings = await catalog.getSettings();

  console.log(`${BOLD}${profile.shopName}${RESET} — chatting with ${settings.botName}`);
  console.log(`${DIM}provider: ${provider.name}${RESET}`);
  if (provider.name === "mock") {
    console.log(
      `${DIM}No ANTHROPIC_API_KEY set, so replies are templated placeholders.`,
      `The pipeline, tools and cart links are real; the persona is not.${RESET}`,
    );
  }
  console.log(`${DIM}Type "exit" to quit.${RESET}\n`);
  if (settings.greeting) console.log(`${BOLD}${settings.botName}:${RESET} ${settings.greeting}\n`);

  const rl = createInterface({ input: stdin, output: stdout });
  let history: Anthropic.MessageParam[] = [];
  let totalCost = 0;

  // Iterate the stream rather than calling question() in a loop: question()
  // drains the whole buffer on the first call, so piped input (demos, scripted
  // checks) would lose every turn after the first.
  rl.setPrompt("You: ");
  rl.prompt();

  try {
    for await (const line of rl) {
      const userMessage = line.trim();
      if (!userMessage) {
        rl.prompt();
        continue;
      }
      if (["exit", "quit", "q"].includes(userMessage.toLowerCase())) break;

      const startedAt = Date.now();
      const result = await runTurn({ provider, catalog, history, userMessage });
      history = result.messages;
      totalCost += result.costUsd;

      console.log(`\n${BOLD}${settings.botName}:${RESET} ${result.reply}\n`);

      const tools = result.toolCalls.map((t) => t.name).join(", ") || "none";
      console.log(
        `${DIM}[${route(result)} | tools: ${tools} | ${Date.now() - startedAt}ms |` +
          ` $${result.costUsd.toFixed(5)} this turn, $${totalCost.toFixed(5)} total]${RESET}`,
      );
      for (const warning of result.warnings) {
        console.log(`${DIM}[warning: ${warning.code} — ${warning.detail}]${RESET}`);
      }
      console.log();
      rl.prompt();
    }
  } finally {
    rl.close();
  }

  console.log(`${DIM}Total spend this session: $${totalCost.toFixed(5)}${RESET}`);
}

function route(result: Awaited<ReturnType<typeof runTurn>>): string {
  const { intent, language, searchQuery, maxPrice } = result.route;
  const parts = [`${intent}/${language}`];
  if (searchQuery) parts.push(`q="${searchQuery}"`);
  if (maxPrice !== undefined) parts.push(`max=${maxPrice}`);
  return parts.join(" ");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
