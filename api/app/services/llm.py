from __future__ import annotations

from collections.abc import AsyncIterator

from openai import AsyncOpenAI

from app.core.config import Settings, get_settings


class LLMService:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self.client = AsyncOpenAI(
            api_key=self.settings.llm_api_key,
            base_url='https://api.groq.com/openai/v1',
            timeout=self.settings.llm_timeout_seconds,
            max_retries=self.settings.llm_max_retries,
        ) if self.settings.llm_api_key else None

    async def stream_reply(self, messages: list[dict[str, str]]) -> AsyncIterator[str]:
        if not self.client:
            raise RuntimeError('LLM_API_KEY is not configured')

        response = await self.client.chat.completions.create(
            model=self.settings.llm_model,
            messages=messages,
            temperature=self.settings.llm_temperature,
            max_completion_tokens=self.settings.llm_max_output_tokens,
            stream=True,
        )

        async for chunk in response:
            content = chunk.choices[0].delta.content
            if isinstance(content, str) and content:
                yield content


llm_service = LLMService()
