from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, ClothingItem, Outfit, ActivityLog

admin.site.register(User, UserAdmin)

@admin.register(ClothingItem)
class ClothingItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'category', 'date_added')
    list_filter = ('category',)
    search_fields = ('category',)

@admin.register(Outfit)
class OutfitAdmin(admin.ModelAdmin):
    list_display = ('id', 'creator', 'weather', 'occasion', 'created_at')
    list_filter = ('weather', 'occasion', 'creator')

@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'action', 'timestamp')
    list_filter = ('user',)
    search_fields = ('action',)
