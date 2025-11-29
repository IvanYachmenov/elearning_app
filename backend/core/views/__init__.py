from .auth import RegisterView, MeView
from .courses import (
    CourseListView,
    CourseDetailView,
    EnrollCourseView,
    MyCoursesListView,
)
from .learning import LearningCourseDetailView

__all__ = [
    "RegisterView",
    "MeView",
    "CourseListView",
    "CourseDetailView",
    "EnrollCourseView",
    "MyCoursesListView",
    "LearningCourseDetailView",
]