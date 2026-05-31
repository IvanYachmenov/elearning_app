"""
Recalculation of stored answers when the teacher edits a question.

When the teacher changes which option is marked as correct (or edits
the expected output of a code question), the boolean `is_correct` on
existing TopicQuestionAnswer rows is no longer valid -- it was frozen
at submit time. This module re-evaluates those rows so that the
student sees the up-to-date correctness in the history panel and in
the aggregate counts on the topic page.
"""
from ..models import TopicProgress
from ..models.learning import TopicQuestion, TopicQuestionAnswer


def _normalize_output(value: str) -> str:
    normalized = (value or "").replace("\r\n", "\n").replace("\r", "\n")
    lines = [line.rstrip() for line in normalized.split("\n")]
    return "\n".join(lines).rstrip("\n")


def reevaluate_answers_for_question(question: TopicQuestion) -> None:
    """
    Update is_correct/score on all stored answers for this question
    based on its current correct options (for choice questions) or
    current expected output (for code questions).
    """
    answers = TopicQuestionAnswer.objects.filter(question=question)

    if question.question_type in (
        TopicQuestion.QuestionType.CODE,
        TopicQuestion.QuestionType.JS_CODE,
    ):
        expected = _normalize_output(question.expected_output)
        for answer in answers:
            stored_stdout = _normalize_output(answer.stdout)
            is_correct = bool(expected) and stored_stdout == expected
            new_score = 100 if is_correct else 0
            if answer.is_correct != is_correct or answer.score != new_score:
                answer.is_correct = is_correct
                answer.score = new_score
                answer.save(update_fields=["is_correct", "score"])
        return

    correct_ids = set(
        question.options.filter(is_correct=True).values_list("id", flat=True)
    )
    for answer in answers:
        selected_ids = set(answer.selected_options.values_list("id", flat=True))
        is_correct = bool(correct_ids) and selected_ids == correct_ids
        new_score = 100 if is_correct else 0
        if answer.is_correct != is_correct or answer.score != new_score:
            answer.is_correct = is_correct
            answer.score = new_score
            answer.save(update_fields=["is_correct", "score"])


def recalculate_topic_progress_score(topic) -> None:
    """
    Refresh TopicProgress.score for every student of this topic so
    that the aggregate score reflects the current is_correct state.
    """
    total = TopicQuestion.objects.filter(topic=topic).count()
    if not total:
        return

    progresses = TopicProgress.objects.filter(topic=topic)
    for progress in progresses:
        correct = TopicQuestionAnswer.objects.filter(
            user=progress.user,
            question__topic=topic,
            is_correct=True,
        ).count()
        new_score = round(correct * 100 / total)
        if progress.score != new_score:
            progress.score = new_score
            progress.save(update_fields=["score"])
