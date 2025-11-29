from rest_framework import serializers

from .course import ModuleSerializer, TopicSerializer, CourseDetailSerializer
from ..models import Topic, TopicProgress

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
