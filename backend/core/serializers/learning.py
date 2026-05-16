from rest_framework import serializers

from .course import ModuleSerializer, TopicSerializer, CourseDetailSerializer
from ..models import (
    Topic,
    TopicProgress,
    TopicQuestionAnswer,
    TopicQuestionHint,
    TopicQuestionOption,
    TopicQuestion,
)
from ..learning_stats import get_topic_practice_stats, get_topic_progress_duration_seconds


class LearningTopicSerializer(TopicSerializer):
    status = serializers.SerializerMethodField()
    score = serializers.SerializerMethodField()

    class Meta(TopicSerializer.Meta):
        fields = ["id", "title", "order", "status", "score", "is_timed_test", "time_limit_seconds"]

    def _get_progress(self, obj):
        progress_map = self.context.get("progress_map") or {}
        return progress_map.get(obj.id)

    def get_status(self, obj):
        progress = self._get_progress(obj)
        if progress:
            return progress.status
        return TopicProgress.Status.NOT_STARTED

    def get_score(self, obj):
        progress = self._get_progress(obj)
        return progress.score if progress else None


class LearningModuleSerializer(ModuleSerializer):
    topics = LearningTopicSerializer(many=True, read_only=True)

    class Meta(ModuleSerializer.Meta):
        fields = ModuleSerializer.Meta.fields


class LearningCourseSerializer(CourseDetailSerializer):
    modules = LearningModuleSerializer(many=True, read_only=True)

    total_topics = serializers.SerializerMethodField()
    completed_topics = serializers.SerializerMethodField()
    progress_percent = serializers.SerializerMethodField()

    class Meta(CourseDetailSerializer.Meta):
        fields = CourseDetailSerializer.Meta.fields + (
            "total_topics",
            "completed_topics",
            "progress_percent"
        )

    def get_total_topics(self, obj):
        return Topic.objects.filter(module__course=obj).count()

    def get_completed_topics(self, obj):
        progress_map = self.context.get("progress_map") or {}
        return sum(
            1
            for p in progress_map.values()
            if p.status == TopicProgress.Status.COMPLETED
        )

    def get_progress_percent(self, obj):
        total = self.get_total_topics(obj)
        if not total:
            return 0
        completed = self.get_completed_topics(obj)
        return round(completed * 100 / total)

