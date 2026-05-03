from rest_framework import serializers
from django.utils.text import slugify
from ...models import Course, Module, Topic
from ...models.learning import TopicQuestion, TopicQuestionOption
from .module import TeacherModuleSerializer


class TeacherCourseSerializer(serializers.ModelSerializer):
    modules = TeacherModuleSerializer(many=True, required=False)
    author_name = serializers.SerializerMethodField(read_only=True)
    image = serializers.ImageField(required=False, allow_null=True)
    image_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Course
        fields = (
            "id",
            "title",
            "slug",
            "description",
            "author_name",
            "modules",
            "image",
            "image_url",
        )
        read_only_fields = ("id", "slug", "author_name", "image_url")

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            from django.conf import settings
            return f"{settings.MEDIA_URL}{obj.image.url}" if obj.image else None
        return None

    def get_author_name(self, obj):
        author = obj.author
        if not author:
            return None
        if author.first_name or author.last_name:
            return f"{author.first_name} {author.last_name}".strip()
        return author.username

    def create(self, validated_data):
        modules_data = validated_data.pop('modules', [])
        user = self.context['request'].user
        
        if 'slug' not in validated_data or not validated_data.get('slug'):
            title = validated_data.get('title')
            base_slug = slugify(title)
            slug = base_slug
            counter = 1
            while Course.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            validated_data['slug'] = slug
        
        validated_data['author'] = user
        
        course = Course.objects.create(**validated_data)
        
        for module_data in modules_data:
            topics_data = module_data.pop('topics', [])
            module = Module.objects.create(course=course, **module_data)
            for topic_data in topics_data:
                questions_data = topic_data.pop('questions', [])
                topic = Topic.objects.create(module=module, **topic_data)
                for question_data in questions_data:
                    options_data = question_data.pop('options', [])
                    question = TopicQuestion.objects.create(topic=topic, **question_data)
                    for option_data in options_data:
                        TopicQuestionOption.objects.create(question=question, **option_data)
        
        return course

    def update(self, instance, validated_data):
        # Get modules from initial_data if not in validated_data (for FormData)
        modules_data = validated_data.pop('modules', None)
        if modules_data is None and hasattr(self, 'initial_data') and 'modules' in self.initial_data:
            modules_value = self.initial_data['modules']
            if isinstance(modules_value, list):
                modules_data = modules_value
            elif isinstance(modules_value, str):
                import json
                try:
                    modules_data = json.loads(modules_value)
                except (json.JSONDecodeError, TypeError):
                    pass
        
        print(f"[COURSE UPDATE] Starting update, validated_data keys: {list(validated_data.keys())}")
        print(f"[COURSE UPDATE] modules_data: {modules_data is not None}, type: {type(modules_data)}")
        if modules_data is not None:
            print(f"[COURSE UPDATE] modules_data length: {len(modules_data)}")
        
        instance.title = validated_data.get('title', instance.title)
        instance.description = validated_data.get('description', instance.description)
        instance.image = validated_data.get('image', instance.image)
        
        if 'title' in validated_data:
            title = validated_data['title']
            base_slug = slugify(title)
            slug = base_slug
            counter = 1
            while Course.objects.filter(slug=slug).exclude(pk=instance.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            instance.slug = slug
        
        instance.save()
        
        if modules_data is not None:
            print(f"[COURSE UPDATE] Updating course with {len(modules_data)} modules")
            
            existing_module_ids = set(instance.modules.values_list('id', flat=True))
            updated_module_ids = set()
            
            for module_data in modules_data:
                module_id = module_data.get('id')
                print(f"[COURSE UPDATE] Processing module: id={module_id}, title={module_data.get('title')}, topics={len(module_data.get('topics', []))}")
                
                if module_id and instance.modules.filter(id=module_id).exists():
                    module = instance.modules.get(id=module_id)
                    print(f"[COURSE UPDATE] Updating existing module {module_id}")
                    # Update module fields directly
                    module.title = module_data.get('title', module.title)
                    module.order = module_data.get('order', module.order)
                    module.save()
                    
                    # Handle topics directly without serializer validation
                    topics_data = module_data.get('topics', [])
                    if topics_data is not None:
                        existing_topic_ids = set(module.topics.values_list('id', flat=True))
                        received_topic_ids = set()
                        
                        for topic_data in topics_data:
                            topic_id = topic_data.get('id')
                            if topic_id and module.topics.filter(id=topic_id).exists():
                                received_topic_ids.add(topic_id)
                                topic = module.topics.get(id=topic_id)
                                topic.title = topic_data.get('title', topic.title)
                                topic.content = topic_data.get('content', topic.content)
                                topic.order = topic_data.get('order', topic.order)
                                topic.is_timed_test = topic_data.get('is_timed_test', topic.is_timed_test)
                                topic.time_limit_seconds = topic_data.get('time_limit_seconds', topic.time_limit_seconds)
                                topic.save()
                            else:
                                # Create new topic
                                topic_data.pop('id', None)
                                questions_data = topic_data.pop('questions', [])
                                topic = Topic.objects.create(module=module, **topic_data)
                                for question_data in questions_data:
                                    question_data.pop('id', None)
                                    options_data = question_data.pop('options', [])
                                    question = TopicQuestion.objects.create(topic=topic, **question_data)
                                    for option_data in options_data:
                                        option_data.pop('id', None)
                                        TopicQuestionOption.objects.create(question=question, **option_data)
                        
                        # Delete topics not in received list
                        topics_to_delete = existing_topic_ids - received_topic_ids
                        if topics_to_delete:
                            module.topics.filter(id__in=topics_to_delete).delete()
                    
                    updated_module_ids.add(module_id)
                    print(f"[COURSE UPDATE] Module {module_id} updated successfully")
                else:
                    print(f"[COURSE UPDATE] Creating new module")
                    module_data.pop('id', None)
                    topics_data = module_data.pop('topics', [])
                    module = Module.objects.create(course=instance, **module_data)
                    print(f"[COURSE UPDATE] Created module {module.id} with {len(topics_data)} topics")
                    for topic_data in topics_data:
                        topic_data.pop('id', None)
                        questions_data = topic_data.pop('questions', [])
                        topic = Topic.objects.create(module=module, **topic_data)
                        for question_data in questions_data:
                            question_data.pop('id', None)
                            options_data = question_data.pop('options', [])
                            question = TopicQuestion.objects.create(topic=topic, **question_data)
                            for option_data in options_data:
                                option_data.pop('id', None)
                                TopicQuestionOption.objects.create(question=question, **option_data)
            
            modules_to_delete = existing_module_ids - updated_module_ids
            if modules_to_delete:
                instance.modules.filter(id__in=modules_to_delete).delete()
        
        # Reload instance from database with all related data
        from django.db.models import Prefetch
        instance = Course.objects.prefetch_related(
            Prefetch('modules', queryset=Module.objects.prefetch_related(
                Prefetch('topics', queryset=Topic.objects.prefetch_related(
                    'questions__options'
                ))
            ))
        ).get(pk=instance.pk)
        
        return instance
