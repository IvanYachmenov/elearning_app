from rest_framework import serializers
from django.db.models import Avg, Count

from ..models import Course, CourseReview, Module, Topic


class TopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Topic
        fields = (
            "id",
            "title",
            "content",
            "order",
            "is_timed_test",
            "time_limit_seconds",
        )


class ModuleSerializer(serializers.ModelSerializer):
    topics = TopicSerializer(many=True, read_only=True)

    class Meta:
        model = Module
        fields = (
            "id",
            "title",
            "order",
            "topics",
        )


class CourseReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    is_current_user = serializers.SerializerMethodField()

    class Meta:
        model = CourseReview
        fields = (
            "id",
            "rating",
            "app_rating",
            "design_rating",
            "delivery_rating",
            "comment",
            "user_name",
            "is_current_user",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "user_name", "is_current_user", "created_at", "updated_at")

    def get_user_name(self, obj):
        user = obj.user
        if user.first_name or user.last_name:
            return f"{user.first_name} {user.last_name}".strip()
        return user.username or user.email

    def get_is_current_user(self, obj):
        request = self.context.get("request")
        return bool(request and request.user.is_authenticated and obj.user_id == request.user.id)


class CourseReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseReview
        fields = (
            "rating",
            "app_rating",
            "design_rating",
            "delivery_rating",
            "comment",
        )


class CourseRatingMixin:
    def get_average_rating(self, obj):
        value = getattr(obj, "average_rating", None)
        if value is None:
            value = obj.reviews.aggregate(average_rating=Avg("rating"))["average_rating"]
        return round(float(value), 1) if value is not None else None

    def get_reviews_count(self, obj):
        value = getattr(obj, "reviews_count", None)
        if value is None:
            value = obj.reviews.aggregate(reviews_count=Count("id"))["reviews_count"]
        return value


class CourseListSerializer(CourseRatingMixin, serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    is_enrolled = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    reviews_count = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = (
            "id",
            "title",
            "slug",
            "description",
            "author_name",
            "is_enrolled",
            "average_rating",
            "reviews_count",
        )

    def get_author_name(self, obj):
        author = obj.author
        if not author:
            return None
        if author.first_name or author.last_name:
            return f"{author.first_name} {author.last_name}".strip()
        return author.username

    def get_is_enrolled(self, obj):
        request = self.context.get("request")
        if not request or request.user.is_anonymous:
            return False
        return obj.students.filter(pk=request.user.pk).exists()


class CourseDetailSerializer(CourseRatingMixin, serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    modules = ModuleSerializer(many=True, read_only=True)
    is_enrolled = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    reviews_count = serializers.SerializerMethodField()
    reviews = CourseReviewSerializer(many=True, read_only=True)

    class Meta:
        model = Course
        fields = (
            "id",
            "title",
            "slug",
            "description",
            "author_name",
            "is_enrolled",
            "modules",
            "average_rating",
            "reviews_count",
            "reviews",
        )

    def get_author_name(self, obj):
        author = obj.author
        if not author:
            return None
        if author.first_name or author.last_name:
            return f"{author.first_name} {author.last_name}".strip()
        return author.username

    def get_is_enrolled(self, obj):
        request = self.context.get("request")
        if not request or request.user.is_anonymous:
            return False
        return obj.students.filter(pk=request.user.pk).exists()
