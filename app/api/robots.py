from fastapi import APIRouter
from fastapi.responses import PlainTextResponse

router = APIRouter()

@router.get("/robots.txt", response_class=PlainTextResponse)
def get_robots_txt():
    """
    Serves a realistic robots.txt with a mix of legitimate and bait routes.
    Designed to act as reconnaissance bait for attackers.
    """
    content = [
        "User-agent: *",
        "",
        "Disallow: /admin",
        "Disallow: /admin/login",
        "Disallow: /admin/dashboard",
        "Disallow: /api/admin",
        "Disallow: /api/internal",
        "Disallow: /api/internal/debug",
        "Disallow: /api/secrets",
        "Disallow: /api/config",
        "Disallow: /api/config/auth",
        "Disallow: /api/users/export",
        "Disallow: /api/payment-history",
        "Disallow: /hidden",
        "Disallow: /backup",
        "Disallow: /private",
        "Disallow: /dev",
        "Disallow: /staging",
        "Disallow: /old-admin",
        "",
        "Sitemap: /sitemap.xml",
    ]
    return "\n".join(content)
