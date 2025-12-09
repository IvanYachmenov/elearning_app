from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import (
    Course,
    Topic,
    TopicProgress,
    TopicQuestion,
    TopicQuestionOption,
    TopicQuestionAnswer,
)

from ..serializers import (
    LearningCourseSerializer,
    TopicTheorySerializer,
    TopicPracticeQuestionSerializer,
    TopicQuestionAnswerSubmitSerializer,

)
from ..serializers.learning import TopicPracticeHistoryQuestionSerializer


class LearningCourseDetailView(APIView):
    """
    GET /api/learning/courses/<id>/ -> course with modules, topics and progress of user
    """
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, pk):
        try:
            course = (
                Course.objects
                .select_related("author")
                .prefetch_related("modules__topics")
                .get(pk=pk)
            )
        except Course.DoesNotExist:
            return Response(
                {"detail": "Course not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not request.user.enrolled_courses.filter(pk=course.pk).exists():
            return Response(
                {"detail": "You are not enrolled in this course."},
                status=status.HTTP_403_FORBIDDEN,
            )
        progress_qs = (TopicProgress.objects
            .filter(user=request.user, topic__module__course=course)
            .select_related("topic")
        )
        progress_map = {p.topic.id: p for p in progress_qs}
        serializer = LearningCourseSerializer(
            course,
            context={"request": request, "progress_map": progress_map},
        )
        return Response(serializer.data)

class TopicTheoryView(APIView):
    """
    GET /api/learning/topics/<id>/
    """
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, pk):
        try:
            topic = Topic.objects.select_related("module__course").get(pk=pk)
        except Topic.DoesNotExist:
            return Response(
                {"detail": "Topic not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        course = topic.module.course
        if not course.students.filter(pk=request.user.pk).exists():
            return Response(
                {"detail": "You are not enrolled in this course."},
                status=status.HTTP_403_FORBIDDEN,
            )

        progress = TopicProgress.objects.filter(
            user=request.user,
            topic=topic
        ).first()

        serializer = TopicTheorySerializer(
            topic,
            context={"request": request,"topic_progress": progress},
        )
        return Response(serializer.data)

class TopicNextQuestionView(APIView):
    """
    GET /api/learning/topics/<id>/next-question/
    """
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, pk):
        try:
            topic = Topic.objects.select_related("module__course").get(pk=pk)
        except Topic.DoesNotExist:
            return Response(
                {"detail": "Topic not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        course = topic.module.course
        if not course.students.filter(pk=request.user.pk).exists():
            return Response(
                {"detail": "You are not enrolled in this course."},
                status=status.HTTP_403_FORBIDDEN,
            )

        questions = list(
            TopicQuestion.objects.filter(topic=topic).order_by("order", "id")
        )
        total_questions = len(questions)

        answers_qs = (
            TopicQuestionAnswer.objects
            .filter(user=request.user, question__topic=topic)
            .select_related("question")
            .prefetch_related("selected_options")
        )
        answers_by_qid = {a.question_id: a for a in answers_qs}

        correct_count = sum(1 for a in answers_qs if a.is_correct)

        next_question = None
        last_answer = None

        for q in questions:
            ans = answers_by_qid.get(q.id)
            if ans is not None and not ans.is_correct:
                next_question = q
                last_answer = ans
                break

        if next_question is None:
            for q in questions:
                if q.id not in answers_by_qid:
                    next_question = q
                    last_answer = None
                    break

        completed = next_question is None

        answered_count = correct_count
        progress_percent = (
            round(answered_count * 100 / total_questions) if total_questions else 0
        )

        if completed:
            TopicProgress.objects.update_or_create(
                user=request.user,
                topic=topic,
                defaults={
                    "status": TopicProgress.Status.COMPLETED,
                    "score": 100,
                    "completed_at": timezone.now(),
                },
            )
            return Response({
                "completed": True,
                "topic_id": topic.id,
                "topic_title": topic.title,
                "total_questions": total_questions,
                "answered_questions": answered_count,
                "progress_percent": 100,
                "question": None,
                "last_answer": None,
            })

        serializer = TopicPracticeQuestionSerializer(next_question)

        last_answer_payload = None
        if last_answer is not None:
            last_answer_payload = {
                "is_correct": last_answer.is_correct,
                "selected_option_ids": list(
                    last_answer.selected_options.values_list("id", flat=True)
                ),
                "score": last_answer.score,
            }

        return Response({
            "completed": False,
            "topic_id": topic.id,
            "topic_title": topic.title,
            "total_questions": total_questions,
            "answered_questions": answered_count,
            "progress_percent": progress_percent,
            "question": serializer.data,
            "last_answer": last_answer_payload,
        })


class TopicQuestionAnswerView(APIView):
    """
    POST /api/learning/questions/<id>/answer/
    """
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, pk):
        try:
            question = TopicQuestion.objects.select_related(
                "topic__module__course"
            ).get(pk=pk)
        except TopicQuestion.DoesNotExist:
            return Response(
                {"detail": "Question not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        topic = question.topic
        course = topic.module.course
        if not course.students.filter(pk=request.user.pk).exists():
            return Response(
                {"detail": "You are not enrolled in this course."},
                status=status.HTTP_403_FORBIDDEN,
            )

        data_serializer = TopicQuestionAnswerSubmitSerializer(data=request.data)
        data_serializer.is_valid(raise_exception=True)
        option_ids = data_serializer.validated_data["selected_options"]

        options_qs = TopicQuestionOption.objects.filter(
            question=question, id__in=option_ids,
        )
        if options_qs.count() != len(option_ids):
            return Response(
                {"detail": "Invalid options for this question."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # validation
        if (
            question.question_type == TopicQuestion.QuestionType.SINGLE
            and len(option_ids) != 1
        ):
            return Response(
                {"detail": "Exactly one option must be selected."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if (
                question.question_type == TopicQuestion.QuestionType.MULTI
                and len(option_ids) < 1
        ):
            return Response(
                {"detail": "Select at least one option."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        correct_ids = set(
            question.options.filter(is_correct=True).values_list("id", flat=True)
        )
        selected_set = set(option_ids)

        is_correct = bool(correct_ids) and (selected_set == correct_ids)
        score = question.max_score if is_correct else 0

        # Save answer
        answer, _ = TopicQuestionAnswer.objects.get_or_create(
            user=request.user,
            question=question,
        )
        answer.is_correct = is_correct
        answer.score = score
        answer.answered_at = timezone.now()
        answer.save()
        answer.selected_options.set(option_ids)

        # Count progress on topic
        all_q_count = TopicQuestion.objects.filter(topic=topic).count()
        correct_answers_qs = TopicQuestionAnswer.objects.filter(
            user=request.user,
            question__topic=topic,
            is_correct=True,
        )

        answered_count = correct_answers_qs.count()

        progress_percent = (
            round(answered_count * 100 / all_q_count)
            if all_q_count
            else 0
        )

        status_value = TopicProgress.Status.IN_PROGRESS
        completed_at = None
        if all_q_count and answered_count >= all_q_count:
            status_value = TopicProgress.Status.COMPLETED
            completed_at = timezone.now()

        TopicProgress.objects.update_or_create(
            user=request.user,
            topic=topic,
            defaults={
                "status": status_value,
                "score": progress_percent,
                "completed_at": completed_at,
            },
        )

        return Response(
            {
                "is_correct": is_correct,
                "score": score,
                "answered_questions": answered_count,
                "total_questions": all_q_count,
                "topic_progress_percent": progress_percent,
            }
        )


class TopicPracticeHistoryView(APIView):
    """
    GET /api/learning/topics/<id>/history/ -> returns all questions of the topic
                                            and test options
                                            and options which user chose
    """

    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, pk):
        try:
            topic = Topic.objects.select_related("module__course").get(pk=pk)
        except Topic.DoesNotExist:
            return Response(
                {"detail": "Topic not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        course = topic.module.course
        if not course.students.filter(pk=request.user.pk).exists():
            return Response(
                {"detail": "You are not enrolled in this course."},
                status=status.HTTP_403_FORBIDDEN,
            )

        progress = (TopicProgress.objects.filter(
            user=request.user,
            topic=topic
        ).first())
        if not progress or progress.status != TopicProgress.Status.COMPLETED:
            return Response(
                {"detail": "History is available only for completed topics."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        questions_qs = (
            TopicQuestion.objects
                .filter(topic=topic)
                .order_by("order", "id")
        )

        answers_qs = (
            TopicQuestionAnswer.objects
                .filter(user=request.user, question__topic=topic)
                .select_related("question")
                .prefetch_related("selected_options")
        )
        answers_map = {a.question_id: a for a in answers_qs}
        serializer = TopicPracticeHistoryQuestionSerializer(
            questions_qs,
            many=True,
            context={"user_answers_map": answers_map},
        )

        return Response({
            "topic_id": topic.id,
            "topic_title": topic.title,
            "questions": serializer.data,
        })

