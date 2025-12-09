from rest_framework import serializers

from .course import ModuleSerializer, TopicSerializer, CourseDetailSerializer
from ..models import Topic, TopicProgress, TopicQuestionAnswer, TopicQuestionOption, TopicQuestion


class LearningTopicSerializer(TopicSerializer):
    """
    Topic + progress
    """
    status = serializers.SerializerMethodField()
    score = serializers.SerializerMethodField()

    class Meta(TopicSerializer.Meta):
        fields = ["id", "title", "order", "status", "score"]

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
    """
    Module
    """
    topics = LearningTopicSerializer(many=True, read_only=True)

    class Meta(ModuleSerializer.Meta):
        fields = ModuleSerializer.Meta.fields


class LearningCourseSerializer(CourseDetailSerializer):
    """
    Details for course for learning-page + progress
    """
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
    total_questions = serializers.SerializerMethodField()
    answered_questions = serializers.SerializerMethodField()
    progress_percent = serializers.SerializerMethodField()

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
            "total_questions",
            "answered_questions",
            "progress_percent",
        )

    def get_status(self, obj):
        progress = self.context.get("topic_progress")
        if progress:
            return progress.status
        return TopicProgress.Status.NOT_STARTED

    def get_total_questions(self, obj):
        return TopicQuestion.objects.filter(topic=obj).count()

    def get_answered_questions(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or user.is_anonymous:
            return 0
        return TopicQuestionAnswer.objects.filter(user=user, question__topic=obj, is_correct=True,).count()

    def get_progress_percent(self, obj):
        total = self.get_total_questions(obj)
        if not total:
            return 0
        answered = self.get_answered_questions(obj)
        return round(answered * 100 / total)


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
            "max_score",
            "options",
        )


class TopicQuestionAnswerSubmitSerializer(serializers.Serializer):
    """
    {selected options -> [x, y, z ...]}
    """
    selected_options = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False,
    )


class TopicPracticeHistoryQuestionSerializer(TopicPracticeQuestionSerializer):
    """
    Question + options + id of option(s), selected by this user
    """
    user_option_ids = serializers.SerializerMethodField()
    is_correct = serializers.SerializerMethodField()

    class Meta(TopicPracticeQuestionSerializer.Meta):
        fields = TopicPracticeQuestionSerializer.Meta.fields + ("user_option_ids", "is_correct", )

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

    def get_is_correct(self, obj):
        """
        Return is_correct for the question
        """
        answers_map = self.context.get("user_answers_map") or {}
        answer = answers_map.get(obj.id)
        if not answer:
            return None
        return answer.is_correct