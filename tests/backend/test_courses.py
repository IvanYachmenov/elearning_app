"""
Unit tests for the public course catalog and student enrollment:
- public endpoints are reachable for anonymous visitors,
- an authenticated student can enroll in a course (idempotent),
- a course review is unique per (user, course) pair — a second
  submission overwrites the first.
"""
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from core.models import Course
from core.models.course import CourseReview

User = get_user_model()


class CourseCatalogTests(APITestCase):
    def setUp(self):
        self.teacher = User.objects.create_user(
            username="tch", email="t@x.sk", password="Strong#Pass1",
            role=User.Roles.TEACHER,
        )
        self.course = Course.objects.create(
            author=self.teacher, title="Python základy", slug="python-zaklady",
            description="Úvod do Pythonu.",
        )

    def test_public_catalog_visible_to_anonymous(self):
        response = self.client.get("/api/courses/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        titles = [c["title"] for c in results]
        self.assertIn("Python základy", titles)

    def test_course_detail_visible_to_anonymous(self):
        response = self.client.get(f"/api/courses/{self.course.pk}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Python základy")


class EnrollmentTests(APITestCase):
    def setUp(self):
        self.teacher = User.objects.create_user(
            username="tch", email="t@x.sk", password="Strong#Pass1",
            role=User.Roles.TEACHER,
        )
        self.student = User.objects.create_user(
            username="stu", email="s@x.sk", password="Strong#Pass1",
        )
        self.course = Course.objects.create(
            author=self.teacher, title="C", slug="c",
        )

    def test_enrolled_user_is_added_to_course_students(self):
        self.client.force_authenticate(self.student)
        url = f"/api/courses/{self.course.pk}/enroll/"
        response = self.client.post(url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(self.course.students.filter(pk=self.student.pk).exists())

    def test_anonymous_cannot_enroll(self):
        url = f"/api/courses/{self.course.pk}/enroll/"
        response = self.client.post(url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class CourseReviewTests(APITestCase):
    def setUp(self):
        self.teacher = User.objects.create_user(
            username="tch", email="t@x.sk", password="Strong#Pass1",
            role=User.Roles.TEACHER,
        )
        self.student = User.objects.create_user(
            username="stu", email="s@x.sk", password="Strong#Pass1",
        )
        self.course = Course.objects.create(
            author=self.teacher, title="C", slug="c",
        )
        self.client.force_authenticate(self.student)
        self.url = f"/api/courses/{self.course.pk}/reviews/"

    def test_create_review(self):
        response = self.client.post(self.url, {
            "rating": 5,
            "comment": "Great course",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            CourseReview.objects.filter(course=self.course, user=self.student).count(),
            1,
        )

    def test_second_review_overwrites_first(self):
        
        self.client.post(self.url, {"rating": 3}, format="json")
        self.client.post(self.url, {"rating": 5}, format="json")

        reviews = CourseReview.objects.filter(course=self.course, user=self.student)
        self.assertEqual(reviews.count(), 1)
        self.assertEqual(reviews.first().rating, 5)
