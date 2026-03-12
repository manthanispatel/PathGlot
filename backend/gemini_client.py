"""Gemini Live session manager.

Wraps the google-genai Live API to:
  - Start a session with a system prompt
  - Relay audio chunks to/from the session
  - Inject context messages mid-session
  - Emit audio output and transcript events via callbacks
"""

import asyncio
import os
from typing import Callable, Awaitable, Any

from google import genai
from google.genai import types as genai_types

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = "gemini-live-2.5-flash-native-audio"


class GeminiLiveSession:
    def __init__(
        self,
        system_prompt: str,
        language_code: str,
        on_audio: Callable[[str], Awaitable[None]],
        on_audio_end: Callable[[], Awaitable[None]],
        on_transcript: Callable[[str, str], Awaitable[None]],
        on_error: Callable[[str], Awaitable[None]],
    ):
        self.system_prompt = system_prompt
        self.language_code = language_code
        self.on_audio = on_audio
        self.on_audio_end = on_audio_end
        self.on_transcript = on_transcript
        self.on_error = on_error

        self._client = genai.Client(api_key=GEMINI_API_KEY)
        self._session: Any = None
        self._receive_task: asyncio.Task | None = None
        self._closed = False

    async def start(self) -> None:
        """Open the Gemini Live session."""
        from language_config import LANGUAGE_CONFIG

        lang_cfg = LANGUAGE_CONFIG.get(self.language_code, LANGUAGE_CONFIG["es"])
        voice_name = lang_cfg["voice"]

        config = genai_types.LiveConnectConfig(
            response_modalities=["AUDIO"],
            system_instruction=genai_types.Content(
                parts=[genai_types.Part(text=self.system_prompt)],
                role="user",
            ),
            speech_config=genai_types.SpeechConfig(
                voice_config=genai_types.VoiceConfig(
                    prebuilt_voice_config=genai_types.PrebuiltVoiceConfig(
                        voice_name=voice_name,
                    )
                )
            ),
        )

        self._session = await self._client.aio.live.connect(
            model=GEMINI_MODEL,
            config=config,
        ).__aenter__()

        self._receive_task = asyncio.create_task(self._receive_loop())

    async def send_audio(self, base64_pcm: str) -> None:
        """Send a base64-encoded PCM audio chunk to Gemini."""
        if self._session is None or self._closed:
            return
        await self._session.send_realtime_input(
            media_chunks=[
                genai_types.Blob(
                    data=base64_pcm,
                    mime_type="audio/pcm;rate=16000",
                )
            ]
        )

    async def send_context(self, context_text: str) -> None:
        """Inject a location context update mid-session."""
        if self._session is None or self._closed:
            return
        await self._session.send_client_content(
            turns=[
                genai_types.Content(
                    role="user",
                    parts=[genai_types.Part(text=context_text)],
                )
            ],
            turn_complete=False,
        )

    async def close(self) -> None:
        """Close the Gemini Live session."""
        self._closed = True
        if self._receive_task:
            self._receive_task.cancel()
            try:
                await self._receive_task
            except asyncio.CancelledError:
                pass
        if self._session:
            try:
                await self._session.__aexit__(None, None, None)
            except Exception:
                pass

    async def _receive_loop(self) -> None:
        """Continuously receive messages from Gemini Live."""
        try:
            async for response in self._session.receive():
                if self._closed:
                    break

                # Audio output
                if response.data:
                    import base64
                    audio_b64 = base64.b64encode(response.data).decode()
                    await self.on_audio(audio_b64)

                # Turn complete signal
                if response.server_content and response.server_content.turn_complete:
                    await self.on_audio_end()

                # Transcript (input/output text)
                if response.server_content:
                    sc = response.server_content
                    if sc.model_turn:
                        for part in sc.model_turn.parts:
                            if part.text:
                                await self.on_transcript("agent", part.text)
                    if sc.input_transcription:
                        await self.on_transcript("user", sc.input_transcription)

        except asyncio.CancelledError:
            pass
        except Exception as e:
            if not self._closed:
                await self.on_error(f"Gemini session error: {e}")
