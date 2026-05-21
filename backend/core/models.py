from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    pass

class ClothingItem(models.fields.Field):
    pass

class ClothingItem(models.Model):
    CATEGORY_CHOICES = [
        ('PANTS', 'Calça'),
        ('SHORTS', 'Short/Bermuda'),
        ('T_SHIRT', 'Camiseta'),
        ('SHIRT', 'Camisa Social'),
        ('REGULAR_SHIRT', 'Camisa'),
        ('POLO', 'Camisa Polo'),
        ('JACKET', 'Jaqueta'),
        ('COAT', 'Casaco'),
        ('SWEATER', 'Suéter'),
        ('SHOES', 'Sapato/Tênis'),
        ('ACCESSORY', 'Acessórios'),
    ]
    
    image = models.ImageField(upload_to='clothing_items/')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    date_added = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.get_category_display()} - {self.id}"

class Outfit(models.Model):
    WEATHER_CHOICES = [
        ('HOT', 'Calor'),
        ('COLD', 'Frio'),
        ('WINTER', 'Inverno'),
    ]
    
    OCCASION_CHOICES = [
        ('DAILY', 'Dia a dia'),
        ('NIGHT', 'Noturno'),
    ]
    
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='outfits')
    weather = models.CharField(max_length=10, choices=WEATHER_CHOICES)
    occasion = models.CharField(max_length=10, choices=OCCASION_CHOICES)
    items = models.ManyToManyField(ClothingItem, related_name='outfits')
    created_at = models.DateTimeField(auto_now_add=True)
    last_used_date = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"Outfit {self.id} by {self.creator.username}"

class ActivityLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activity_logs', null=True, blank=True)
    action = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username if self.user else 'System'} - {self.action} at {self.timestamp}"
