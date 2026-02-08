# ClawChat: Voice Interface for OpenClaw

Source: Community article on building voice chat with OpenClaw

## Overview

Real-time voice chat with OpenClaw assistant using browser, works over CarPlay.

## Architecture

```
Browser (mic) → Deepgram STT → OpenClaw Gateway → Agent → ElevenLabs TTS → Browser (speaker)
```

## Key Components

- **Deepgram**: Streaming speech-to-text (200 hrs free)
- **ElevenLabs**: Text-to-speech (~$0.30/min at scale)
- **Pipecat**: WebRTC orchestration framework
- **OpenClaw Gateway**: `/v1/chat/completions` endpoint (OpenAI-compatible)

## The Magic

NOT a dumb voice wrapper. Hits the full agent with:
- Memory
- Tools
- Persona
- Knowledge graph

Same brain whether you text or talk.

## Pipeline Code

```python
async def run_bot(webrtc_connection):
    stt = DeepgramSTTService(api_key=os.getenv("DEEPGRAM_API_KEY"))
    tts = ElevenLabsTTSService(
        api_key=os.getenv("ELEVENLABS_API_KEY"),
        voice_id=os.getenv("ELEVENLABS_VOICE_ID"),
    )
    llm = OpenAILLMService(
        api_key=os.getenv("CLAWDBOT_GATEWAY_TOKEN"),
        model="clawdbot:voice",
        base_url=f"{os.getenv('CLAWDBOT_GATEWAY_URL')}/v1",
    )
    
    pipeline = Pipeline([
        transport.input(),      # Browser audio in
        stt,                    # Speech → text
        user_aggregator,        # Accumulate user turns
        llm,                    # Agent via gateway
        tts,                    # Text → speech
        transport.output(),     # Audio back to browser
        assistant_aggregator,   # Track assistant turns
    ])
```

## Voice System Prompt

```python
VOICE_SYSTEM = (
    "This conversation is happening via real-time voice chat. "
    "Keep responses concise and conversational — a few sentences "
    "at most unless the topic genuinely needs depth. "
    "No markdown, bullet points, code blocks, or special formatting."
)
```

## OpenClaw Config Required

1. Enable chat completions endpoint:
```json
{
  "gateway": {
    "http": {
      "endpoints": {
        "chatCompletions": {
          "enabled": true
        }
      }
    }
  }
}
```

2. Add voice agent entry:
```json
{
  "agents": {
    "list": [
      {
        "id": "voice",
        "workspace": "/path/to/your/clawd",
        "model": "anthropic/claude-sonnet-4-5"
      }
    ]
  }
}
```

## Latency Reality

- **Opus**: 2-4 sec pause (thoughtful but slow)
- **Sonnet**: Snappy enough for conversation
- **For voice**: Speed > depth, use Sonnet

## Voice Activity Detection

- Silero VAD detects when you stop talking
- `stop_secs=0.4` - pause triggers send
- No wake word, no push-to-talk
- Just talk naturally and pause

## Setup Time

~15 minutes if OpenClaw already running.

## Files Needed

- `bot.py` - Pipecat pipeline
- `server.py` - FastAPI server
- `index.html` - Single-page frontend (~80 lines JS)
- `.env` - API keys

## For Zaki Platform

- Pre-configure everything for users
- Manage Deepgram/ElevenLabs keys centrally
- Premium feature: "Enable Voice" = 1 click
- Add ~$1-3/hour voice chat cost to pricing
