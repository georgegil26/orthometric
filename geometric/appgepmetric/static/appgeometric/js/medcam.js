let puntosSeleccionados = [];
let modoColocacionPuntos = false;
let ctx;
let canvas;
let imagenDeFondo; // Usada para almacenar y redibujar la imagen de fondo
let imagenClonada; // Para almacenar una copia de la imagen de fondo original
let escalarPuntosActivado = false;


document.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('capture-canvas');
    if (!canvas) {
        console.error("Canvas no encontrado en el DOM.");
        return;
    }
    ctx = canvas.getContext('2d');

    document.getElementById('place-points-btn').addEventListener('click', () => {
        // Activa el modo de colocación de puntos, pero no muestra el prompt aún
        modoColocacionPuntos = !modoColocacionPuntos;
        escalarPuntosActivado = false; // Asegúrate de reiniciar esto
        puntosSeleccionados = []; // Reinicia los puntos seleccionados
    });

    canvas.addEventListener('click', (event) => {
        if (modoColocacionPuntos) {
            const rect = canvas.getBoundingClientRect();
            const x = (event.clientX - rect.left) * (canvas.width / rect.width);
            const y = (event.clientY - rect.top) * (canvas.height / rect.height);
            colocarPunto(x, y);
            puntosSeleccionados.push({x, y});
            if (puntosSeleccionados.length > 3) puntosSeleccionados.shift();
        }
    });

    document.getElementById('measure-distance-btn').addEventListener('click', () => {
        if (puntosSeleccionados.length >= 2 && scaleRatio) {
            let ultimoPunto = puntosSeleccionados[puntosSeleccionados.length - 1];
            let penultimoPunto = puntosSeleccionados[puntosSeleccionados.length - 2];
    
            // Aquí calculas la distancia en píxeles entre los dos últimos puntos
            let pixelDistance = calcularDistancia(penultimoPunto, ultimoPunto);
    
            // Y aquí conviertes esa distancia en píxeles a milímetros usando la relación de escala
            let distanciaEnMilimetros = pixelDistance / scaleRatio;
            dibujarLinea(penultimoPunto, ultimoPunto);
            let distanciaAjustada = Math.round(distanciaEnMilimetros / 0.15);
            let distanciaTpu = Math.round(distanciaEnMilimetros / 0.25);
            let distanciaPrint = Math.round(distanciaEnMilimetros / 0.4);
            document.getElementById('distance-value').innerHTML = `${distanciaEnMilimetros.toFixed(0)} mm.`;
            document.getElementById('distance-petg').innerHTML = `${distanciaAjustada} `;
            document.getElementById('distance-tpu').innerHTML = `${distanciaTpu} `;
            document.getElementById('distance-print').innerHTML = `${distanciaPrint} `;

            console.log(`La distancia en milímetros es: ${distanciaEnMilimetros.toFixed(2)} mm.`);
            // Además, puedes mostrar esta distancia en la interfaz de usuario como prefieras
        } else {
            alert('Por favor, selecciona dos puntos en el canvas para medir la distancia y asegúrate de haber establecido una escala.');
        }
    });
    

    document.getElementById('measure-angle-btn').addEventListener('click', () => {
        if (puntosSeleccionados.length === 3) {
            const angulo = Math.round(calcularAngulo(puntosSeleccionados[0], puntosSeleccionados[1], puntosSeleccionados[2]));            
            dibujarLineaAng(puntosSeleccionados[0], puntosSeleccionados[1], puntosSeleccionados[2]);
            const anguloAjustado = Math.round(angulo / 1.5);
            const anguloTpu = Math.round(angulo / 2.5);
            const anguloPrint = Math.round(angulo / 4);
            document.getElementById('angle-value').innerText = `${angulo} grados`;
            document.getElementById('angle-petg').innerText = `${anguloAjustado} `;
            document.getElementById('angle-tpu').innerText = `${anguloTpu} `;
            document.getElementById('angle-print').innerText = `${anguloPrint} `;   
        } else {
            alert('Por favor, selecciona tres puntos en el canvas para medir el ángulo.');
        }
    });

    document.getElementById('clear-btn').addEventListener('click', borrarPuntosYLineas);

    document.getElementById('fileInput').addEventListener('change', (event) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const imageUrl = URL.createObjectURL(file);
            cargarImagen(imageUrl);
        }
    });
});

