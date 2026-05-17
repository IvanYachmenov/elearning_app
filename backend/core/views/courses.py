from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.status import HTTP_200_OK
from rest_framework.views import APIView
from django.db.models import Avg, Count

from ..models import Course
from ..serializers import (
    CourseListSerializer,
    CourseDetailSerializer,
    CourseReviewCreateSerializer,
)


# GET /api/courses/
class CourseListView(generics.ListAPIView):
    serializer_class = CourseListSerializer
    permission_classes = (permissions.AllowAny,)

    queryset = (
        Course.objects
        .select_related("author")
        .annotate(average_rating=Avg("reviews__rating"), reviews_count=Count("reviews"))
        .order_by("id")
    )

# GET /api/courses/<id>/
class CourseDetailView(generics.RetrieveAPIView):
    serializer_class = CourseDetailSerializer
    permission_classes = (permissions.AllowAny,)

    queryset = (
        Course.objects
        .select_related("author")
        .prefetch_related("modules__topics", "reviews__user")
        .annotate(average_rating=Avg("reviews__rating"), reviews_count=Count("reviews"))
    )


# POST /api/courses/<id>/reviews/
class CourseReviewView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, pk):
        try:
            course = Course.objects.get(pk=pk)
        except Course.DoesNotExist:
            return Response(
                {"detail": "Course not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = CourseReviewCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        course.reviews.update_or_create(
            user=request.user,
            defaults={
                "rating": serializer.validated_data["rating"],
                "app_rating": serializer.validated_data.get("app_rating"),
                "design_rating": serializer.validated_data.get("design_rating"),
                "delivery_rating": serializer.validated_data.get("delivery_rating"),
                "comment": serializer.validated_data.get("comment", ""),
            },
        )

        course = (
            Course.objects
            .select_related("author")
            .prefetch_related("modules__topics", "reviews__user")
            .annotate(average_rating=Avg("reviews__rating"), reviews_count=Count("reviews"))
            .get(pk=pk)
        )
        detail_serializer = CourseDetailSerializer(
            course,
            context={"request": request}
        )
        return Response(detail_serializer.data, status=HTTP_200_OK)


# POST /api/courses/<id>/enroll/
class EnrollCourseView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, pk):
        try:
            course = Course.objects.get(pk=pk)
        except Course.DoesNotExist:
            return Response(
                {"detail": "Course not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        user = request.user
        user.enrolled_courses.add(course)

        serializer = CourseDetailSerializer(
            course,
            context={"request": request}
        )
        return Response(serializer.data, status=HTTP_200_OK)

# GET /api/my-courses/
class MyCoursesListView(generics.ListAPIView):
    serializer_class = CourseListSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        return (
            user.enrolled_courses
            .select_related("author")
            .annotate(average_rating=Avg("reviews__rating"), reviews_count=Count("reviews"))
        )
