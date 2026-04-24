from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView,
    MeView,
    GoogleOAuthView,
    GitHubOAuthLoginView,
    GitHubOAuthCallbackView,
    SocialConnectionsView,
    SocialDisconnectView,
    CourseListView,
    CourseDetailView,
    CourseReviewView,
    EnrollCourseView,
    MyCoursesListView,
    TeacherCourseViewSet,
    TeacherModuleViewSet,
    TeacherTopicViewSet,
    LearningCourseDetailView,
    TopicTheoryView,
    TopicNextQuestionView,
    TopicQuestionAnswerView,
    TopicPracticeHistoryView,
    TopicPracticeResetView,
)

# Router for teacher viewsets
router = DefaultRouter()
router.register(r'teacher/courses', TeacherCourseViewSet, basename='teacher-course')
router.register(r'teacher/modules', TeacherModuleViewSet, basename='teacher-module')
router.register(r'teacher/topics', TeacherTopicViewSet, basename='teacher-topic')

urlpatterns = [
    # auth
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/me/", MeView.as_view(), name="me"),
    path("auth/google/", GoogleOAuthView.as_view(), name="google-oauth"),
    path("auth/github/login/", GitHubOAuthLoginView.as_view(), name="github-oauth-login"),
    path("auth/github/callback/", GitHubOAuthCallbackView.as_view(), name="github-oauth-callback"),
    path("auth/social-connections/", SocialConnectionsView.as_view(), name="social-connections"),
    path(
        "auth/social-connections/<str:provider>/disconnect/",
        SocialDisconnectView.as_view(),
        name="social-disconnect",
    ),

    #courses
    path("courses/", CourseListView.as_view(), name="course-list"),
    path("courses/<int:pk>/", CourseDetailView.as_view(), name="course-detail"),
    path("courses/<int:pk>/reviews/", CourseReviewView.as_view(), name="course-review"),
    path("courses/<int:pk>/enroll/", EnrollCourseView.as_view(), name="course-enroll"),
    path("my-courses/", MyCoursesListView.as_view(), name="my-courses"),

    # teacher endpoints (using router)
    path("", include(router.urls)),

    # learning
    path("learning/courses/<int:pk>/", LearningCourseDetailView.as_view(), name="learning-course-detail"),
    path("learning/topics/<int:pk>/", TopicTheoryView.as_view(), name="learning-topic-detail"),
    path("learning/topics/<int:pk>/next-question/", TopicNextQuestionView.as_view(), name="learning-topic-next-question"),
    path("learning/questions/<int:pk>/answer/", TopicQuestionAnswerView.as_view(), name="learning-question-answer"),
    path("learning/topics/<int:pk>/reset/", TopicPracticeResetView.as_view(), name="learning-topic-reset"),

    # learning - practice history
    path("learning/topics/<int:pk>/history/", TopicPracticeHistoryView.as_view(), name="learning-topic-history"),

]
