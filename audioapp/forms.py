from django import forms

class RoomForm(forms.Form):
    code = forms.CharField(max_length=100, widget=forms.TextInput(attrs={'id': 'id_code'}))
    name = forms.CharField(max_length=100, widget=forms.TextInput(attrs={'id': 'id_name'}))