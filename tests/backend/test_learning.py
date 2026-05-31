"""
Unit tests for the student-facing flow — fetching the next question,
grading answers, and running a code task with a mocked Code Runner.
"""
from unittest.mock import patch

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from core.models import Course, Module, Topic
from core.models.learning import (
    TopicProgress,
    TopicQuestion,
    TopicQuestionAnswer,
    TopicQuestionOption,
)

User = get_user_model()


def _build_course_with_question(question_type=TopicQuestion.QuestionType.SINGLE,
                                expected_output=""):
    teacher = User.objects.create_user(
        username="tch", email="t@x.sk", password="Strong#Pass1",
        role=User.Roles.TEACHER,
    )
    course = Course.objects.create(author=teacher, title="C", slug="c")
    module = Module.objects.create(course=course, title="M", order=0)
    topic = Topic.objects.create(module=module, title="T", order=0)
    question = TopicQuestion.objects.create(
        topic=topic, text="Q?", order=0,
        question_type=question_type,
        expected_output=expected_output,
    )
    return course, topic, question


class NextQuestionTests(APITestCase):
    def setUp(self):
        self.student = User.objects.create_user(
            username="stu", email="s@x.sk", password="Strong#Pass1",
        )
        self.course, self.topic, self.question = _build_course_with_question()
        self.course.students.add(self.student)
        self.client.force_authenticate(self.student)

    def test_next_question_returns_first_unanswered(self):
        response = self.client.get(
            f"/api/learning/topics/{self.topic.pk}/next-question/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["completed"])
        self.assertEqual(response.data["question"]["id"], self.question.id)

    def test_not_enrolled_user_is_rejected(self):
        outsider = User.objects.create_user(
            username="out", email="o@x.sk", password="Strong#Pass1",
        )
        self.client.force_authenticate(outsider)
        response = self.client.get(
            f"/api/learning/topics/{self.topic.pk}/next-question/"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class SubmitSingleChoiceAnswerTests(APITestCase):
    def setUp(self):
        self.student = User.objects.create_user(
            username="stu", email="s@x.sk", password="Strong#Pass1",
        )
        self.course, self.topic, self.question = _build_course_with_question()
        self.correct = TopicQuestionOption.objects.create(
            question=self.question, text="A", is_correct=True
        )
        self.wrong = TopicQuestionOption.objects.create(
            question=self.question, text="B", is_correct=False
        )
        self.course.students.add(self.student)
        self.client.force_authenticate(self.student)
        self.url = f"/api/learning/questions/{self.question.pk}/answer/"

    def test_correct_answer_is_marked_correct(self):
        response = self.client.post(self.url, {
            "selected_options": [self.correct.id],
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        answer = TopicQuestionAnswer.objects.get(
            user=self.student, question=self.question,
        )
        self.assertTrue(answer.is_correct)
        self.assertEqual(answer.score, 100)

    def test_wrong_answer_is_marked_incorrect(self):
        response = self.client.post(self.url, {
            "selected_options": [self.wrong.id],
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        answer = TopicQuestionAnswer.objects.get(
            user=self.student, question=self.question,
        )
        self.assertFalse(answer.is_correct)
        self.assertEqual(answer.score, 0)


class CodeQuestionTests(APITestCase):
    """
    Code-question tests mock the Code Runner microservice client so the
    suite does not need a running Docker container.
    """

    def setUp(self):
        self.student = User.objects.create_user(
            username="stu", email="s@x.sk", password="Strong#Pass1",
        )
        self.course, self.topic, self.question = _build_course_with_question(
            question_type=TopicQuestion.QuestionType.CODE,
            expected_output="42",
        )
        self.course.students.add(self.student)
        self.client.force_authenticate(self.student)
        self.url = f"/api/learning/questions/{self.question.pk}/answer/"

    @patch("core.views.learning.practice.run_python_code")
    def test_code_matching_expected_output_is_correct(self, mocked_run):
        mocked_run.return_value = {
            "status": "completed",
            "stdout": "42",
            "stderr": "",
            "exit_code": 0,
            "timed_out": False,
        }
        response = self.client.post(
            self.url, {"code": "print(42)"}, format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        answer = TopicQuestionAnswer.objects.get(
            user=self.student, question=self.question,
        )
        self.assertTrue(answer.is_correct)

    @patch("core.views.learning.practice.run_python_code")
    def test_code_with_wrong_output_is_incorrect(self, mocked_run):
        mocked_run.return_value = {
            "status": "completed",
            "stdout": "41",
            "stderr": "",
            "exit_code": 0,
            "timed_out": False,
        }
        response = self.client.post(
            self.url, {"code": "print(41)"}, format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        answer = TopicQuestionAnswer.objects.get(
            user=self.student, question=self.question,
        )
        self.assertFalse(answer.is_correct)


class TeacherEditReevaluatesAnswersTests(APITestCase):
    """
    When the teacher changes which option is marked as correct, the
    stored is_correct on existing TopicQuestionAnswer rows must be
    refreshed -- otherwise the history panel keeps showing the answer
    as wrong (or right) based on the now-outdated question definition.
    """

    def setUp(self):
        self.student = User.objects.create_user(
            username="stu", email="s@x.sk", password="Strong#Pass1",
        )
        self.course, self.topic, self.question = _build_course_with_question()
        # Re-use the teacher that _build_course_with_question already
        # created as the course author.
        self.teacher = self.course.author
        self.wrong_initially = TopicQuestionOption.objects.create(
            question=self.question, text="A", is_correct=True,
        )
        self.right_eventually = TopicQuestionOption.objects.create(
            question=self.question, text="B", is_correct=False,
        )
        self.course.students.add(self.student)
        # Student picks option B (which is currently marked wrong).
        self.client.force_authenticate(self.student)
        response = self.client.post(
            f"/api/learning/questions/{self.question.pk}/answer/",
            {"selected_options": [self.right_eventually.id]},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK,
                         msg=response.content)
        answer = TopicQuestionAnswer.objects.get(
            user=self.student, question=self.question,
        )
        self.assertFalse(answer.is_correct)

    def test_flipping_correct_option_reevaluates_stored_answer(self):
        # Teacher fixes the question: option B is the real correct one.
        self.client.force_authenticate(self.teacher)
        url = f"/api/teacher/topics/{self.topic.pk}/"
        payload = {
            "title": self.topic.title,
            "questions": [{
                "id": self.question.id,
                "text": self.question.text,
                "question_type": self.question.question_type,
                "options": [
                    {"id": self.wrong_initially.id, "text": "A",
                     "is_correct": False},
                    {"id": self.right_eventually.id, "text": "B",
                     "is_correct": True},
                ],
            }],
        }
        response = self.client.put(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK,
                         msg=response.content)

        answer = TopicQuestionAnswer.objects.get(
            user=self.student, question=self.question,
        )
        self.assertTrue(answer.is_correct)
        self.assertEqual(answer.score, 100)


class ResetTopicProgressTests(APITestCase):
    def setUp(self):
        self.student = User.objects.create_user(
            username="stu", email="s@x.sk", password="Strong#Pass1",
        )
        self.course, self.topic, self.question = _build_course_with_question()
        self.option = TopicQuestionOption.objects.create(
            question=self.question, text="A", is_correct=True,
        )
        self.course.students.add(self.student)
        self.client.force_authenticate(self.student)

        TopicQuestionAnswer.objects.create(
            user=self.student, question=self.question,
            is_correct=True, score=100,
        )
        TopicProgress.objects.create(
            user=self.student, topic=self.topic,
            status=TopicProgress.Status.COMPLETED,
        )

    def test_reset_clears_answers_and_progress(self):
        url = f"/api/learning/topics/{self.topic.pk}/reset/"
        response = self.client.post(url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(
            TopicQuestionAnswer.objects.filter(
                user=self.student, question__topic=self.topic,
            ).exists()
        )
        progress = TopicProgress.objects.filter(
            user=self.student, topic=self.topic,
        ).first()
        self.assertTrue(
            progress is None
            or progress.status == TopicProgress.Status.NOT_STARTED
        )
