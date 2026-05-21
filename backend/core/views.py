from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import User, ClothingItem, Outfit, ActivityLog
from .serializers import UserSerializer, ClothingItemSerializer, OutfitSerializer, ActivityLogSerializer
from .permissions import IsAdminOrReadOnly

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_permissions(self):
        if self.action == 'me':
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

class ClothingItemViewSet(viewsets.ModelViewSet):
    queryset = ClothingItem.objects.all().order_by('-date_added')
    serializer_class = ClothingItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]

    @action(detail=False, methods=['get'])
    def export_zip(self, request):
        import zipfile
        import io
        from django.http import HttpResponse

        buffer = io.BytesIO()
        
        with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            items = self.get_queryset()
            for item in items:
                if item.image and hasattr(item.image, 'path'):
                    category_name = item.get_category_display()
                    # Sanitize folder names just in case
                    category_name = category_name.replace('/', '-')
                    file_name = item.image.name.split('/')[-1]
                    zip_path = f"{category_name}/{file_name}"
                    
                    try:
                        with item.image.open('rb') as img_file:
                            zip_file.writestr(zip_path, img_file.read())
                    except Exception:
                        pass
                        
        buffer.seek(0)
        response = HttpResponse(buffer.getvalue(), content_type='application/zip')
        response['Content-Disposition'] = 'attachment; filename="backup_armario.zip"'
        return response

class OutfitViewSet(viewsets.ModelViewSet):
    queryset = Outfit.objects.all()
    serializer_class = OutfitSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

    @action(detail=True, methods=['post'])
    def wear(self, request, pk=None):
        outfit = self.get_object()
        from django.utils import timezone
        outfit.last_used_date = timezone.now()
        outfit.save()
        return Response({'status': 'Outfit marked as used', 'last_used_date': outfit.last_used_date})

class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ActivityLog.objects.all().order_by('-timestamp')
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated]
