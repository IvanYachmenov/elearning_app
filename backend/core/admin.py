from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import (
    User,
    Course,
    CourseReview,
    Module,
    Topic,
    TopicQuestion,
    TopicQuestionOption,
    TopicQuestionAnswer,
    TopicQuestionHint,
    TopicProgress,
)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Admin of Custom User
    """

    fieldsets = BaseUserAdmin.fieldsets + (
        ("Extra fields", {
            "fields": (
                "role",
                "points",
                "two_factor_enabled",
                "enrolled_courses",
            )
        }),
    )

    list_display = ("username", "email", "role", "points", "is_staff", "is_superuser")
    list_filter = ("role", "is_staff", "is_superuser")


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ("title", "author", "programming_languages", "frameworks")
    search_fields = ("title", "description", "programming_languages", "frameworks")
    list_filter = ("author",)


@admin.register(CourseReview)
class CourseReviewAdmin(admin.ModelAdmin):
    list_display = ("course", "user", "rating", "updated_at")
    list_filter = ("rating", "course")
    search_fields = ("course__title", "user__username", "comment")


@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display = ("title", "course", "order")
    list_filter = ("course",)
    ordering = ("course", "order")


@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ("title", "module", "order", "is_timed_test", "time_limit_seconds")
    list_filter = ("module",)
    ordering = ("module", "order")


class TopicQuestionOptionInline(admin.TabularInline):
    model = TopicQuestionOption
    extra = 2

@admin.register(TopicQuestion)
class TopicQuestionAdmin(admin.ModelAdmin):
    list_display = ("id", "topic", "order", "question_type", "max_score")
    list_filter = ("topic", "question_type")
    inlines = [TopicQuestionOptionInline]

@admin.register(TopicQuestionOption)
class TopicQuestionOptionAdmin(admin.ModelAdmin):
    list_display = ("id", "question", "text", "is_correct")
    list_filter = ("is_correct",)

@admin.register(TopicQuestionAnswer)
class TopicQuestionAnswerAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "question", "is_correct", "score", "answered_at")
    list_filter = ("is_correct", "question__topic")

@admin.register(TopicQuestionHint)
class TopicQuestionHintAdmin(admin.ModelAdmin):
    list_display = ("id", "author", "question", "created_at")
    list_filter = ("question__topic", "created_at")
    search_fields = ("text", "author__username", "question__text")

@admin.register(TopicProgress)
class TopicProgressAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "topic",
        "status",
        "score",
        "is_timed",
        "time_limit_seconds",
        "timed_out",
        "started_at",
        "completed_at",
    )
    list_filter = ("status", "is_timed", "timed_out")


