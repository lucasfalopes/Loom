from rest_framework import serializers
from .models import User, ClothingItem, Outfit, ActivityLog

from django.contrib.auth.hashers import make_password

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'is_staff', 'is_superuser']

    def create(self, validated_data):
        if 'password' in validated_data:
            validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if 'password' in validated_data:
            validated_data['password'] = make_password(validated_data['password'])
        return super().update(instance, validated_data)

class ClothingItemSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    
    class Meta:
        model = ClothingItem
        fields = '__all__'

class OutfitSerializer(serializers.ModelSerializer):
    weather_display = serializers.CharField(source='get_weather_display', read_only=True)
    occasion_display = serializers.CharField(source='get_occasion_display', read_only=True)
    items_detail = ClothingItemSerializer(source='items', many=True, read_only=True)
    items = serializers.PrimaryKeyRelatedField(queryset=ClothingItem.objects.all(), many=True, write_only=True)
    creator_name = serializers.CharField(source='creator.username', read_only=True)
    
    class Meta:
        model = Outfit
        fields = '__all__'
        read_only_fields = ['creator']

class ActivityLogSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True, allow_null=True)
    
    class Meta:
        model = ActivityLog
        fields = '__all__'
