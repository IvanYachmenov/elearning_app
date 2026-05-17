from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from .user import User


class Course(models.Model):
    author = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="courses",
    )
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.title


class CourseReview(models.Model):
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="course_reviews",
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )
    app_rating = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )
    design_rating = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )
    delivery_rating = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["course", "user"],
                name="unique_course_review_per_user",
            )
        ]
        ordering = ["-updated_at", "-created_at"]

    def __str__(self):
        return f"{self.course.title} - {self.user.username}: {self.rating}/5"


class Module(models.Model):
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="modules",
    )
    title = models.CharField(max_length=200)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{self.course.title} – {self.title}"



class Topic(models.Model):
    module = models.ForeignKey(
        Module,
        on_delete=models.CASCADE,
        related_name="topics",
    )
    title = models.CharField(max_length=200)
    content = models.TextField(blank=True, default='')
    order = models.PositiveIntegerField(default=0)
    is_timed_test = models.BooleanField(default=False)
    time_limit_seconds = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(30)],
        help_text="Time limit for timed tests in seconds (minimum 30, maximum 1800)",
    )

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{self.module.title} – {self.title}"
