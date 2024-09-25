from django.urls import re_path
from  .consumers import *

websocket_urlpatterns = [
     re_path(r'ws/audio/(?P<room_code>\w+)/$', AudioConsumer.as_asgi()),
]