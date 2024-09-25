from django.db import models

class Room(models.Model):
    code = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=100)
