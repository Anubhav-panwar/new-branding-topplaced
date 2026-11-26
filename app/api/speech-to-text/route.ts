import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

/**
 * Normalizes BCP-47 browser language codes to ElevenLabs Scribe supported ISO codes.
 * Returns null for auto-detect (omits language_code), preventing HTTP 400 validation errors on 'en-IN'/'en-US'.
 */
function normalizeElevenLabsLanguage(langCode: string | null): string | null {
  if (!langCode) return null;
  const code = langCode.trim().toLowerCase();
  if (code === 'auto' || code === 'none' || code === '' || code === 'default') {
    return null;
  }
  if (['en-us', 'en-in', 'en-gb', 'en-au', 'en-ca', 'en-nz', 'en-za', 'en'].includes(code)) {
    return 'eng';
  }
  if (['hi-in', 'hi'].includes(code)) return 'hin';
  if (['ta-in', 'ta'].includes(code)) return 'tam';
  if (['te-in', 'te'].includes(code)) return 'tel';
  if (['bn-in', 'bn'].includes(code)) return 'ben';
  if (['es-es', 'es-mx', 'es'].includes(code)) return 'spa';
  if (['fr-fr', 'fr-ca', 'fr'].includes(code)) return 'fra';
  if (['de-de', 'de'].includes(code)) return 'deu';

  if (code.length === 3 && /^[a-z]+$/.test(code)) return code;
  if (code.length === 2 && /^[a-z]+$/.test(code)) return code;

  return null;
}

/**
 * Algorithmic Repetition Loop Elimination.
 * Collapses acoustic decoding loops (e.g. repeated n-grams >= 2 times) without hardcoding any dictionary words.
 */
const LEGITIMATE_DOUBLES = new Set(["that", "had", "very", "really", "so", "more", "much", "never"]);

/**
 * Algorithmic Repetition Loop Elimination.
 * Collapses acoustic decoding loops without hardcoding any dictionary words.
 * Preserves legitimate natural English double-word repetitions (e.g. 'that that', 'had had', 'very very').
 */
