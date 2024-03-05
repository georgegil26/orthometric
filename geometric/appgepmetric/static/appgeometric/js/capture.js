

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('upload-image-btn').addEventListener('click', function() {
        document.getElementById('fileInput').click();
    });
});

document.addEventListener('DOMContentLoaded', function() {
    // Obtén el input de archivo y el canvas
    var fileInput = document.getElementById('fileInput');
    var canvas = document.getElementById('capture-canvas');
    var ctx = canvas.getContext('2d');

    // Evento al seleccionar un archivo
    fileInput.addEventListener('change', function(e) {
        var file = fileInput.files[0]; // Asume que el usuario selecciona un archivo
        if (file) {
            var reader = new FileReader();

            // Lee el archivo como Data URL
            reader.readAsDataURL(file);
            reader.onload = function(e) {
                var img = new Image();

                // Cuando la imagen está cargada, dibújala en el canvas
                img.onload = function() {
                    // Ajusta el tamaño del canvas al de la imagen
                    canvas.width = img.width;
                    canvas.height = img.height;

                    // Dibuja la imagen
                    ctx.drawImage(img, 0, 0);
                };

                // Establece la imagen para cargar
                img.src = e.target.result;
            };
        }
    });

    // Añade más manejadores de eventos según sea necesario
});// Solicitar acceso a la cámara


if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    // Preferencias de la cámara: queremos video pero no audio
    var options = { audio: false, video: { width: 1280, height: 720 } };

    navigator.mediaDevices.getUserMedia(options).then(function(stream) {
        // Referencia al elemento de video
        var video = document.getElementById('camera-stream');

        // Establecer el stream de la cámara como fuente del elemento de video
        video.srcObject = stream;

        // Reproducir automáticamente el video cuando el stream esté disponible
        video.onloadedmetadata = function(e) {
            video.play();
        };
    }).catch(function(err) {
        console.log("Error al acceder a la cámara: " + err);
    });
}

function stopCameraStream() {
    var video = document.getElementById('camera-stream');
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null; // Limpiar srcObject después de detener las pistas
    }
}

document.getElementById('capture-btn').addEventListener('click', function() {
    var video = document.getElementById('camera-stream');
    if (!video.srcObject) {
        alert('Debes escoger la cámara antes de capturar.');
        return; // Salir de la función si no hay cámara seleccionada
    }
    var canvas = document.getElementById('capture-canvas');
    var ctx = canvas.getContext('2d');

    // Asegúrate de que las dimensiones del canvas coincidan con el video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Dibujar la imagen capturada en el canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Almacenar la imagen capturada como una imagen de fondo para el canvas
    canvas.toBlob(function(blob) {
        var newImg = document.createElement('img'),
            url = URL.createObjectURL(blob);

        newImg.onload = function() {
            // Liberar el objeto URL después de cargar la imagen para evitar fugas de memoria
            URL.revokeObjectURL(url);
        };

        newImg.src = url;
         // Disparar un evento personalizado con la imagen como detalle
        var eventoImagenCargada = new CustomEvent('imagenCargada', { detail: newImg });
        document.dispatchEvent(eventoImagenCargada);
    });

    // Detener el stream de la cámara
    stopCameraStream();

    // Esconder el video y mostrar el canvas
    video.style.display = 'none';
    canvas.style.display = 'block';
});


navigator.mediaDevices.enumerateDevices()
.then(function(devices) {
  devices.forEach(function(device) {
    console.log(device.kind + ": " + device.label + " id = " + device.deviceId);
    // Aquí puedes filtrar por 'videoinput' para obtener solo las cámaras
  });
})
.catch(function(err) {
  console.log(err.name + ": " + err.message);
});

var constraints = {
    video: { deviceId: { exact: '1' } } // Reemplaza 'IdDeTuCámara' con el deviceId real
  };
  
  navigator.mediaDevices.getUserMedia(constraints)
  .then(function(stream) {
    var video = document.getElementById('camera-stream');
    video.srcObject = stream;
    video.play();
  })
  .catch(function(err) {
    console.error("Error al acceder a la cámara: ", err);
  });

  // Rellena el menú desplegable con las cámaras disponibles
navigator.mediaDevices.enumerateDevices()
.then(function(devices) {
  var select = document.getElementById('listaDeCamaras');
  devices.forEach(function(device) {
    if (device.kind === 'videoinput') {
      var option = document.createElement('option');
      option.value = device.deviceId;
      option.text = device.label || 'Cámara ' + (select.length + 1);
      select.appendChild(option);
    }
  });
});

// Inicia la cámara seleccionada cuando el usuario hace clic en el botón
document.getElementById('iniciarCamara').addEventListener('click', function() {
  var deviceId = document.getElementById('listaDeCamaras').value;
  var constraints = {
    video: { deviceId: { exact: deviceId } }
  };

  navigator.mediaDevices.getUserMedia(constraints)
  .then(function(stream) {
    var video = document.getElementById('camera-stream');
    video.srcObject = stream;
    video.play();
  })
  .catch(function(err) {
    console.error("Error al acceder a la cámara: ", err);
  });
});

function reiniciarCamara() {
    var video = document.getElementById('camera-stream');
    var canvas = document.getElementById('capture-canvas');
    
    // Mostrar el video y ocultar el canvas
    video.style.display = 'block';
    canvas.style.display = 'none';
    
    // Preferencias de la cámara: queremos video pero no audio
    var constraints = { audio: false, video: { width: 1280, height: 720 } };
    
    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
        video.srcObject = stream;
        video.play();
    })
    .catch(function(err) {
        console.log("Error al acceder a la cámara: " + err);
    });
}

document.getElementById('iniciarCamara').addEventListener('click', function() {
    reiniciarCamara();
});
  