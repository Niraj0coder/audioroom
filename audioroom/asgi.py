import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import audioapp.routing  # Adjust this import based on your app structure

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'audioroom.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            audioapp.routing.websocket_urlpatterns
        )
    ),
})