document.getElementById('scale-mode-btn').addEventListener('click', function() {
    if (puntosSeleccionados.length === 2) {
        // Solo muestra el prompt si hay exactamente dos puntos seleccionados
        let distanciaMM = prompt("Ingresa la distancia en milímetros entre los dos puntos seleccionados:", "");
        if (distanciaMM) {
            let distanciaNumerica = parseFloat(distanciaMM);
            if (!isNaN(distanciaNumerica) && distanciaNumerica > 0) {
                scaleRatio = calcularDistancia(puntosSeleccionados[0], puntosSeleccionados[1]) / distanciaNumerica;
                console.log(`Relación de escala establecida: ${scaleRatio} píxeles por milímetro`);
                puntosSeleccionados = []; // Opcional: Reinicia los puntos seleccionados después de escalar
            } else {
                alert("Por favor, ingresa un número válido para la distancia.");
            }
        }
    } else {
        alert("Primero debes seleccionar dos puntos en el canvas.");
    }
});

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
    clonarImagenCanvas();

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
  
function cargarImagen(imageUrl) {
    imagenDeFondo = new Image();
    imagenDeFondo.onload = function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(imagenDeFondo, 0, 0, canvas.width, canvas.height);
        clonarImagenCanvas(); // Clonar después de cargar una nueva imagen
    };
    imagenDeFondo.src = imageUrl;
}

function colocarPunto(x, y) {
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
}

function calcularDistancia(puntoA, puntoB) {
    const dx = puntoB.x - puntoA.x;
    const dy = puntoB.y - puntoA.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function dibujarLinea(puntoA, puntoB) {
    ctx.beginPath();
    ctx.moveTo(puntoA.x, puntoA.y);
    ctx.lineTo(puntoB.x, puntoB.y);
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;
    ctx.stroke();
}

function calcularAngulo(puntoA, puntoB, puntoC) {
    const a = calcularDistancia(puntoB, puntoC);
    const b = calcularDistancia(puntoA, puntoC);
    const c = calcularDistancia(puntoA, puntoB);
    const angulo = Math.acos((a * a + c * c - b * b) / (2 * a * c)) * (180 / Math.PI);
    return angulo;
}

function dibujarLineaAng(puntoA, puntoB, puntoC) {
    ctx.beginPath();
    // Dibuja la primera línea desde el vértice del ángulo (puntoB) hasta el puntoA
    ctx.moveTo(puntoB.x, puntoB.y);
    ctx.lineTo(puntoA.x, puntoA.y);
    
    // Levanta el "pincel" antes de comenzar un nuevo camino desde el vértice hasta el otro punto
    ctx.moveTo(puntoB.x, puntoB.y);
    ctx.lineTo(puntoC.x, puntoC.y);
    
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;
    ctx.stroke();
}

function clonarImagenCanvas() {
    let canvasTemporal = document.createElement('canvas');
    let ctxTemporal = canvasTemporal.getContext('2d');
    canvasTemporal.width = canvas.width;
    canvasTemporal.height = canvas.height;
    ctxTemporal.drawImage(canvas, 0, 0);
    imagenClonada = canvasTemporal; // Almacenar el canvas temporal
}



function borrarPuntosYLineas() {
    if (!imagenClonada) {
        console.error("No hay imagen clonada disponible para restablecer.");
        return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imagenClonada, 0, 0);
    puntosSeleccionados = [];
}

function solicitarDistanciaReal() {
    let distanciaMM = prompt("Ingresa la distancia en milímetros entre los dos puntos seleccionados:", "100");
    return distanciaMM; // Retorna el valor ingresado por el usuario
}

function medirDistanciaEnMilimetros(puntoA, puntoB) {
    if (!scaleRatio) {
        alert("No se ha establecido una relación de escala.");
        return;
    }
    const pixelDistance = calcularDistancia(puntoA, puntoB);
    const realDistanceMM = pixelDistance * scaleRatio;    
    console.log(`La distancia en milímetros es: ${realDistanceMM.toFixed(2)} mm.`);
    // Aquí podrías mostrar `realDistanceMM` en la interfaz de usuario
    
}




// Asegúrate de que el DOM esté completamente cargado antes de asignar eventos
document.addEventListener('DOMContentLoaded', function() {
    // Obtiene el botón por su ID
    var cameraButton = document.getElementById('capture-camera-btn');

    // Asigna un evento click al botón
    cameraButton.addEventListener('click', function() {
        // Redirige al usuario a la URL 'upload'
        window.location.href = '/upload/'; // Asegúrate de que esta ruta coincida con la configurada en Django
    });
});

// Asegúrate de que el DOM esté completamente cargado antes de asignar eventos
document.addEventListener('DOMContentLoaded', function() {
    // Obtiene el botón por su ID
    var cameraButton = document.getElementById('reward-btn');

    // Asigna un evento click al botón
    cameraButton.addEventListener('click', function() {
        // Redirige al usuario a la URL 'upload'
        window.location.href = '/index/'; // Asegúrate de que esta ruta coincida con la configurada en Django
    });
});

