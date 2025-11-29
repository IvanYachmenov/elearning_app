"""
URL configuration for elearn_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from core.views import CourseDetailView, CourseListView, EnrollCourseView
from core.views.auth import RegisterView, MeView
from core.views.courses import MyCoursesListView
from core.views.learning import LearningCourseDetailView

urlpatterns = [
    path('admin/', admin.site.urls),

    # auth
    path("api/auth/register/", RegisterView.as_view(), name="register"),
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/me/", MeView.as_view(), name="me"),

    #courses
    path("api/courses/", CourseListView.as_view(), name="course-list"),
    path("api/courses/<int:pk>/", CourseDetailView.as_view(), name="course-detail"),
    path("api/courses/<int:pk>/enroll/", EnrollCourseView.as_view(), name="course-enroll"),
    path("api/my-courses/", MyCoursesListView.as_view(), name="my-courses"),

    # learning
    path("api/learning/courses/<int:pk>/", LearningCourseDetailView.as_view(), name="learning-course-detail"),

]
