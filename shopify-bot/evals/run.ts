/**
 * Eval runner.
 *
 *   npm run eval                 # all cases
 *   npm run eval -- lang         # only cases whose id contains "lang"
 *   npm run eval -- --verbose    # print every reply
 *
 * Run it after every prompt change and compare the pass rate to the last run.
 * With no ANTHROPIC_API_KEY this runs against the mock provider, which only
 * proves the plumbing works — it says nothing about persona quality.
 */

import type Anthropic from "@anthropic-ai/sdk";
import { runTurn } from "../src/agent/pipeline.js";
import { createCatalog, createProvider } from "../src/factory.js";
import { cases, type EvalCase } from "./cases.js";

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

interface CaseOutcome {
  id: string;
  passed: boolean;
  failures: string[];
  reply: string;
  costUsd: number;
}

async function runCase(
  testCase: EvalCase,
  provider: ReturnType<typeof createProvider>,
  catalog: ReturnType<typeof createCatalog>,
): Promise<CaseOutcome> {
  let history: Anthropic.MessageParam[] = [];
  let costUsd = 0;

  // Replay setup turns so the final message lands in the right context.
  for (const priorMessage of testCase.history ?? []) {
    const prior = await runTurn({ provider, catalog, history, userMessage: priorMessage });
    history = prior.messages;
    costUsd += prior.costUsd;
  }

  const result = await runTurn({
    provider,
    catalog,
    history,
    userMessage: testCase.message,
  });
  costUsd += result.costUsd;

  const failures: string[] = [];
  const expect = testCase.expect;
  const replyLower = result.reply.toLowerCase();
  const toolsUsed = result.toolCalls.map((t) => t.name);

  if (expect.language && result.route.language !== expect.language) {
    failures.push(`language: expected ${expect.language}, got ${result.route.language}`);
  }
  if (expect.intent && !expect.intent.includes(result.route.intent)) {
    failures.push(`intent: expected one of ${expect.intent.join("|")}, got ${result.route.intent}`);
  }
  for (const tool of expect.toolsUsed ?? []) {
    if (!toolsUsed.includes(tool)) failures.push(`missing tool call: ${tool}`);
  }
  for (const tool of expect.toolsNotUsed ?? []) {
    if (toolsUsed.includes(tool)) failures.push(`unexpected tool call: ${tool}`);
  }
  for (const needle of expect.mustMention ?? []) {
    if (!replyLower.includes(needle.toLowerCase())) failures.push(`missing text: "${needle}"`);
  }
  for (const needle of expect.mustNotMention ?? []) {
    if (replyLower.includes(needle.toLowerCase())) failures.push(`forbidden text: "${needle}"`);
  }
  if (expect.maxWords !== undefined) {
    const words = result.reply.trim().split(/\s+/).filter(Boolean).length;
    if (words > expect.maxWords) failures.push(`too long: ${words} words > ${expect.maxWords}`);
  }
  if (expect.cartLink !== undefined && result.cartLinkSent !== expect.cartLink) {
    failures.push(`cart link: expected ${expect.cartLink}, got ${result.cartLinkSent}`);
  }
  if (expect.escalate !== undefined && result.escalated !== expect.escalate) {
    failures.push(`escalation: expected ${expect.escalate}, got ${result.escalated}`);
  }
  // Guardrail warnings are always failures — they are the non-negotiables.
  for (const warning of result.warnings) {
    failures.push(`guardrail ${warning.code}: ${warning.detail}`);
  }

  return { id: testCase.id, passed: failures.length === 0, failures, reply: result.reply, costUsd };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const verbose = args.includes("--verbose");
  const filter = args.find((a) => !a.startsWith("--"));

  const selected = filter ? cases.filter((c) => c.id.includes(filter)) : cases;
  if (selected.length === 0) {
    console.error(`No cases match "${filter}".`);
    process.exitCode = 1;
    return;
  }

  const provider = createProvider();
  const catalog = createCatalog();

  console.log(`${BOLD}Running ${selected.length} cases${RESET} ${DIM}(provider: ${provider.name})${RESET}`);
  if (provider.name === "mock") {
    console.log(
      `${DIM}Mock provider: this measures plumbing, not persona quality.`,
      `Set ANTHROPIC_API_KEY for a real score.${RESET}`,
    );
  }
  console.log();

  const outcomes: CaseOutcome[] = [];
  for (const testCase of selected) {
    // Sequential on purpose: parallel runs make rate limits and cost spikes
    // harder to reason about, and this set is small.
    const outcome = await runCase(testCase, provider, catalog);
    outcomes.push(outcome);

    const mark = outcome.passed ? `${GREEN}PASS${RESET}` : `${RED}FAIL${RESET}`;
    console.log(`${mark}  ${outcome.id}`);
    for (const failure of outcome.failures) console.log(`      ${RED}- ${failure}${RESET}`);
    if (verbose || !outcome.passed) {
      console.log(`      ${DIM}reply: ${outcome.reply.replace(/\n/g, " ⏎ ")}${RESET}`);
    }
  }

  const passed = outcomes.filter((o) => o.passed).length;
  const totalCost = outcomes.reduce((sum, o) => sum + o.costUsd, 0);
  const rate = ((passed / outcomes.length) * 100).toFixed(1);

  console.log();
  console.log(`${BOLD}${passed}/${outcomes.length} passed (${rate}%)${RESET}`);
  console.log(`${DIM}Total cost: $${totalCost.toFixed(4)}${RESET}`);

  if (passed < outcomes.length) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
