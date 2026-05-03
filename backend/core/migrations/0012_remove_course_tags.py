from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0011_topicquestionhint"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="course",
            name="frameworks",
        ),
        migrations.RemoveField(
            model_name="course",
            name="programming_languages",
        ),
    ]
