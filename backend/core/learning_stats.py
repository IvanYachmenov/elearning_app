from django.db.models import Avg

from .models import Topic, TopicProgress


def get_topic_practice_stats(topic: Topic) -> dict:
    completed_progress = TopicProgress.objects.filter(
        topic=topic,
        completed_at__isnull=False,
        score__isnull=False,
    )
    completed_users = completed_progress.count()
    passed_users = completed_progress.filter(status=TopicProgress.Status.COMPLETED).count()
    average_score = completed_progress.aggregate(value=Avg("score"))["value"]

    return {
        "completed_users": completed_users,
        "passed_users": passed_users,
        "average_success_percent": round(average_score) if average_score is not None else None,
        "pass_rate_percent": round(passed_users * 100 / completed_users) if completed_users else None,
    }


def get_topic_progress_duration_seconds(progress: TopicProgress) -> int | None:
    if not progress.started_at or not progress.completed_at:
        return None
    return max(0, int((progress.completed_at - progress.started_at).total_seconds()))
