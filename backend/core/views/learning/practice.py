from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from ...models import (
    Topic,
    TopicProgress,
    TopicQuestion,
    TopicQuestionOption,
    TopicQuestionAnswer,
    TopicQuestionHint,
)
from ...learning_stats import get_topic_practice_stats, get_topic_progress_duration_seconds
from ...serializers import (
    TopicQuestionHintSerializer,
    TopicPracticeQuestionSerializer,
    TopicQuestionAnswerSubmitSerializer,
    TopicQuestionCodeRunSerializer,
)
from ...services.code_runner import CodeRunnerError, run_python_code
from .utils import (
    get_topic_time_limit_seconds,
    calculate_score_percent,
    ensure_topic_progress,
)


def is_code_run_successful(run_result: dict) -> bool:
    return (
        run_result.get("status") == "completed"
        and run_result.get("exit_code") == 0
        and not run_result.get("timed_out")
    )


def normalize_code_output(value: str) -> str:
    normalized = value.replace("\r\n", "\n").replace("\r", "\n")
    lines = [line.rstrip() for line in normalized.split("\n")]
    return "\n".join(lines).rstrip("\n")


def code_output_matches(actual: str, expected: str) -> bool:
    return normalize_code_output(actual) == normalize_code_output(expected)


def build_code_run_response(run_result: dict) -> dict:
    return {
        "status": run_result.get("status", "error"),
        "stdout": run_result.get("stdout", ""),
        "stderr": run_result.get("stderr", ""),
        "exit_code": run_result.get("exit_code"),
        "timed_out": bool(run_result.get("timed_out")),
    }


# GET /api/learning/topics/<id>/next-question/
class TopicNextQuestionView(APIView):
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

        time_limit_seconds = get_topic_time_limit_seconds(topic)
        is_timed = bool(time_limit_seconds)
        progress = ensure_topic_progress(request.user, topic, is_timed, time_limit_seconds)

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

        if is_timed:
            now = timezone.now()
            limit_seconds = progress.time_limit_seconds or time_limit_seconds or 0
            elapsed_seconds = (
                int((now - progress.started_at).total_seconds())
                if progress.started_at else 0
            )
            remaining_seconds = max(limit_seconds - elapsed_seconds, 0)

            timed_out = progress.timed_out or remaining_seconds <= 0
            answered_total = len(answers_by_qid)
            completed = (
                    timed_out
                    or answered_total >= total_questions
                    or progress.status in (
                        TopicProgress.Status.COMPLETED,
                        TopicProgress.Status.FAILED,
                    )
            )
            score_percent = calculate_score_percent(correct_count, total_questions)
            passed = (
                    completed
                    and not timed_out
                    and total_questions > 0
                    and correct_count == total_questions
            )

            if timed_out and not progress.timed_out:
                progress.timed_out = True

            if completed:
                status_value = (
                    TopicProgress.Status.COMPLETED
                    if passed
                    else TopicProgress.Status.FAILED
                )
                progress.status = status_value
                progress.score = score_percent
                if not progress.completed_at:
                    progress.completed_at = now
                progress.is_timed = True
                progress.time_limit_seconds = limit_seconds
                progress.save(
                    update_fields=[
                        "status",
                        "score",
                        "completed_at",
                        "timed_out",
                        "is_timed",
                        "time_limit_seconds",
                    ],
                )
                return Response({
                    "completed": True,
                    "is_timed": True,
                    "timed_out": timed_out,
                    "passed": passed,
                    "topic_id": topic.id,
                    "topic_title": topic.title,
                    "total_questions": total_questions,
                    "answered_questions": answered_total,
                    "correct_answers": correct_count,
                    "progress_percent": calculate_score_percent(
                        answered_total,
                        total_questions,
                    ),
                    "score_percent": score_percent,
                    "practice_stats": get_topic_practice_stats(topic),
                    "remaining_seconds": remaining_seconds,
                    "time_limit_seconds": limit_seconds,
                    "duration_seconds": get_topic_progress_duration_seconds(progress),
                    "question": None,
                    "last_answer": None,
                })

            next_question = None
            for q in questions:
                if q.id not in answers_by_qid:
                    next_question = q
                    break

            serializer = TopicPracticeQuestionSerializer(next_question)
            return Response({
                "completed": False,
                "is_timed": True,
                "timed_out": False,
                "topic_id": topic.id,
                "topic_title": topic.title,
                "total_questions": total_questions,
                "answered_questions": answered_total,
                "correct_answers": correct_count,
                "progress_percent": calculate_score_percent(
                    answered_total,
                    total_questions,
                ),
                "score_percent": score_percent,
                "practice_stats": get_topic_practice_stats(topic),
                "time_limit_seconds": limit_seconds,
                "remaining_seconds": remaining_seconds,
                "duration_seconds": None,
                "question": serializer.data,
                "last_answer": None,
            })

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
                "is_timed": False,
                "timed_out": False,
                "passed": True,
                "topic_id": topic.id,
                "topic_title": topic.title,
                "total_questions": total_questions,
                "answered_questions": answered_count,
                "correct_answers": answered_count,
                "progress_percent": 100,
                "score_percent": 100,
                "practice_stats": get_topic_practice_stats(topic),
                "time_limit_seconds": None,
                "remaining_seconds": None,
                "duration_seconds": None,
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
                "submitted_code": last_answer.submitted_code,
                "stdout": last_answer.stdout,
                "stderr": last_answer.stderr,
                "exit_code": last_answer.exit_code,
                "score": last_answer.score,
            }

        return Response({
            "completed": False,
            "is_timed": False,
            "timed_out": False,
            "passed": None,
            "topic_id": topic.id,
            "topic_title": topic.title,
            "total_questions": total_questions,
            "answered_questions": answered_count,
            "correct_answers": answered_count,
            "progress_percent": progress_percent,
            "score_percent": progress_percent,
            "practice_stats": get_topic_practice_stats(topic),
            "time_limit_seconds": None,
            "remaining_seconds": None,
            "duration_seconds": None,
            "question": serializer.data,
            "last_answer": last_answer_payload,
        })


