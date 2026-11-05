from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import get_settings
from app.core.rate_limit import limiter
from app.routes.chat import router as chat_router
from app.routes.chat_inquiry import router as chat_inquiry_router
from app.routes.health import router as health_router
from app.routes.leads import router as leads_router
from app.routes.admin import router as admin_router


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        docs_url='/docs',
        redoc_url='/redoc',
    )

    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origin_list,
        allow_credentials=True,
        allow_methods=['*'],
        allow_headers=['*'],
    )

    app.include_router(health_router, prefix=settings.api_prefix)
    app.include_router(chat_router, prefix=settings.api_prefix)
    app.include_router(chat_inquiry_router, prefix=settings.api_prefix)
    app.include_router(leads_router, prefix=settings.api_prefix)
    app.include_router(admin_router, prefix=settings.api_prefix)

    @app.get('/')
    async def root() -> dict[str, str]:
        return {'message': settings.app_name}

    return app


app = create_app()
