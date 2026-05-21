from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, ClothingItemViewSet, OutfitViewSet, ActivityLogViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'clothing-items', ClothingItemViewSet)
router.register(r'outfits', OutfitViewSet)
router.register(r'activity-logs', ActivityLogViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
