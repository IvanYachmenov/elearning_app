# Generated to repair databases where 0007 updated Django state only.

from django.db import migrations


def ensure_user_avatar_column(apps, schema_editor):
    User = apps.get_model("core", "User")
    field = User._meta.get_field("avatar")
    table_name = User._meta.db_table
    column_name = field.column

    with schema_editor.connection.cursor() as cursor:
        existing_columns = {
            column.name
            for column in schema_editor.connection.introspection.get_table_description(
                cursor,
                table_name,
            )
        }

    if column_name not in existing_columns:
        schema_editor.add_field(User, field)


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0012_remove_course_tags"),
    ]

    operations = [
        migrations.RunPython(ensure_user_avatar_column, migrations.RunPython.noop),
    ]
