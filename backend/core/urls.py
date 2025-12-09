from django.urls import path
from .views import (
    RegisterView,
    MeView,
    CourseListView,
    CourseDetailView,
    EnrollCourseView,
    MyCoursesListView,
    LearningCourseDetailView,
    TopicTheoryView,
    TopicNextQuestionView,
    TopicQuestionAnswerView, TopicPracticeHistoryView,
)

urlpatterns = [
    # auth
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/me/", MeView.as_view(), name="me"),

    #courses
    path("courses/", CourseListView.as_view(), name="course-list"),
    path("courses/<int:pk>/", CourseDetailView.as_view(), name="course-detail"),
    path("courses/<int:pk>/enroll/", EnrollCourseView.as_view(), name="course-enroll"),
    path("my-courses/", MyCoursesListView.as_view(), name="my-courses"),

    # learning
    path("learning/courses/<int:pk>/", LearningCourseDetailView.as_view(), name="learning-course-detail"),
    path("learning/topics/<int:pk>/", TopicTheoryView.as_view(), name="learning-topic-detail"),
    path("learning/topics/<int:pk>/next-question/", TopicNextQuestionView.as_view(), name="learning-topic-next-question"),
    path("learning/questions/<int:pk>/answer/", TopicQuestionAnswerView.as_view(), name="learning-question-answer"),
    # learning - practice history
    path("learning/topics/<int:pk>/history/", TopicPracticeHistoryView.as_view(), name="learning-topic-history"),
]
