"""Gemini Flash LLM integration for fast conversational responses."""
import asyncio
import logging
from typing import AsyncGenerator, Optional

from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

DEFAULT_SYSTEM_PROMPT = """You are {agent_name}, a helpful voice assistant. {agent_knowledge}. 
Keep responses concise (1-2 sentences) since this is a voice conversation. 
Be natural and conversational. Avoid using markdown, bullet points, or numbered lists."""


class GeminiLLM:
    """Google Gemini Flash integration for conversational AI responses."""

    def __init__(self, api_key: str, model: str = "gemini-2.0-flash"):
        """Initialize Gemini client with Flash model."""
        self.client = genai.Client(api_key=api_key)
        self.model_name = model
        self.generation_config = types.GenerateContentConfig(
            temperature=0.7,
            max_output_tokens=150,
            top_p=0.9,
            top_k=40
        )
        self.system_context = ""
        self.max_history_length = 10
        logger.info(f"Gemini LLM initialized with model: {model}")

    def set_system_context(self, agent_name: str = "Assistant", agent_knowledge: str = "") -> None:
        """Set agent knowledge/personality as system prompt."""
        self.system_context = DEFAULT_SYSTEM_PROMPT.format(
            agent_name=agent_name,
            agent_knowledge=agent_knowledge or "You can help with general questions"
        )
        logger.debug(f"System context set for agent: {agent_name}")

    def _build_prompt(self, user_message: str, conversation_history: list) -> str:
        """Construct full prompt with system context and history."""
        prompt_parts = [self.system_context, "\nConversation:"]
        
        recent_history = conversation_history[-self.max_history_length:]
        for entry in recent_history:
            speaker = entry.get("speaker", "User")
            text = entry.get("text", "")
            prompt_parts.append(f"{speaker}: {text}")
        
        prompt_parts.append(f"User: {user_message}")
        prompt_parts.append("Assistant:")
        
        return "\n".join(prompt_parts)

    async def generate_response(
        self, 
        user_message: str, 
        conversation_history: Optional[list] = None
    ) -> str:
        """Generate AI response with retry logic."""
        if conversation_history is None:
            conversation_history = []
        
        prompt = self._build_prompt(user_message, conversation_history)
        
        for attempt in range(3):
            try:
                response = await asyncio.to_thread(
                    self.client.models.generate_content,
                    model=self.model_name,
                    contents=prompt,
                    config=self.generation_config
                )
                
                if response.text:
                    return response.text.strip()
                
                logger.warning("Empty response from Gemini")
                return "I'm not sure how to respond to that."
                
            except Exception as e:
                logger.error(f"Gemini API error (attempt {attempt + 1}): {e}")
                if attempt < 2:
                    await asyncio.sleep(2 ** attempt)
                continue
        
        return "I'm having trouble processing that right now. Could you try again?"

    async def stream_response(
        self, 
        user_message: str, 
        conversation_history: Optional[list] = None
    ) -> AsyncGenerator[str, None]:
        """Async generator for streaming response chunks."""
        if conversation_history is None:
            conversation_history = []
        
        prompt = self._build_prompt(user_message, conversation_history)
        
        try:
            # Note: Streaming might work differently with google.genai
            response = self.client.models.generate_content_stream(
                model=self.model_name,
                contents=prompt,
                config=self.generation_config
            )
            
            for chunk in response:
                if chunk.text:
                    yield chunk.text
                    
        except Exception as e:
            logger.error(f"Gemini streaming error: {e}")
            yield "I'm having trouble right now."

    def is_ready(self) -> bool:
        """Check if the LLM service is ready."""
        return self.client is not None