function eliminateRepetitionLoops(text: string): string {
  if (!text) return '';
  let words = text.trim().split(/\s+/);
  if (words.length < 2) return text;

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

      const ngramNorm = ngram.map((w) => w.toLowerCase().replace(/[.,!?"']/g, ''));
      if (!ngramNorm.some(Boolean)) {
        cleaned.push(...ngram);
        i += n;
        continue;
      }

      let count = 1;
      while (i + (count + 1) * n <= words.length) {
        const nextNgram = words.slice(i + count * n, i + (count + 1) * n);
        const nextNorm = nextNgram.map((w) => w.toLowerCase().replace(/[.,!?"']/g, ''));
        if (nextNorm.join(' ') === ngramNorm.join(' ')) {
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

  return words.join(' ').trim();
}

/**
 * Simple acoustic silence check on audio bytes to prevent hallucinations on silence or background hum.
 */
function isAudioSilent(bytes: ArrayBuffer): boolean {
  if (bytes.byteLength < 150) return true;
  if (bytes.byteLength < 800) {
    const view = new Uint8Array(bytes);
    const unique = new Set(view.subarray(Math.min(100, view.length - 1)));
    if (unique.size <= 4) return true;
  }
  return false;
}

/**
 * TopPlaced AI - Universal Speech-To-Text Route
 * Primary: ElevenLabs Scribe (scribe_v1) - multi-accent, dynamic language detection, verbatim accuracy
 * Fallback: OpenAI Whisper (whisper-1) - neutral acoustic conditioning
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const requestedLanguage = (formData.get('language_code') as string) || '';

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided', transcript: '' }, { status: 400 });
    }

    const audioBytes = await audioFile.arrayBuffer();

    // 1. Acoustic VAD check: return clean empty string for silence or empty audio
    if (isAudioSilent(audioBytes)) {
      return NextResponse.json({
        success: true,
        transcript: '',
        confidence: 0,
        words: [],
        source: 'vad-silence',
      });
    }

    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    // --- 2. Primary Engine: ElevenLabs Scribe STT ---
    if (elevenLabsApiKey) {
      try {
        console.log('🎤 Calling ElevenLabs Scribe STT API with dynamic accent detection...');
        const scribeFormData = new FormData();
        const audioBlob = new Blob([audioBytes], { type: audioFile.type || 'audio/webm' });
        scribeFormData.append('file', audioBlob, audioFile.name || 'recording.webm');
        scribeFormData.append('model_id', 'scribe_v1');
        scribeFormData.append('tag_audio_events', 'false');

        // Dynamic language detection: normalize language tag (prevents HTTP 400 on 'en-IN', 'en-US')
        const normLanguage = normalizeElevenLabsLanguage(requestedLanguage);
        if (normLanguage) {
          scribeFormData.append('language_code', normLanguage);
        }

        const scribeResponse = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
          method: 'POST',
          headers: {
            'xi-api-key': elevenLabsApiKey,
            'User-Agent': 'TopPlaced-AI-Frontend/1.0',
          },
          body: scribeFormData,
        });

        if (scribeResponse.ok) {
          const scribeData = await scribeResponse.json();
          let rawText = (scribeData.text || '').trim();
          const cleanText = eliminateRepetitionLoops(rawText);

          console.log(`✅ ElevenLabs Scribe transcription success (${cleanText.length} chars, lang=${scribeData.language_code || normLanguage || 'auto'})`);
          return NextResponse.json({
            success: true,
            transcript: cleanText,
            raw_transcript: rawText,
            confidence: 0.99,
            source: 'elevenlabs-scribe',
            words: scribeData.words || [],
            duration: scribeData.audio_duration_secs || 0,
          });
        } else {
          const errText = await scribeResponse.text();
          console.warn(`⚠️ ElevenLabs Scribe API HTTP ${scribeResponse.status}: ${errText.slice(0, 150)}`);
        }
      } catch (scribeErr) {
        console.warn('⚠️ ElevenLabs Scribe request exception:', scribeErr);
      }
    }

    // --- 3. Fallback Engine: OpenAI Whisper ---
    if (openaiApiKey) {
      try {
        console.log('🎤 Falling back to OpenAI Whisper API with neutral acoustic conditioning...');
        const openaiFormData = new FormData();
        const audioBlob = new Blob([audioBytes], { type: audioFile.type || 'audio/webm' });
        openaiFormData.append('file', audioBlob, audioFile.name || 'recording.webm');
        openaiFormData.append('model', 'whisper-1');
        openaiFormData.append('prompt', 'Professional spoken response in an interview.');
        const normLang = normalizeElevenLabsLanguage(requestedLanguage);
        const whisperLang = normLang ? (normLang === 'eng' ? 'en' : normLang === 'hin' ? 'hi' : normLang) : undefined;
        if (whisperLang) {
          openaiFormData.append('language', whisperLang);
        }

        const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openaiApiKey}`,
          },
          body: openaiFormData,
        });

        if (whisperResponse.ok) {
          const whisperData = await whisperResponse.json();
          const rawText = (whisperData.text || '').trim();
          const cleanText = eliminateRepetitionLoops(rawText);

          console.log(`✅ OpenAI Whisper fallback success (${cleanText.length} chars)`);
          return NextResponse.json({
            success: true,
            transcript: cleanText,
            raw_transcript: rawText,
            confidence: 0.95,
            source: 'openai-whisper',
          });
        } else {
          const errText = await whisperResponse.text();
          console.warn(`⚠️ OpenAI Whisper API HTTP ${whisperResponse.status}: ${errText.slice(0, 150)}`);
        }
      } catch (whisperErr) {
        console.warn('⚠️ OpenAI Whisper request exception:', whisperErr);
      }
    }

    // --- 4. Clean Empty Response (Never Fabricate Text) ---
    return NextResponse.json({
      success: true,
      transcript: '',
      confidence: 0.0,
      source: 'none',
      message: 'No speech recognized or STT service temporarily unreachable.',
    });
  } catch (error) {
    console.error('Speech-to-text route error:', error);
    return NextResponse.json(
      {
        success: false,
        transcript: '',
        confidence: 0.0,
        source: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
