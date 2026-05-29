"""
Unit/integration tests for authentication:
- password-based registration,
- SimpleJWT login (token endpoint),
- /api/auth/me/,
- /api/auth/become-teacher/ with valid and invalid codes.
"""
from django.contrib.auth import get_user_model
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class RegistrationTests(APITestCase):
    url = "/api/auth/register/"

    def test_register_valid_user_creates_record(self):
        response = self.client.post(self.url, {
            "username": "alice",
            "email": "alice@example.com",
            "password": "Strong#Pass1",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username="alice").exists())
        self.assertNotEqual(User.objects.get(username="alice").password, "Strong#Pass1")

    def test_register_with_duplicate_username_fails(self):
        User.objects.create_user(username="bob", email="b@x.sk", password="xxxXXX1")
        response = self.client.post(self.url, {
            "username": "bob",
            "email": "other@x.sk",
            "password": "Strong#Pass1",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_with_short_password_fails(self):
        response = self.client.post(self.url, {
            "username": "carol",
            "email": "c@x.sk",
            "password": "12",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class JWTLoginTests(APITestCase):
    url = "/api/auth/token/"

    def setUp(self):
        self.user = User.objects.create_user(
            username="dan", email="d@x.sk", password="Strong#Pass1"
        )

    def test_token_endpoint_returns_pair_for_valid_credentials(self):
        response = self.client.post(self.url, {
            "username": "dan", "password": "Strong#Pass1",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_token_endpoint_rejects_invalid_credentials(self):
        response = self.client.post(self.url, {
            "username": "dan", "password": "wrong",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class MeViewTests(APITestCase):
    url = "/api/auth/me/"

    def setUp(self):
        self.user = User.objects.create_user(
            username="eve", email="e@x.sk", password="Strong#Pass1"
        )

    def test_me_returns_user_data_for_authenticated_request(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "eve")
        self.assertEqual(response.data["role"], User.Roles.STUDENT)

    def test_me_returns_401_for_unauthenticated_request(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


@override_settings(TEACHER_ACCESS_CODE="open-sesame")
class BecomeTeacherTests(APITestCase):
    url = "/api/auth/become-teacher/"

    def setUp(self):
        self.user = User.objects.create_user(
            username="frank", email="f@x.sk", password="Strong#Pass1"
        )
        self.client.force_authenticate(self.user)

    def test_become_teacher_with_valid_code(self):
        response = self.client.post(self.url, {"code": "open-sesame"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.role, User.Roles.TEACHER)

    def test_become_teacher_with_invalid_code_keeps_student(self):
        response = self.client.post(self.url, {"code": "nope"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.user.refresh_from_db()
        self.assertEqual(self.user.role, User.Roles.STUDENT)
