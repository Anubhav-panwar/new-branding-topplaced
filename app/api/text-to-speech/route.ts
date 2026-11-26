import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const ELEVENLABS_VOICE_MAP: Record<string, string> = {
  alloy: 'EXAVITQu4vr4xnSDxMaL', // Sarah (clear, natural interviewer)
  sarah: 'EXAVITQu4vr4xnSDxMaL',
  echo: 'JBFqnCBsd6RMkjVDRZzb', // George (warm professional male)
  george: 'JBFqnCBsd6RMkjVDRZzb',
  alice: 'Xb7hH8MSUJpSbSDYk0k2',
  jessica: 'cgSgspJ2msm6clMCkdW9',
  brian: 'nPczCjzI2devNBz1zQrb',
  laura: 'FGY2WhTYpPnrIDTdsKH5',
  default: 'EXAVITQu4vr4xnSDxMaL',
};

export async function POST(request: NextRequest) {
  let requestBody;

  try {
    requestBody = await request.json();
  } catch (parseError) {
    console.error('Failed to parse request body:', parseError);
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }

  const {
    text,
    voice_id = 'alloy',
    model_id = 'eleven_turbo_v2_5',
  } = requestBody;

  if (!text || typeof text !== 'string') {
    return NextResponse.json(
      { error: 'Text parameter is required and must be a string' },
      { status: 400 }
    );
  }

  console.log(`🔊 TTS request: ${text.slice(0, 60)}...`);

  // --- 1. ElevenLabs TTS (Primary) ---
  const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
  if (elevenLabsApiKey) {
    try {
      const selectedVoice =
        voice_id && voice_id.length >= 15
          ? voice_id
          : ELEVENLABS_VOICE_MAP[voice_id?.toLowerCase()] ||
            process.env.ELEVENLABS_VOICE_ID ||
            process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID ||
            'EXAVITQu4vr4xnSDxMaL';

      console.log(`🎙️ Attempting ElevenLabs TTS with voice: ${selectedVoice}`);

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}`,
        {
          method: 'POST',
          headers: {
            Accept: 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': elevenLabsApiKey,
          },
          body: JSON.stringify({
            text,
            model_id: model_id || 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.0,
              use_speaker_boost: true,
            },
          }),
        }
      );

      if (response.ok) {
        const audioBuffer = await response.arrayBuffer();
        const audioBase64 = Buffer.from(audioBuffer).toString('base64');
        console.log('✅ ElevenLabs TTS success');

        return NextResponse.json({
          audioContent: audioBase64,
          audioUrl: `data:audio/mpeg;base64,${audioBase64}`,
          text,
          voice: selectedVoice,
          useBrowserTTS: false,
          source: 'elevenlabs-api',
        });
      } else {
        const errorText = await response.text();
        console.warn(
          `⚠️ ElevenLabs API error: ${response.status} - ${errorText}. Falling back to secondary engine.`
        );
      }
    } catch (elevenError) {
      console.warn('⚠️ ElevenLabs fetch failed:', elevenError);
    }
  }

  // --- 2. OpenAI TTS (Secondary Fallback) ---
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (openaiApiKey) {
    try {
      console.log('🎙️ Attempting OpenAI TTS fallback...');
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'].includes(voice_id)
            ? voice_id
            : 'alloy',
        }),
      });

      if (response.ok) {
        const audioBuffer = await response.arrayBuffer();
        const audioBase64 = Buffer.from(audioBuffer).toString('base64');
        console.log('✅ OpenAI TTS success');

        return NextResponse.json({
          audioContent: audioBase64,
          audioUrl: `data:audio/mpeg;base64,${audioBase64}`,
          text,
          useBrowserTTS: false,
          source: 'openai-tts',
        });
      } else {
        const errorText = await response.text();
        console.warn(`⚠️ OpenAI TTS API error: ${response.status} - ${errorText}`);
      }
    } catch (openaiError) {
      console.warn('⚠️ OpenAI TTS fetch error:', openaiError);
    }
  }

  // --- 3. Browser Speech Synthesis Fallback ---
  console.log('ℹ️ No active cloud TTS API available, delegating to browser TTS.');
  return NextResponse.json({
    audioUrl: null,
    audioContent: null,
    useBrowserTTS: true,
    text,
    source: 'browser-fallback',
  });
}
