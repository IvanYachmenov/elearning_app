from rest_framework import serializers
from ...models.learning import TopicQuestion, TopicQuestionOption
from ...services.answer_reeval import (
    reevaluate_answers_for_question,
    recalculate_topic_progress_score,
)


class TeacherQuestionOptionSerializer(serializers.ModelSerializer):
    # Explicitly writable id -- DRF marks PK fields read-only by default,
    # which would silently strip the id from nested payloads and cause
    # the parent update logic to recreate every option (and lose any
    # stored TopicQuestionAnswer.selected_options references).
    id = serializers.IntegerField(required=False)

    class Meta:
        model = TopicQuestionOption
        fields = ("id", "text", "is_correct")


class TeacherQuestionSerializer(serializers.ModelSerializer):
    # Same reason as on the option serializer -- without an explicit
    # writable id the topic update would recreate every question and
    # CASCADE-delete every student's TopicQuestionAnswer.
    id = serializers.IntegerField(required=False)
    options = TeacherQuestionOptionSerializer(many=True, required=False)

    class Meta:
        model = TopicQuestion
        fields = (
            "id",
            "text",
            "order",
            "question_type",
            "expected_output",
            "options",
        )

    CODE_TYPES = (
        TopicQuestion.QuestionType.CODE,
        TopicQuestion.QuestionType.JS_CODE,
    )

    def create(self, validated_data):
        options_data = validated_data.pop('options', [])
        question = TopicQuestion.objects.create(**validated_data)
        if question.question_type not in self.CODE_TYPES:
            for option_data in options_data:
                TopicQuestionOption.objects.create(question=question, **option_data)
        return question

    def update(self, instance, validated_data):
        options_data = validated_data.pop('options', None)

        instance.text = validated_data.get('text', instance.text)
        instance.order = validated_data.get('order', instance.order)
        instance.question_type = validated_data.get('question_type', instance.question_type)
        instance.expected_output = validated_data.get('expected_output', instance.expected_output)
        instance.save()

        if instance.question_type in self.CODE_TYPES:
            instance.options.all().delete()
            # Refresh student answers against the (possibly new) expected
            # output so that the history panel and aggregate counts stay
            # in sync with the current question definition.
            reevaluate_answers_for_question(instance)
            recalculate_topic_progress_score(instance.topic)
            return instance

        if options_data is not None:
            existing_option_ids = set(instance.options.values_list('id', flat=True))
            updated_option_ids = set()

            for option_data in options_data:
                option_id = option_data.get('id')
                if option_id and instance.options.filter(id=option_id).exists():
                    option = instance.options.get(id=option_id)
                    option.text = option_data.get('text', option.text)
                    option.is_correct = option_data.get('is_correct', option.is_correct)
                    option.save()
                    updated_option_ids.add(option_id)
                else:
                    option_data.pop('id', None)
                    TopicQuestionOption.objects.create(question=instance, **option_data)

            options_to_delete = existing_option_ids - updated_option_ids
            if options_to_delete:
                instance.options.filter(id__in=options_to_delete).delete()

        # Refresh student answers against the (possibly new) correct
        # options so that previously stored is_correct does not stay
        # frozen at submit time.
        reevaluate_answers_for_question(instance)
        recalculate_topic_progress_score(instance.topic)
        return instance
