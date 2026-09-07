import { test } from "node:test";
import assert from "node:assert/strict";
import { checkTalkingRules, splitStanceTag } from "../lib/aura-prompt.ts";

test("stance tag is parsed and stripped", () => {
  const r = splitStanceTag("[stance:reflect] So it's not the call itself.");
  assert.equal(r.stance, "reflect");
  assert.equal(r.body, "So it's not the call itself.");
});

test("unknown stance tag is dropped but body kept", () => {
  const r = splitStanceTag("[stance:lecture] Here is a list.");
  assert.equal(r.stance, null);
  assert.equal(r.body, "Here is a list.");
});

test("no tag leaves the text untouched", () => {
  const r = splitStanceTag("Take your time.");
  assert.equal(r.stance, null);
  assert.equal(r.body, "Take your time.");
});

test("a good reply has no violations", () => {
  assert.deepEqual(checkTalkingRules("Yes came out before you'd decided, didn't it."), []);
});

test("two questions is a violation", () => {
  assert.ok(checkTalkingRules("How was it? And what did she say?").includes("questions:2"));
});

test("lists and markdown are violations", () => {
  const v = checkTalkingRules("Try these:\n- breathe\n- walk\n**Then** sleep.");
  assert.ok(v.includes("list"));
  assert.ok(v.includes("markdown"));
});

test("filler phrases and stock openers are caught", () => {
  const v = checkTalkingRules("I hear you. It's completely valid that you feel this way.");
  assert.ok(v.includes("filler-phrase"));
  assert.ok(v.includes("stock-opener"));
});

test("diagnosis and medication advice are caught", () => {
  assert.ok(checkTalkingRules("You have GAD, honestly.").includes("diagnosis"));
  assert.ok(checkTalkingRules("You could ask about increasing your SSRI dose.").includes("medication"));
});

test("voice replies are held shorter", () => {
  const four = "One. Two. Three. Four. Five.";
  assert.ok(checkTalkingRules(four, { voice: true }).some((v) => v.startsWith("too-long")));
  assert.ok(!checkTalkingRules("One. Two. Three.", { voice: false }).some((v) => v.startsWith("too-long")));
});
