// Number check for improveWithAI: every number in the output (digits or spelled out) must be
// backed by the input. Plain module (not a server action file) so it can be self-checked in node.

const UNITS = {
  two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40,
  fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};
const MULT = { hundred: 100, thousand: 1e3, million: 1e6, billion: 1e9 };
// "one" is only a number word inside a compound ("twenty-one", "one hundred"), never alone.
const WORD = "(?:" + [...Object.keys(UNITS), ...Object.keys(MULT), "dozen", "one"].join("|") + ")";
const SEQ = new RegExp(`\\b${WORD}(?:(?:[\\s-]+(?:and\\s+)?)${WORD})*\\b`, "gi");

function wordValues(text) {
  const out = [];
  for (const m of String(text).matchAll(SEQ)) {
    const words = m[0].toLowerCase().split(/[\s-]+/).filter((w) => w !== "and");
    if (words.length === 1 && words[0] === "one") continue;
    let total = 0;
    let cur = 0;
    for (const w of words) {
      if (w === "one") cur += 1;
      else if (UNITS[w]) cur += UNITS[w];
      else if (w === "dozen") cur = (cur || 1) * 12;
      else if (w === "hundred") cur = (cur || 1) * 100;
      else {
        total += (cur || 1) * MULT[w];
        cur = 0;
      }
    }
    out.push(String(total + cur));
  }
  return out;
}

export const numTokens = (t) =>
  [...String(t).replace(/^\s*\d+[.)]\s+/gm, "").matchAll(/\d[\d,]*(?:\.\d+)?/g)].map((m) =>
    m[0].replace(/,/g, "").replace(/\.$/, "")
  );

/** All numbers in text as value strings: digits and spelled-out words. */
const allNumbers = (t) => [...numTokens(t), ...wordValues(t)];

/** Numbers (digits, % / $ amounts, spelled-out) in `output` that the `input` does not back. */
export function inventedNumbers(output, input) {
  const known = new Set(allNumbers(input));
  return allNumbers(output).filter((n) => !known.has(n));
}

// Counting words/digits that are harmless in an interview QUESTION ("Describe two approaches", "Name 3 trade-offs").
// Not harmless: years, percentages, currency, durations, numbers above 10, compounds ("twenty-two"), decimals.
const COUNT_WORDS = "two|three|four|five|six|seven|eight|nine|ten";
const UNIT_AFTER = "(?!\\s*(?:%|percent|per\\s*cent|dollars?|usd|euros?|eur|gbp|years?|yrs?|months?|weeks?|days?|hours?|hrs?|minutes?|mins?|seconds?|secs?|k\\b|hundred|thousand|million|billion|dozen))";
const COUNT_WORD_RE = new RegExp(`(?<![\\w$€£.-])(?:${COUNT_WORDS})(?![\\w%-])${UNIT_AFTER}`, "gi");
const COUNT_DIGIT_RE = new RegExp(`(?<![\\w$€£.,-])(?:10|[2-9])(?![\\w%])(?![.,]\\d)${UNIT_AFTER}`, "g");

/**
 * Like inventedNumbers, but for interview questions: counting words "two".."ten" and bare digits 2-10 are allowed
 * even when the sources do not contain them. Everything else must still be backed by `input`.
 */
export function inventedQuestionNumbers(output, input) {
  const text = String(output).replace(COUNT_WORD_RE, " ").replace(COUNT_DIGIT_RE, " ");
  return inventedNumbers(text, input);
}
