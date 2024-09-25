from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
# Create your views here.
def index(request):
    return render(request,'index.html')



from django.shortcuts import render
from .forms import RoomForm
@csrf_exempt
def join_room(request):
    if request.method == 'POST':
        form = RoomForm(request.POST)
        if form.is_valid():
            code = form.cleaned_data['code']
            name = form.cleaned_data['name']
            # Perform any additional validation here (e.g., check if the room exists)
            return render(request, 'room.html', {'room_code': code, 'user_name': name})
    else:
        form = RoomForm()
    return render(request, 'join_room.html', {'form': form})