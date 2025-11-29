from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Course, TopicProgress
from ..serializers import LearningCourseSerializer

class LearningCourseDetailView(APIView):
    """
    GET /api/learning/courses/<id>/ -> course with modules, topics and progress of user
    """
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, pk):
        try:
            course = (
                Course.objects
                .select_related("author")
                .prefetch_related("modules__topics")
                .get(pk=pk)
            )
        except Course.DoesNotExist:
            return Response(
                {"detail": "Course not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not request.user.enrolled_courses.filter(pk=course.pk).exists():
            return Response(
                {"detail": "You are not enrolled in this course."},
                status=status.HTTP_403_FORBIDDEN,
            )
        progress_qs = (TopicProgress.objects
            .filter(user=request.user, topic__module__course=course)
            .select_related("topic")
        )
        progress_map = {p.topic.id: p for p in progress_qs}
        serializer = LearningCourseSerializer(
            course,
            context={"request": request, "progress_map": progress_map},
        )
        return Response(serializer.data)