# POST /api/learning/questions/<id>/answer/
class TopicQuestionAnswerView(APIView):
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

        time_limit_seconds = get_topic_time_limit_seconds(topic)
        is_timed = bool(time_limit_seconds)
        progress = ensure_topic_progress(request.user, topic, is_timed, time_limit_seconds)

        data_serializer = TopicQuestionAnswerSubmitSerializer(data=request.data)
        data_serializer.is_valid(raise_exception=True)

        if question.question_type == TopicQuestion.QuestionType.CODE:
            code = data_serializer.validated_data.get("code", "")
            try:
                run_result = run_python_code(code)
            except CodeRunnerError as error:
                return Response(
                    {"detail": str(error)},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )

            is_correct = (
                is_code_run_successful(run_result)
                and code_output_matches(
                    run_result.get("stdout", ""),
                    question.expected_output,
                )
            )
            score = question.max_score if is_correct else 0

            answer, _ = TopicQuestionAnswer.objects.get_or_create(
                user=request.user,
                question=question,
            )
            answer.is_correct = is_correct
            answer.score = score
            answer.submitted_code = code
            answer.stdout = run_result.get("stdout", "")
            answer.stderr = run_result.get("stderr", "")
            answer.exit_code = run_result.get("exit_code")
            answer.answered_at = timezone.now()
            answer.save()
            answer.selected_options.clear()
        else:
            option_ids = data_serializer.validated_data["selected_options"]

            options_qs = TopicQuestionOption.objects.filter(
                question=question, id__in=option_ids,
            ) if option_ids else TopicQuestionOption.objects.none()

            if option_ids and options_qs.count() != len(option_ids):
                return Response(
                    {"detail": "Invalid options for this question."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if not is_timed:
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
                else:
                    if (
                            question.question_type == TopicQuestion.QuestionType.SINGLE
                            and len(option_ids) > 1
                    ):
                        return Response(
                            {"detail": "Select no more than one option."},
                            status=status.HTTP_400_BAD_REQUEST,
                        )

                if is_timed:
                    now = timezone.now()
                    limit_seconds = progress.time_limit_seconds or time_limit_seconds or 0
                    elapsed_seconds = (
                        int((now - progress.started_at).total_seconds())
                        if progress.started_at else 0
                    )
                    remaining_seconds = max(limit_seconds - elapsed_seconds, 0)

                    answers_before = TopicQuestionAnswer.objects.filter(
                        user=request.user,
                        question__topic=topic,
                    )
                    correct_before = answers_before.filter(is_correct=True).count()

                    if remaining_seconds <= 0:
                        score_percent = calculate_score_percent(
                            correct_before,
                            TopicQuestion.objects.filter(topic=topic).count(),
                        )
                        progress.status = TopicProgress.Status.FAILED
                        progress.timed_out = True
                        progress.score = score_percent
                        progress.completed_at = progress.completed_at or now
                        progress.save(
                            update_fields=[
                                "status",
                                "timed_out",
                                "score",
                                "completed_at",
                            ]
                        )
                        return Response(
                            {
                                "is_correct": False,
                                "score": 0,
                                "answered_questions": answers_before.count(),
                                "total_questions": TopicQuestion.objects.filter(topic=topic).count(),
                                "topic_progress_percent": calculate_score_percent(
                                    answers_before.count(),
                                    TopicQuestion.objects.filter(topic=topic).count(),
                                ),
                                "test_completed": True,
                                "timed_out": True,
                                "passed": False,
                                "remaining_seconds": 0,
                                "correct_answers": correct_before,
                                "score_percent": score_percent,
                                "practice_stats": get_topic_practice_stats(topic),
                                "time_limit_seconds": limit_seconds,
                                "duration_seconds": get_topic_progress_duration_seconds(progress),
                                "is_timed": True,
                            },
                            status=status.HTTP_200_OK,
                        )

            correct_ids = set(
                question.options.filter(is_correct=True).values_list("id", flat=True)
            )
            selected_set = set(option_ids)

            is_correct = bool(correct_ids) and (selected_set == correct_ids)
            score = question.max_score if is_correct else 0

            answer, _ = TopicQuestionAnswer.objects.get_or_create(
                user=request.user,
                question=question,
            )
            answer.is_correct = is_correct
            answer.score = score
            answer.submitted_code = ""
            answer.stdout = ""
            answer.stderr = ""
            answer.exit_code = None
            answer.answered_at = timezone.now()
            answer.save()
            answer.selected_options.set(option_ids)

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

        answered_total = TopicQuestionAnswer.objects.filter(
            user=request.user,
            question__topic=topic,
        ).count()

        if is_timed:
            now = timezone.now()
            limit_seconds = progress.time_limit_seconds or time_limit_seconds or 0
            elapsed_seconds = (
                int((now - progress.started_at).total_seconds())
                if progress.started_at else 0
            )
            remaining_seconds = max(limit_seconds - elapsed_seconds, 0)
            timed_out = progress.timed_out or remaining_seconds <= 0
            completed = timed_out or answered_total >= all_q_count
            score_percent = calculate_score_percent(
                correct_answers_qs.count(),
                all_q_count,
            )
            passed = (
                    completed
                    and not timed_out
                    and all_q_count > 0
                    and correct_answers_qs.count() == all_q_count
            )

            if timed_out and not progress.timed_out:
                progress.timed_out = True

            progress.status = (
                TopicProgress.Status.COMPLETED
                if passed
                else TopicProgress.Status.FAILED
                if completed
                else TopicProgress.Status.IN_PROGRESS
            )
            progress.score = score_percent
            if completed and not progress.completed_at:
                progress.completed_at = now
            progress.save(
                update_fields=[
                    "status",
                    "score",
                    "completed_at",
                    "timed_out",
                ]
            )

            return Response(
                {
                    "is_correct": is_correct,
                    "score": score,
                    "answered_questions": answered_total,
                    "total_questions": all_q_count,
                    "topic_progress_percent": calculate_score_percent(
                        answered_total,
                        all_q_count,
                    ),
                    "test_completed": completed,
                    "timed_out": timed_out,
                    "passed": passed,
                    "remaining_seconds": remaining_seconds,
                    "correct_answers": correct_answers_qs.count(),
                    "score_percent": score_percent,
                    "practice_stats": get_topic_practice_stats(topic),
                    "time_limit_seconds": limit_seconds,
                    "duration_seconds": get_topic_progress_duration_seconds(progress) if completed else None,
                    "is_timed": True,
                }
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
                "is_timed": False,
                "timed_out": False,
                "test_completed": status_value == TopicProgress.Status.COMPLETED,
                "passed": status_value == TopicProgress.Status.COMPLETED,
                "correct_answers": answered_count,
                "score_percent": progress_percent,
                "practice_stats": get_topic_practice_stats(topic),
                "time_limit_seconds": None,
                "remaining_seconds": None,
                "duration_seconds": None,
            }
        )


# POST /api/learning/questions/<id>/run-code/
class TopicQuestionRunCodeView(APIView):
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

        if question.question_type != TopicQuestion.QuestionType.CODE:
            return Response(
                {"detail": "This question is not a code question."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        course = question.topic.module.course
        if not course.students.filter(pk=request.user.pk).exists():
            return Response(
                {"detail": "You are not enrolled in this course."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = TopicQuestionCodeRunSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            run_result = run_python_code(serializer.validated_data["code"])
        except CodeRunnerError as error:
            return Response(
                {"detail": str(error)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(build_code_run_response(run_result))


# GET/POST /api/learning/questions/<id>/hints/
class TopicQuestionHintView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get_question(self, request, pk):
        try:
            question = TopicQuestion.objects.select_related(
                "topic__module__course"
            ).get(pk=pk)
        except TopicQuestion.DoesNotExist:
            return None, Response(
                {"detail": "Question not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        course = question.topic.module.course
        if not course.students.filter(pk=request.user.pk).exists():
            return None, Response(
                {"detail": "You are not enrolled in this course."},
                status=status.HTTP_403_FORBIDDEN,
            )

        return question, None

    def get(self, request, pk):
        question, error_response = self.get_question(request, pk)
        if error_response is not None:
            return error_response

        hints = TopicQuestionHint.objects.filter(question=question).select_related("author")
        serializer = TopicQuestionHintSerializer(
            hints,
            many=True,
            context={"request": request},
        )
        return Response({"hints": serializer.data})

    def post(self, request, pk):
        question, error_response = self.get_question(request, pk)
        if error_response is not None:
            return error_response

        can_add_hint = TopicQuestionAnswer.objects.filter(
            user=request.user,
            question=question,
            is_correct=True,
        ).exists()
        if not can_add_hint:
            return Response(
                {"detail": "You can add a hint only after answering this question correctly."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = TopicQuestionHintSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        hint = serializer.save(question=question, author=request.user)

        return Response(
            TopicQuestionHintSerializer(
                hint,
                context={"request": request},
            ).data,
            status=status.HTTP_201_CREATED,
        )
