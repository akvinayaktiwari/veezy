"""Gemini Flash LLM integration for fast conversational responses."""
import asyncio
import logging
from typing import AsyncGenerator, Optional

from google import genai
from google.genai import types

from prompts import (
    VOICE_AGENT_SYSTEM_PROMPT,
    FALLBACK_RESPONSE,
    ERROR_RESPONSE
)

logger = logging.getLogger(__name__)


class GeminiLLM:
    """Google Gemini Flash integration for conversational AI responses."""

    def __init__(self, api_key: str, model: str = "gemini-2.0-flash"):
        """Initialize Gemini client with Flash model."""
        self.client = genai.Client(api_key=api_key)
        self.model_name = model
        self.generation_config = types.GenerateContentConfig(
            temperature=0.7,
            max_output_tokens=50,  # Reduced to force shorter responses (10-20 words)
            top_p=0.9,
            top_k=40
        )
        self.system_context = ""
        self.max_history_length = 10
        logger.info(f"Gemini LLM initialized with model: {model}")

    def set_system_context(self, agent_name: str = "Assistant", agent_knowledge: str = "") -> None:
        """Set agent knowledge/personality as system prompt."""
        self.system_context = VOICE_AGENT_SYSTEM_PROMPT.format(
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
                    text = response.text.strip()
                    
                    # Force truncate if response is too long (safety check)
                    # Split by sentence and take only first 1-2 sentences
                    sentences = text.replace('!', '.').replace('?', '.').split('.')
                    sentences = [s.strip() for s in sentences if s.strip()]
                    
                    if len(sentences) > 2:
                        text = '. '.join(sentences[:2]) + '.'
                        logger.warning(f"Truncated long response from {len(sentences)} to 2 sentences")
                    
                    return text
                
                logger.warning("Empty response from Gemini")
                return FALLBACK_RESPONSE
                
            except Exception as e:
                error_str = str(e)
                logger.error(f"Gemini API error (attempt {attempt + 1}): {e}")
                
                # Don't retry on quota/rate limit errors - they won't recover quickly
                if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str or "quota" in error_str.lower():
                    logger.warning("Quota exceeded - not retrying")
                    break
                
                if attempt < 2:
                    await asyncio.sleep(2 ** attempt)
                continue
        
        return ERROR_RESPONSE

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
