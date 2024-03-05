let puntosSeleccionados = [];
let modoColocacionPuntos = false;
let ctx;
let canvas;
let imagenDeFondo;
let escala;
let anchoAjustado;

document.addEventListener('DOMContentLoaded', () => {
    
    canvas = document.getElementById('capture-canvas');
    ctx = canvas.getContext('2d');

    canvas.width = 650; // Ancho fijo
    canvas.height = 450; // Alto fijo

    document.getElementById('image-input').addEventListener('change', function(event) {
        if (event.target.files && event.target.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                imagenDeFondo = new Image();
                imagenDeFondo.onload = function() {
                    // Actualiza las variables globales
                    escala = canvas.height / imagenDeFondo.height;
                    anchoAjustado = imagenDeFondo.width * escala;
                    
                    // Dibuja la imagen ajustada en el canvas
                    ctx.drawImage(imagenDeFondo, 0, 0, anchoAjustado, canvas.height);
                };
                imagenDeFondo.src = e.target.result;
            };
            reader.readAsDataURL(event.target.files[0]);
        }
    });
    

    document.getElementById('place-points-btn').addEventListener('click', () => {
        modoColocacionPuntos = !modoColocacionPuntos;
    });

    canvas.addEventListener('click', event => {
        if (!modoColocacionPuntos) return;
        const {x, y} = obtenerCoordenadasRelativas(event);
        colocarPunto(x, y);
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
            document.getElementById('distance-value').innerHTML = `${distanciaEnMilimetros.toFixed(2)} mm.`;
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
});


function colocarPunto(x, y) {
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    puntosSeleccionados.push({x, y});
}

function obtenerCoordenadasRelativas(event) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
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


function borrarPuntosYLineas() {
    if (imagenDeFondo) {
        // Restablece las transformaciones del contexto
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Usa las variables globales para redibujar la imagen de fondo
        ctx.drawImage(imagenDeFondo, 0, 0, anchoAjustado, canvas.height);
        puntosSeleccionados = [];
    }
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

document.addEventListener('DOMContentLoaded', function() {
    // Obtiene el botón por su ID
    var cameraButton = document.getElementById('capture-camera-btn');

    // Asigna un evento click al botón
    cameraButton.addEventListener('click', function() {
        // Redirige al usuario a la URL 'upload'
        window.location.href = '/upload/'; // Asegúrate de que esta ruta coincida con la configurada en Django
    });
});

document.addEventListener('DOMContentLoaded', function() {
    // Obtiene el botón por su ID
    var uploadButton = document.getElementById('reward-btn');

    // Asigna un evento click al botón
    uploadButton.addEventListener('click', function() {
        // Redirige al usuario a la URL 'upload'
        window.location.href = '/index/'; // Asegúrate de que esta ruta coincida con la configurada en Django
    });
});

document.addEventListener('DOMContentLoaded', function() {
    // Obtiene el botón por su ID
    var uploadButton = document.getElementById('upload-image-btn');

    // Asigna un evento click al botón
    uploadButton.addEventListener('click', function() {
        // Redirige al usuario a la URL 'upload'
        window.location.href = '/image/'; // Asegúrate de que esta ruta coincida con la configurada en Django
    });
});
document.addEventListener('DOMContentLoaded', function() {
    // Obtiene el botón por su ID
    var uploadButton = document.getElementById('reward-img-btn');

    // Asigna un evento click al botón
    uploadButton.addEventListener('click', function() {
        // Redirige al usuario a la URL 'upload'
        window.location.href = '/index/'; // Asegúrate de que esta ruta coincida con la configurada en Django
    });
});