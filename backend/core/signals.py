from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import ClothingItem, Outfit, ActivityLog

@receiver(post_save, sender=ClothingItem)
def log_clothing_item_creation(sender, instance, created, **kwargs):
    if created:
        ActivityLog.objects.create(
            action=f"Roupa adicionada: {instance.get_category_display()} (ID: {instance.id})"
        )

@receiver(post_delete, sender=ClothingItem)
def log_clothing_item_deletion(sender, instance, **kwargs):
    ActivityLog.objects.create(
        action=f"Roupa removida: {instance.get_category_display()} (ID: {instance.id})"
    )

@receiver(post_save, sender=Outfit)
def log_outfit_creation(sender, instance, created, **kwargs):
    if created:
        ActivityLog.objects.create(
            user=instance.creator,
            action=f"Criou a combinação {instance.id} ({instance.get_weather_display()} / {instance.get_occasion_display()})"
        )
