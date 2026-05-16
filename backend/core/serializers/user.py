from rest_framework import serializers
from ..models import User

USERNAME_MAX_LENGTH = 10
NAME_MAX_LENGTH = 13


class UserSerializer(serializers.ModelSerializer):
    username = serializers.CharField(max_length=USERNAME_MAX_LENGTH)
    first_name = serializers.CharField(
        max_length=NAME_MAX_LENGTH, required=False, allow_blank=True
    )
    last_name = serializers.CharField(
        max_length=NAME_MAX_LENGTH, required=False, allow_blank=True
    )

    def validate_username(self, value):
        """Validate username uniqueness, excluding current user"""
        user = self.instance
        if user and User.objects.filter(username=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("A user with this username already exists. Please choose another one.")
        elif not user and User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists. Please choose another one.")
        return value

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "date_joined",
            "role",
            "auth_provider",
            "email_verified",
        )
        read_only_fields = (
            "email",
            "date_joined",
            "role",
            "auth_provider",
            "email_verified",
        )


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    username = serializers.CharField(max_length=USERNAME_MAX_LENGTH)
    first_name = serializers.CharField(
        max_length=NAME_MAX_LENGTH, required=False, allow_blank=True
    )
    last_name = serializers.CharField(
        max_length=NAME_MAX_LENGTH, required=False, allow_blank=True
    )

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "password",
        )
        extra_kwargs = {
            "first_name": {"required": False, "allow_blank": True},
            "last_name": {"required": False, "allow_blank": True},
        }

    def create(self, validated_data):
        password = validated_data.pop("password")

        # Everyone registers as a student. The teacher role can only be
        # granted later via the teacher access code (see BecomeTeacherView).
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=password,
            role=User.Roles.STUDENT,
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
        )
        return user
