from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models

class TopicProgress(models.Model):
    class Status(models.TextChoices):
        NOT_STARTED = "not_started", "Not started"
        IN_PROGRESS = "in_progress", "In progress"
        COMPLETED = "completed", "Completed"

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
    score = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Score is percent (0-100)",
    )
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("user","topic")

    def __str__(self):
        return f"{self.user} - {self.topic} ({self.status})"