class TopicTheorySerializer(TopicSerializer):
    """
    One page of topic -> theory page
    """
    course_id = serializers.IntegerField(source="module.course.id", read_only=True)
    course_title = serializers.CharField(source="module.course.title", read_only=True)
    module_id = serializers.IntegerField(source="module.id", read_only=True)
    module_title = serializers.CharField(source="module.title", read_only=True)

    status = serializers.SerializerMethodField()
    score = serializers.SerializerMethodField()
    timed_out = serializers.SerializerMethodField()
    total_questions = serializers.SerializerMethodField()
    answered_questions = serializers.SerializerMethodField()
    correct_answers = serializers.SerializerMethodField()
    progress_percent = serializers.SerializerMethodField()
    practice_stats = serializers.SerializerMethodField()
    duration_seconds = serializers.SerializerMethodField()

    class Meta:
        model = Topic
        fields = (
            "id",
            "title",
            "content",
            "order",
            "course_id",
            "course_title",
            "module_id",
            "module_title",
            "status",
            "score",
            "timed_out",
            "is_timed_test",
            "time_limit_seconds",
            "total_questions",
            "answered_questions",
            "correct_answers",
            "progress_percent",
            "practice_stats",
            "duration_seconds",
        )

    def get_status(self, obj):
        progress = self.context.get("topic_progress")
        if progress:
            return progress.status
        return TopicProgress.Status.NOT_STARTED

    def get_score(self, obj):
        progress = self.context.get("topic_progress")
        return progress.score if progress else None

    def get_timed_out(self, obj):
        progress = self.context.get("topic_progress")
        return bool(progress and progress.timed_out)

    def get_total_questions(self, obj):
        return TopicQuestion.objects.filter(topic=obj).count()

    def get_answered_questions(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or user.is_anonymous:
            return 0
        return TopicQuestionAnswer.objects.filter(user=user, question__topic=obj).count()

    def get_correct_answers(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or user.is_anonymous:
            return 0
        return TopicQuestionAnswer.objects.filter(user=user, question__topic=obj, is_correct=True).count()

    def get_progress_percent(self, obj):
        total = self.get_total_questions(obj)
        if not total:
            return 0
        correct = self.get_correct_answers(obj)
        return round(correct * 100 / total)

    def get_practice_stats(self, obj):
        return get_topic_practice_stats(obj)

    def get_duration_seconds(self, obj):
        progress = self.context.get("topic_progress")
        if not progress:
            return None
        return get_topic_progress_duration_seconds(progress)


class TopicQuestionOptionSerializer(serializers.ModelSerializer):
    """
    Answer
    """
    class Meta:
        model = TopicQuestionOption
        fields = ("id", "text")

class TopicPracticeQuestionSerializer(serializers.ModelSerializer):
    """
    Question with options for answer
    """
    options = TopicQuestionOptionSerializer(many=True, read_only=True)

    class Meta:
        model = TopicQuestion
        fields = (
            "id",
            "text",
            "order",
            "question_type",
            "options",
        )


class TopicQuestionAnswerSubmitSerializer(serializers.Serializer):
    """
    {selected options -> [x, y, z ...]}
    """
    selected_options = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=True,
        required=False,
        default=list,
    )
    code = serializers.CharField(
        allow_blank=True,
        required=False,
        default="",
        max_length=20000,
        trim_whitespace=False,
    )
    # For JavaScript questions the code runs in the browser; the client sends
    # back the captured output for grading against the expected output.
    client_stdout = serializers.CharField(
        allow_blank=True,
        required=False,
        default="",
        max_length=20000,
        trim_whitespace=False,
    )
    client_stderr = serializers.CharField(
        allow_blank=True,
        required=False,
        default="",
        max_length=20000,
        trim_whitespace=False,
    )


class TopicQuestionCodeRunSerializer(serializers.Serializer):
    code = serializers.CharField(
        allow_blank=True,
        max_length=20000,
        trim_whitespace=False,
    )


class TopicQuestionHintSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.username", read_only=True)
    is_mine = serializers.SerializerMethodField()

    class Meta:
        model = TopicQuestionHint
        fields = ("id", "text", "author_name", "created_at", "is_mine")
        read_only_fields = ("id", "author_name", "created_at", "is_mine")

    def get_is_mine(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        return bool(user and user.is_authenticated and obj.author_id == user.id)

    def validate_text(self, value):
        text = value.strip()
        if not text:
            raise serializers.ValidationError("Hint text cannot be empty.")
        if len(text) > 280:
            raise serializers.ValidationError("Hint text must be 280 characters or fewer.")
        return text


class TopicPracticeHistoryQuestionSerializer(TopicPracticeQuestionSerializer):
    """
    Question + options + id of option(s), selected by this user
    """
    user_option_ids = serializers.SerializerMethodField()
    submitted_code = serializers.SerializerMethodField()
    stdout = serializers.SerializerMethodField()
    stderr = serializers.SerializerMethodField()
    exit_code = serializers.SerializerMethodField()
    is_correct = serializers.SerializerMethodField()

    class Meta(TopicPracticeQuestionSerializer.Meta):
        fields = TopicPracticeQuestionSerializer.Meta.fields + (
            "user_option_ids",
            "submitted_code",
            "stdout",
            "stderr",
            "exit_code",
            "is_correct",
        )

    def get_user_option_ids(self, obj):
        """
        get a map from context and catch id of chosen variants
        """
        answers_map = self.context.get("user_answers_map") or {}
        answer = answers_map.get(obj.id)
        if not answer:
            return []
        return list(
            answer.selected_options.values_list("id", flat=True)
        )

    def get_submitted_code(self, obj):
        answers_map = self.context.get("user_answers_map") or {}
        answer = answers_map.get(obj.id)
        return answer.submitted_code if answer else ""

    def get_stdout(self, obj):
        answers_map = self.context.get("user_answers_map") or {}
        answer = answers_map.get(obj.id)
        return answer.stdout if answer else ""

    def get_stderr(self, obj):
        answers_map = self.context.get("user_answers_map") or {}
        answer = answers_map.get(obj.id)
        return answer.stderr if answer else ""

    def get_exit_code(self, obj):
        answers_map = self.context.get("user_answers_map") or {}
        answer = answers_map.get(obj.id)
        return answer.exit_code if answer else None

    def get_is_correct(self, obj):
        """
        Return is_correct for the question
        """
        answers_map = self.context.get("user_answers_map") or {}
        answer = answers_map.get(obj.id)
        if not answer:
            return None
        return answer.is_correct
