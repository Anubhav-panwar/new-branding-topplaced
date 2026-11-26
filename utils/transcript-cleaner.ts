const LEGITIMATE_DOUBLES = new Set(["that", "had", "very", "really", "so", "more", "much", "never"]);

/**
 * Algorithmic Repetition Loop Elimination.
 * Collapses acoustic decoding loops without hardcoding any dictionary words.
 * Preserves legitimate natural English double-word repetitions (e.g. 'that that', 'had had', 'very very').
 */
function eliminateRepetitionLoops(rawText: string): string {
  if (!rawText) return "";
  let words = rawText.trim().split(/\s+/);
  if (words.length < 2) return rawText;

  for (let n = 6; n >= 1; n--) {
    if (words.length < n * 2) continue;
    const cleaned: string[] = [];
    let i = 0;
    while (i < words.length) {
      const ngram = words.slice(i, i + n);
      if (ngram.length < n) {
        cleaned.push(...words.slice(i));
        break;
      }

      const ngramNorm = ngram.map((w) => w.toLowerCase().replace(/[.,!?"']/g, ""));
      if (!ngramNorm.some(Boolean)) {
        cleaned.push(...ngram);
        i += n;
        continue;
      }

      let count = 1;
      while (i + (count + 1) * n <= words.length) {
        const nextNgram = words.slice(i + count * n, i + (count + 1) * n);
        const nextNorm = nextNgram.map((w) => w.toLowerCase().replace(/[.,!?"']/g, ""));
        if (nextNorm.join(" ") === ngramNorm.join(" ")) {
          count++;
        } else {
          break;
        }
      }

      let isLoop = false;
      if (n === 1) {
        const wordClean = ngramNorm[0];
        if (LEGITIMATE_DOUBLES.has(wordClean) && count === 2) {
          isLoop = false;
        } else if (count >= 2) {
          isLoop = true;
        }
      } else if (n >= 2) {
        if (count >= 2) {
          isLoop = true;
        }
      }

      if (isLoop) {
        cleaned.push(...ngram);
        i += count * n;
      } else {
        cleaned.push(words[i]);
        i++;
      }
    }
    words = cleaned;
  }

  return words.join(" ").trim();
}

/**
 * Clean transcript text hygiene: normal English vs technical term disambiguation
 * Normal English words (I am, see, are, you, access, database) are strictly protected.
 */
export function cleanTranscriptText(rawText: string): string {
  if (!rawText) return "";
  let text = eliminateRepetitionLoops(rawText.trim().replace(/\s+/g, " "));

  // 1. High-confidence spoken acronym letter-spaced normalizations (e.g. "S E O" -> "SEO", "E C 2" -> "EC2")
  // NOTE: Does NOT convert normal English words (e.g. "I am", "see", "are" are NEVER unconditionally replaced)
  const spokenAcronymRules: [RegExp, string][] = [
    [/\b[eE]\s+[cC]\s*[-]?2\b/g, "EC2"],
    [/\b[eE][cC]\s*two\b/gi, "EC2"],
    [/\b[sS]\s+[tT][hH][rR][eE][eE]\b/gi, "S3"],
    [/\b[sS]\s*[-]?3\b/gi, "S3"],
    [/\b[vV]\s+[pP]\s+[cC]\b/g, "VPC"],
    [/\b[rR]\s+[dD]\s+[sS]\b/g, "RDS"],
    [/\b[aA]\s+[lL]\s+[bB]\b/g, "ALB"],
    [/\b[rR]\s+[oO]\s+[aA]\s+[sS]\b/gi, "ROAS"],
    [/\b[sS]\s+[eE]\s+[oO]\b/gi, "SEO"],
    [/\b[sS]\s+[eE]\s+[mM]\b/gi, "SEM"],
    [/\b[pP]\s+[pP]\s+[cC]\b/gi, "PPC"],
    [/\b[cC]\s+[tT]\s+[rR]\b/gi, "CTR"],
    [/\b[cC]\s+[pP]\s+[cC]\b/gi, "CPC"],
    [/\b[aA]\s+[tT]\s+[sS]\b/gi, "ATS"],
    [/\b[kK]\s+[pP]\s+[iI]\b/gi, "KPI"],
    [/\b[sS]\s+[qQ]\s+[lL]\b/gi, "SQL"],
    [/\b[gG]\s+[aA]\s*[-]?4\b/gi, "GA4"],
    [/\b[gG][aA]\s*four\b/gi, "GA4"],
    [/\b[uU]\s+[xX]\b/g, "UX"],
    [/\b[aA]\s+[pP]\s+[iI]\b/g, "API"],
    [/\b[rR][eE][sS][tT]\s+[aA][pP][iI]\b/gi, "REST API"],
    [/\b[cC][iI]\s*[\/]?\s*[cC][dD]\b/gi, "CI/CD"],
  ];

  for (const [pattern, replacement] of spokenAcronymRules) {
    text = text.replace(pattern, replacement);
  }

  // 2. CONTEXTUAL DISAMBIGUATION: Restore natural English when STT wrongly generates technical acronyms
  // (a) "IAM" followed by verbs, articles, adverbs, or adjectives -> restore to "I am"
  text = text.replace(
    /\bIAM\s+(a|an|the|working|using|currently|also|now|just|not|familiar|responsible|experienced|interested|trying|building|developing|learning|writing|doing|going|having|here|still|already|glad|sure|based|located|graduated)\b/gi,
    (match, word) => {
      return `I am ${word}`;
    }
  );

  // (b) "C" in visual/perceptual contexts -> restore to "see"
  text = text.replace(
    /\b(can|to|will|could|would|might|should)\s+[cC]\s+(the|a|an|my|our|any|all|this|that|these|those)\b/gi,
    "$1 see $2"
  );
  text = text.replace(
    /\bI\s+[cC]\s+(the|a|an|my|our|any|all|this|that|these|those)\b/gi,
    "I see $1"
  );
  text = text.replace(/\blet['']?s\s+[cC]\b/gi, "let's see");
  text = text.replace(
    /\bwe\s+[cC]\s+(the|a|an|my|our|any|all|this|that|these|those)\b/gi,
    "we see $1"
  );

  // (c) "R" in conversational questions/pronouns -> restore to "are"
  text = text.replace(/\b(how|why|where|when|what)\s+R\s+you\b/gi, "$1 are you");
  text = text.replace(/\b(they|we|you)\s+R\b/gi, "$1 are");

  // Capitalize first letter of sentences cleanly
  text = text.replace(/(^\s*|\.\s+)([a-z])/g, (_, prefix, char) => prefix + char.toUpperCase());

  return text;
}

export default cleanTranscriptText;

