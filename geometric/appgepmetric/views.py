# views.py en tu aplicación Django
from django.shortcuts import render
from django.core.files.storage import FileSystemStorage
from django.http import JsonResponse
from django.conf import settings
import os
import cv2
import numpy as np


def index_view(request):
    return render(request, 'C:/Aplicaciones/apps angulo distancia django/geometric/appgepmetric/templates/appgeometric/index.html')

def image_view(request):
    return render(request, 'C:/Aplicaciones/apps angulo distancia django/geometric/appgepmetric/templates/appgeometric/image.html')

def handle_uploaded_file(f):
    # Guarda el archivo en el sistema de archivos y devuelve la ruta
    fs = FileSystemStorage()
    filename = fs.save(f.name, f)
    return os.path.join(settings.MEDIA_ROOT, filename)

def image_upload_view(request):
    if request.method == 'POST' and request.FILES['image_file']:
        # Procesar la imagen subida
        image_path = handle_uploaded_file(request.FILES['image_file'])
        # Realizar operaciones con OpenCV
        image = cv2.imread(image_path)
        # Aquí podrías agregar la lógica para escalar, medir, etc.
        # Por ejemplo, aplicar un filtro, calcular dimensiones, etc.
        # ...
        # Por ahora, solo vamos a devolver la URL al archivo de imagen guardado
        image_url = fs.url(filename)
        return JsonResponse({'image_url': image_url})

    # Si no es POST, muestra la página con el formulario de subida
   

    return render(request, 'C:/Aplicaciones/apps angulo distancia django/geometric/appgepmetric/templates/appgeometric/front.html')
