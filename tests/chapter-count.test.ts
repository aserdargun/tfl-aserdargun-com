import { it, expect, describe } from "vitest";
import { readFileSync } from "node:fs";
import { lessons } from "../src/lessons/lessons";
import { scenarios } from "../src/core/scenarios";
import { readEntry, readChapter } from "../src/ils/routing";

// The chapter count and the experiment count are published in four places: the
// routed deep link, the visible chapter counter, the runtime meta description
// and the no-JS summary a crawler reads. None of those is the lesson list, so
// each one can drift silently. These tests bind every published surface to the
// data that actually owns the number.

const words = (n: number) => [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
][n];

describe("chapter count has a single owner", () => {
  it("deep links cover every chapter and nothing outside the lesson list", () => {
    // Every real chapter must be reachable by its own URL. A routing rule
    // written against the width of a digit, rather than the length of the
    // lesson list, breaks here the moment the list outgrows that width.
    for (let chapter = 0; chapter < lessons.length; chapter++) {
      expect(
        readEntry(
          new URL(
            `https://tfl.aserdargun.com/?lesson=token-flow-101&chapter=${chapter}`,
          ),
        ).chapter,
      ).toBe(chapter);
    }
    // And an index past the last chapter must not be routed, because the
    // checkpoint loader would throw on it.
    expect(
      readEntry(
        new URL(
          `https://tfl.aserdargun.com/?lesson=token-flow-101&chapter=${lessons.length}`,
        ),
      ).chapter,
    ).toBeNull();
    expect(
      readEntry(
        new URL("https://tfl.aserdargun.com/?lesson=token-flow-101&chapter=99"),
      ).chapter,
    ).toBeNull();
  });

  it("bounds the chapter by the lesson count, not by the width of a digit", () => {
    // Exercised above the current lesson list's length on purpose. With ten
    // chapters every valid index is a single digit, so a single-digit pattern
    // passes by coincidence and only fails once a real eleventh chapter exists.
    // A routing rule tested solely against today's list cannot see that.
    expect(readChapter("9", 11)).toBe(9);
    expect(readChapter("10", 11)).toBe(10);
    expect(readChapter("11", 11)).toBeNull();
    expect(readChapter("10", 10)).toBeNull();
    // Removing a lesson must shrink the range, not leave a reachable index.
    expect(readChapter("8", 9)).toBe(8);
    expect(readChapter("9", 9)).toBeNull();
    // Non-canonical input never routes, whatever the list size.
    for (const raw of ["-1", "1.0", "1e1", "", " 1", "01", "0x2", "+1", "٣"])
      expect(readChapter(raw, 11)).toBeNull();
  });

  it("keeps the no-JS summary's counts equal to the canonical lists", () => {
    // index.html is served to a crawler before any bundle runs, so these words
    // are the only published statement of the counts. A regex over the English
    // number word catches a stale count that a bundle-derived check never sees.
    const html = readFileSync(
      new URL("../index.html", import.meta.url),
      "utf8",
    );
    const numberWords =
      "zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve";
    const experiments = html.match(
      new RegExp(`(${numberWords}) experiments`, "i"),
    );
    const checkpoints = html.match(
      new RegExp(`(${numberWords}) guided checkpoints`, "i"),
    );
    expect(experiments, "index.html states the experiment count in words")
      .not.toBeNull();
    expect(checkpoints, "index.html states the chapter count in words")
      .not.toBeNull();
    const wordIndex = (w: string) =>
      [
        "zero",
        "one",
        "two",
        "three",
        "four",
        "five",
        "six",
        "seven",
        "eight",
        "nine",
        "ten",
        "eleven",
        "twelve",
      ].indexOf(w.toLowerCase());
    // index.html capitalises the leading word of its sentences, so compare
    // case-insensitively rather than assuming the source's exact casing.
    const description = html.match(
      /name="description"\s+content="([^"]+)"/,
    )![1];
    expect(description.toLowerCase()).toContain(
      `${words(scenarios.length)} experiments`.toLowerCase(),
    );
    expect(description.toLowerCase()).toContain(
      `${words(lessons.length)} guided checkpoints`.toLowerCase(),
    );
    expect(wordIndex(experiments![1])).toBe(scenarios.length);
    expect(wordIndex(checkpoints![1])).toBe(lessons.length);
  });
});