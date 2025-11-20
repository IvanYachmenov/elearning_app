from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "points",
            "two_factor_enabled",
        )
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "password",
            "role",
        )
        extra_kwargs = {
            "role": {"required": False},
            "first_name": {"required": False, "allow_blank": True},
            "last_name": {"required": False, "allow_blank": True},
        }

    def create(self, validated_data):
        role = validated_data.get("role", User.Roles.STUDENT)
        password = validated_data.pop("password")

        user = User.objects.create_user(
            username = validated_data["username"],
            email = validated_data.get("email", ""),
            password = password,
            role = role,
            first_name = validated_data.get("first_name", ""),
            last_name = validated_data.get("last_name", ""),
        )
        return user

