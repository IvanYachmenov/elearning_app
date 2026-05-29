"""
Unit tests for permissions:
- a student cannot reach teacher-only endpoints,
- a teacher only sees their own courses (get_queryset filter),
- accessing another teacher's course by direct id returns 404.
"""
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from core.models import Course

User = get_user_model()


class TeacherEndpointPermissionsTests(APITestCase):
    teacher_courses_url = "/api/teacher/courses/"

    def setUp(self):
        self.student = User.objects.create_user(
            username="stu1", email="s@x.sk", password="Strong#Pass1"
        )
        self.teacher = User.objects.create_user(
            username="tch1", email="t@x.sk", password="Strong#Pass1",
            role=User.Roles.TEACHER,
        )

    def test_student_cannot_list_teacher_courses(self):
        self.client.force_authenticate(self.student)
        response = self.client.get(self.teacher_courses_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_anonymous_cannot_list_teacher_courses(self):
        response = self.client.get(self.teacher_courses_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_teacher_can_list_own_courses(self):
        self.client.force_authenticate(self.teacher)
        response = self.client.get(self.teacher_courses_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class TeacherQuerysetIsolationTests(APITestCase):
    def setUp(self):
        self.teacher_a = User.objects.create_user(
            username="ta", email="ta@x.sk", password="Strong#Pass1",
            role=User.Roles.TEACHER,
        )
        self.teacher_b = User.objects.create_user(
            username="tb", email="tb@x.sk", password="Strong#Pass1",
            role=User.Roles.TEACHER,
        )
        self.course_a = Course.objects.create(
            author=self.teacher_a, title="A's course", slug="a-course",
        )
        self.course_b = Course.objects.create(
            author=self.teacher_b, title="B's course", slug="b-course",
        )

    def test_teacher_sees_only_own_courses_in_list(self):
        self.client.force_authenticate(self.teacher_a)
        response = self.client.get("/api/teacher/courses/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        titles = [c["title"] for c in response.data.get("results", response.data)]
        self.assertIn("A's course", titles)
        self.assertNotIn("B's course", titles)

    def test_teacher_cannot_retrieve_foreign_course(self):
        self.client.force_authenticate(self.teacher_a)
        response = self.client.get(f"/api/teacher/courses/{self.course_b.pk}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
