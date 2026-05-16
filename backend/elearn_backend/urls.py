from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from core.views import GitHubOAuthLoginView, GitHubOAuthCallbackView

urlpatterns = [
    path('admin/', admin.site.urls),

    # JWT
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # GitHub OAuth (docs style paths, but returns our JWT flow)
    path("accounts/github/login/", GitHubOAuthLoginView.as_view(), name="github-oauth-login-accounts"),
    path("accounts/github/login/callback/", GitHubOAuthCallbackView.as_view(), name="github-oauth-callback-accounts"),

    # core
    path("api/", include("core.urls")),
]
