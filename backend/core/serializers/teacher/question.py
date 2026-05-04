from rest_framework import serializers
from ...models.learning import TopicQuestion, TopicQuestionOption


class TeacherQuestionOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TopicQuestionOption
        fields = ("id", "text", "is_correct")


class TeacherQuestionSerializer(serializers.ModelSerializer):
    options = TeacherQuestionOptionSerializer(many=True, required=False)

    class Meta:
        model = TopicQuestion
        fields = (
            "id",
            "text",
            "order",
            "question_type",
            "max_score",
            "expected_output",
            "options",
        )

    def create(self, validated_data):
        options_data = validated_data.pop('options', [])
        question = TopicQuestion.objects.create(**validated_data)
        if question.question_type != TopicQuestion.QuestionType.CODE:
            for option_data in options_data:
                TopicQuestionOption.objects.create(question=question, **option_data)
        return question

    def update(self, instance, validated_data):
        options_data = validated_data.pop('options', None)
        
        instance.text = validated_data.get('text', instance.text)
        instance.order = validated_data.get('order', instance.order)
        instance.question_type = validated_data.get('question_type', instance.question_type)
        instance.max_score = validated_data.get('max_score', instance.max_score)
        instance.expected_output = validated_data.get('expected_output', instance.expected_output)
        instance.save()

        if instance.question_type == TopicQuestion.QuestionType.CODE:
            instance.options.all().delete()
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
        
        return instance
