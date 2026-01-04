export interface PythonSessionResponse {
  room_name: string;
  participant_token: string;
  agent_token: string;
  session_id: string;
}

export interface VoiceSessionStatus {
  active: boolean;
  duration_seconds: number;
  partial_transcript: string;
}

export interface VoiceSessionEnd {
  success: boolean;
  transcript: string;
  duration: number;
}

export interface PythonHealthResponse {
  status: string;
  services: {
    stt: boolean;
    llm: boolean;
    tts: boolean;
  };
}
