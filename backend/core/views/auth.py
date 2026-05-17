from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.utils.text import slugify
from allauth.socialaccount.models import SocialAccount
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from django.core import signing
from django.http import HttpResponseRedirect
from django.urls import reverse
import json
import urllib.parse
import urllib.request
import uuid
import jwt

from ..models import User
from ..serializers import UserSerializer, RegisterSerializer

User = get_user_model()

# POST /api/auth/register/
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = (permissions.AllowAny,)

# GET/PATCH /api/auth/me/
class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


# POST /api/auth/become-teacher/
class BecomeTeacherView(APIView):
    """Upgrade the current student to a teacher using a pre-shared code."""
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        configured_code = (settings.TEACHER_ACCESS_CODE or "").strip()
        submitted_code = str(request.data.get("code", "")).strip()

        if not configured_code:
            return Response(
                {"detail": "Teacher access is not configured."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        user = request.user
        if user.role == User.Roles.TEACHER:
            return Response(UserSerializer(user, context={"request": request}).data)

        if not submitted_code or submitted_code != configured_code:
            return Response(
                {"detail": "Invalid teacher access code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.role = User.Roles.TEACHER
        user.save(update_fields=["role"])
        return Response(UserSerializer(user, context={"request": request}).data)


# POST /api/auth/google/
class GoogleOAuthView(APIView):
    permission_classes = (permissions.AllowAny,)
    
    def post(self, request):
        """
        Authenticate user with Google OAuth ID token
        
        Request body:
        {
            "token": "google_id_token_string"
        }
        
        Returns:
        {
            "access": "jwt_access_token",
            "refresh": "jwt_refresh_token",
            "user": {...user_data...}
        }
        """
        id_token = request.data.get('token')
        
        if not id_token:
            return Response(
                {'detail': 'Google ID token is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Decode and verify Google ID token
            try:
                # Decode token (without signature verification for now)
                # Frontend should verify the token before sending
                decoded = jwt.decode(id_token, options={"verify_signature": False})
                
                # Verify issuer
                if decoded.get('iss') not in ['accounts.google.com', 'https://accounts.google.com']:
                    return Response(
                        {'detail': 'Invalid token issuer.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Extract user data from token
                user_data = {
                    'sub': decoded.get('sub'),
                    'email': decoded.get('email', ''),
                    'email_verified': decoded.get('email_verified', False),
                    'name': decoded.get('name', ''),
                    'given_name': decoded.get('given_name', ''),
                    'family_name': decoded.get('family_name', ''),
                    'picture': decoded.get('picture', ''),
                }
                
            except jwt.DecodeError:
                return Response(
                    {'detail': 'Invalid token format.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            except Exception as e:
                return Response(
                    {'detail': f'Failed to process Google token: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not user_data:
                return Response(
                    {'detail': 'Invalid Google token.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get or create user using allauth models
            user = self._get_or_create_user(user_data)
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)
            
            # Serialize user data
            serializer = UserSerializer(user, context={'request': request})
            
            return Response({
                'access': access_token,
                'refresh': refresh_token,
                'user': serializer.data
            })
            
        except Exception as e:
            return Response(
                {'detail': f'Authentication failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _get_or_create_user(self, user_data):
        """
        Get or create user from Google OAuth data using allauth models
        """
        google_id = user_data.get('sub')
        email = user_data.get('email', '')
        
        # Try to find existing user by social account (allauth)
        try:
            social_account = SocialAccount.objects.get(provider='google', uid=google_id)
            user = social_account.user
            self._update_user_from_data(user, user_data)
            return user
        except SocialAccount.DoesNotExist:
            pass
        
        # Try to find by email (for linking accounts)
        if email:
            user = User.objects.filter(email=email).order_by('id').first()
            if user is not None:
                # Link social account if not already linked
                if not SocialAccount.objects.filter(user=user, provider='google').exists():
                    SocialAccount.objects.create(
                        user=user,
                        provider='google',
                        uid=google_id,
                        extra_data=user_data
                    )
                self._update_user_from_data(user, user_data)
                return user
        
        # Create new user
        username_base = email.split('@')[0] if email else slugify(user_data.get('name', 'user'))
        username = username_base
        counter = 1
        
        while User.objects.filter(username=username).exists():
            username = f"{username_base}{counter}"
            counter += 1
        
        user = User.objects.create_user(
            username=username,
            email=email or '',
            google_id=google_id,
            auth_provider='google',
            email_verified=user_data.get('email_verified', False),
            first_name=user_data.get('given_name', ''),
            last_name=user_data.get('family_name', ''),
        )
        
        # Create social account association (allauth)
        SocialAccount.objects.create(
            user=user,
            provider='google',
            uid=google_id,
            extra_data=user_data
        )
        
        return user
    
    def _update_user_from_data(self, user, user_data):
        """Update user fields from OAuth data"""
        if not user.google_id:
            user.google_id = user_data.get('sub') or user_data.get('id')
        if user.auth_provider != 'google':
            user.auth_provider = 'google'
        if user_data.get('email_verified'):
            user.email_verified = True
        if not user.first_name and user_data.get('given_name'):
            user.first_name = user_data.get('given_name')
        if not user.last_name and user_data.get('family_name'):
            user.last_name = user_data.get('family_name')
        user.save()


# GET /api/auth/github/login/
class GitHubOAuthLoginView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        provider = getattr(settings, "SOCIALACCOUNT_PROVIDERS", {}).get("github", {})
        app = provider.get("APP", {}) or {}
        client_id = (app.get("client_id") or "").strip()
        if not client_id:
            return Response(
                {"detail": "GitHub OAuth is not configured (missing GITHUB_CLIENT_ID)."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        scope = " ".join(provider.get("SCOPE", []) or [])

        next_path = request.GET.get("next")
        if not (isinstance(next_path, str) and next_path.startswith("/")):
            next_path = None

        state = signing.dumps(
            {"nonce": uuid.uuid4().hex, "next": next_path},
            salt="github-oauth",
        )

        params = {
            "client_id": client_id,
            "scope": scope,
            "state": state,
        }
        # Allow forcing account chooser so user can link a different GitHub account
        if request.GET.get("select_account") in {"1", "true", "yes"}:
            params["prompt"] = "select_account"

        url = "https://github.com/login/oauth/authorize?" + urllib.parse.urlencode(params)
        return HttpResponseRedirect(url)


# GET /api/auth/github/callback/
class GitHubOAuthCallbackView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        error = request.GET.get("error")
        if error:
            return self._redirect_to_frontend(error=error)

        code = request.GET.get("code")
        state = request.GET.get("state")

        if not code or not state:
            return self._redirect_to_frontend(error="missing_code_or_state")

        try:
            state_payload = signing.loads(state, salt="github-oauth", max_age=10 * 60)
        except Exception:
            return self._redirect_to_frontend(error="invalid_state")

        provider = getattr(settings, "SOCIALACCOUNT_PROVIDERS", {}).get("github", {})
        app = provider.get("APP", {}) or {}
        client_id = (app.get("client_id") or "").strip()
        client_secret = (app.get("secret") or "").strip()
        if not client_id or not client_secret:
            return self._redirect_to_frontend(error="github_oauth_not_configured")

        token = self._exchange_code_for_token(
            client_id=client_id,
            client_secret=client_secret,
            code=code,
            state=state,
        )
        if not token:
            return self._redirect_to_frontend(error="token_exchange_failed")

        gh_user = self._github_get_json("https://api.github.com/user", token)
        if not gh_user or not gh_user.get("id"):
            return self._redirect_to_frontend(error="github_user_fetch_failed")

        gh_emails = self._github_get_json("https://api.github.com/user/emails", token) or []
        email, email_verified = self._select_email(gh_user, gh_emails)

        user = self._get_or_create_user_from_github(
            gh_user=gh_user,
            email=email,
            email_verified=email_verified,
        )

        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        next_path = None
        if isinstance(state_payload, dict):
            next_path = state_payload.get("next")

        return self._redirect_to_frontend(access=access_token, refresh=refresh_token, next_path=next_path)

    def _exchange_code_for_token(self, *, client_id, client_secret, code, state):
        data = urllib.parse.urlencode(
            {
                "client_id": client_id,
                "client_secret": client_secret,
                "code": code,
                "state": state,
            }
        ).encode("utf-8")

        req = urllib.request.Request(
            "https://github.com/login/oauth/access_token",
            data=data,
            headers={"Accept": "application/json"},
            method="POST",
        )

        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                payload = json.loads(resp.read().decode("utf-8"))
                return payload.get("access_token")
        except Exception:
            return None

    def _github_get_json(self, url, token):
        req = urllib.request.Request(
            url,
            headers={
                "Accept": "application/json",
                "Authorization": f"token {token}",
                "User-Agent": "elearn-backend",
            },
            method="GET",
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except Exception:
            return None

    def _select_email(self, gh_user, gh_emails):
        # Prefer primary verified email from /user/emails.
        if isinstance(gh_emails, list):
            primary_verified = next(
                (e for e in gh_emails if e.get("primary") and e.get("verified") and e.get("email")),
                None,
            )
            if primary_verified:
                return primary_verified.get("email"), True

            any_verified = next((e for e in gh_emails if e.get("verified") and e.get("email")), None)
            if any_verified:
                return any_verified.get("email"), True

        # Fallback: GitHub user email (often null if private)
        email = gh_user.get("email")
        return (email or ""), False

    def _get_or_create_user_from_github(self, *, gh_user, email, email_verified):
        github_id = str(gh_user.get("id"))
        login = (gh_user.get("login") or "").strip()
        name = (gh_user.get("name") or "").strip()

        # Try to find existing user by social account (allauth)
        try:
            social_account = SocialAccount.objects.get(provider="github", uid=github_id)
            user = social_account.user
            self._update_user_from_github(user, github_id=github_id, email=email, email_verified=email_verified, name=name)
            return user
        except SocialAccount.DoesNotExist:
            pass

        # Try to find by email (for linking accounts)
        if email:
            user = User.objects.filter(email=email).order_by("id").first()
            if user is not None:
                if not SocialAccount.objects.filter(user=user, provider="github").exists():
                    SocialAccount.objects.create(
                        user=user,
                        provider="github",
                        uid=github_id,
                        extra_data=gh_user,
                    )
                self._update_user_from_github(user, github_id=github_id, email=email, email_verified=email_verified, name=name)
                return user

        # Create new user
        username_base = login or (email.split("@")[0] if email else "githubuser")
        username = slugify(username_base) or "githubuser"
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{slugify(username_base) or 'githubuser'}{counter}"
            counter += 1

        first_name = ""
        last_name = ""
        if name:
            parts = name.split(" ", 1)
            first_name = parts[0]
            if len(parts) > 1:
                last_name = parts[1]

        user = User.objects.create_user(
            username=username,
            email=email or "",
            github_id=github_id,
            auth_provider="github",
            email_verified=bool(email_verified),
            first_name=first_name,
            last_name=last_name,
        )

        SocialAccount.objects.create(
            user=user,
            provider="github",
            uid=github_id,
            extra_data=gh_user,
        )
        return user

    def _update_user_from_github(self, user, *, github_id, email, email_verified, name):
        if not user.github_id:
            user.github_id = github_id
        if user.auth_provider != "github":
            user.auth_provider = "github"
        if email and not user.email:
            user.email = email
        if email_verified:
            user.email_verified = True
        if name and (not user.first_name and not user.last_name):
            parts = name.split(" ", 1)
            user.first_name = parts[0]
            if len(parts) > 1:
                user.last_name = parts[1]
        user.save()

    def _redirect_to_frontend(self, *, access=None, refresh=None, error=None, next_path=None):
        base = (getattr(settings, "FRONTEND_URL", "") or "http://localhost:5173").rstrip("/")
        params = {}
        if access and refresh:
            params["access"] = access
            params["refresh"] = refresh
            params["provider"] = "github"
        if next_path and isinstance(next_path, str) and next_path.startswith("/"):
            params["next"] = next_path
        if error:
            params["error"] = error

        url = f"{base}/login"
        if params:
            url += "?" + urllib.parse.urlencode(params)
        return HttpResponseRedirect(url)


class SocialConnectionsView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        return Response(
            {
                "google": SocialAccount.objects.filter(user=request.user, provider="google").exists(),
                "github": SocialAccount.objects.filter(user=request.user, provider="github").exists(),
            }
        )


class SocialDisconnectView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request, provider: str):
        provider = (provider or "").lower().strip()
        if provider not in {"google", "github"}:
            return Response({"detail": "Unsupported provider."}, status=status.HTTP_400_BAD_REQUEST)

        SocialAccount.objects.filter(user=request.user, provider=provider).delete()

        # Keep local user fields consistent with disconnect
        if provider == "google":
            request.user.google_id = None
        if provider == "github" and hasattr(request.user, "github_id"):
            request.user.github_id = None
        if request.user.auth_provider == provider:
            request.user.auth_provider = "email"
        request.user.save(update_fields=["google_id", "auth_provider"] + (["github_id"] if hasattr(request.user, "github_id") else []))

        return Response({"detail": "Disconnected."})
