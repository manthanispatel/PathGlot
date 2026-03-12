import { useEffect, useRef, useState, useCallback } from "react";
import { AudioPlayer, float32ToBase64Pcm, resample, CAPTURE_SAMPLE_RATE } from "../lib/audio";
import type { City } from "../lib/cities";

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string | undefined) || "http://localhost:8000";
const BACKEND_WS_URL = BACKEND_URL.replace(/^http/, "ws");

export type SessionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "error"
  | "closed";

export interface ConversationTurn {
  id: string;
  role: "user" | "agent";
  text: string;
  timestamp: number;
}

interface UseGeminiSessionOptions {
  languageCode: string;
  city: City;
  guideName: string;
}

export function useGeminiSession({
  languageCode,
  city,
  guideName,
}: UseGeminiSessionOptions) {
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [isMicActive, setIsMicActive] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<ConversationTurn[]>([]);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioPlayerRef = useRef<AudioPlayer | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // Connect to backend WebSocket and start Gemini session
  const connect = useCallback(async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus("connecting");
    setError(null);

    const ws = new WebSocket(
      `${BACKEND_WS_URL}/ws/session?lang=${languageCode}&city=${city.id}&guide=${guideName}`
    );
    wsRef.current = ws;
    audioPlayerRef.current = new AudioPlayer();

    ws.onopen = () => {
      setStatus("connected");
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data as string) as BackendMessage;
      handleBackendMessage(msg);
    };

    ws.onerror = () => {
      setError("WebSocket connection error. Is the backend running?");
      setStatus("error");
    };

    ws.onclose = () => {
      setStatus("closed");
      setIsMicActive(false);
      setIsAgentSpeaking(false);
    };
  }, [languageCode, city.id, guideName]);

  const handleBackendMessage = useCallback((msg: BackendMessage) => {
    switch (msg.type) {
      case "audio":
        audioPlayerRef.current?.resume();
        audioPlayerRef.current?.enqueue(msg.data);
        setIsAgentSpeaking(true);
        break;

      case "audio_end":
        setIsAgentSpeaking(false);
        break;

      case "transcript":
        setTranscript((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: msg.role,
            text: msg.text,
            timestamp: Date.now(),
          },
        ]);
        break;

      case "error":
        setError(msg.message);
        break;

      case "status":
        // Server-side status updates (e.g., "context_updated")
        console.log("[session status]", msg.message);
        break;
    }
  }, []);

  // Start microphone capture
  const startMic = useCallback(async () => {
    if (isMicActive) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: { ideal: 48000 },
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      micStreamRef.current = stream;
      const ctx = new AudioContext();
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;

      // Use ScriptProcessorNode for broad browser support
      // Buffer size 4096 at 48kHz = ~85ms, gives ~20 chunks/sec at 16kHz
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const resampled = resample(
          inputData,
          ctx.sampleRate,
          CAPTURE_SAMPLE_RATE
        );
        const base64 = float32ToBase64Pcm(resampled);
        wsRef.current.send(
          JSON.stringify({ type: "audio", data: base64 })
        );
      };

      source.connect(processor);
      processor.connect(ctx.destination);
      setIsMicActive(true);
    } catch (err) {
      setError(
        `Microphone access denied: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }, [isMicActive]);

  // Stop microphone capture
  const stopMic = useCallback(() => {
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    audioContextRef.current?.close();

    processorRef.current = null;
    sourceRef.current = null;
    micStreamRef.current = null;
    audioContextRef.current = null;

    setIsMicActive(false);
  }, []);

  // Send position update to backend
  const sendPositionUpdate = useCallback(
    (lat: number, lng: number) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({ type: "position", lat, lng })
        );
      }
    },
    []
  );

  // Disconnect and clean up
  const disconnect = useCallback(() => {
    stopMic();
    audioPlayerRef.current?.stop();
    wsRef.current?.close();
    wsRef.current = null;
    setStatus("idle");
    setTranscript([]);
  }, [stopMic]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    status,
    isMicActive,
    isAgentSpeaking,
    transcript,
    error,
    connect,
    disconnect,
    startMic,
    stopMic,
    sendPositionUpdate,
  };
}

// ---- Message types from backend ----

interface AudioMessage {
  type: "audio";
  data: string; // base64 PCM
}

interface AudioEndMessage {
  type: "audio_end";
}

interface TranscriptMessage {
  type: "transcript";
  role: "user" | "agent";
  text: string;
}

interface ErrorMessage {
  type: "error";
  message: string;
}

interface StatusMessage {
  type: "status";
  message: string;
}

type BackendMessage =
  | AudioMessage
  | AudioEndMessage
  | TranscriptMessage
  | ErrorMessage
  | StatusMessage;
