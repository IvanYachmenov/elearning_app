from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models

class TopicProgress(models.Model):
    class Status(models.TextChoices):
        NOT_STARTED = "not_started", "Not started"
        IN_PROGRESS = "in_progress", "In progress"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="topic_progress"
    )
    topic = models.ForeignKey(
        "Topic",
        on_delete=models.CASCADE,
        related_name="progress"
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.NOT_STARTED,
    )
    is_timed = models.BooleanField(default=False)
    time_limit_seconds = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(120)],
        help_text="Time limit in seconds for timed tests",
    )
    score = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Score is percent (0-100)",
    )
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    timed_out = models.BooleanField(default=False)

    class Meta:
        unique_together = ("user","topic")

    def __str__(self):
        return f"{self.user} - {self.topic} ({self.status})"


class TopicQuestion(models.Model):
    class QuestionType(models.TextChoices):
        SINGLE = "single_choice", "Single choice"
        MULTI = "multiple_choice", "Multiple choice"
        CODE = "code", "Python code"

    topic = models.ForeignKey(
        "Topic",
        on_delete=models.CASCADE,
        related_name="questions",
    )
    text = models.TextField()
    order = models.PositiveIntegerField(default=0)

    question_type = models.CharField(
        max_length=32,
        choices=QuestionType.choices,
        default=QuestionType.SINGLE,
    )
    max_score = models.PositiveSmallIntegerField(default=100)
    expected_output = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{self.topic} – Q{self.order}"


class TopicQuestionOption(models.Model):
    question = models.ForeignKey(
        TopicQuestion,
        on_delete=models.CASCADE,
        related_name="options",
    )
    text = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.question_id}: {self.text[:30]}"


class TopicQuestionAnswer(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="question_answers",
    )
    question = models.ForeignKey(
        TopicQuestion,
        on_delete=models.CASCADE,
        related_name="answers",
    )

    # single/multi choice
    selected_options = models.ManyToManyField(
        TopicQuestionOption,
        blank=True,
        related_name="answers",
    )

    submitted_code = models.TextField(blank=True, default="")
    stdout = models.TextField(blank=True, default="")
    stderr = models.TextField(blank=True, default="")
    exit_code = models.IntegerField(null=True, blank=True)

    is_correct = models.BooleanField(default=False)
    score = models.PositiveSmallIntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    answered_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "question")

    def __str__(self):
        return f"{self.user} – Q{self.question_id} ({self.score}%)"

class TopicQuestionHint(models.Model):
    question = models.ForeignKey(
        TopicQuestion,
        on_delete=models.CASCADE,
        related_name="hints",
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="question_hints",
    )
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at", "id"]
        indexes = [
            models.Index(fields=["question", "created_at"], name="core_hint_q_created_idx"),
        ]

    def __str__(self):
        return f"{self.author} hint for Q{self.question_id}"
