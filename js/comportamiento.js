// Variables globales
const grid = document.querySelector('.grid');
const keyboard = document.querySelector('.keyboard');
const mensaje = document.getElementById('mensaje');
let palabraCorrecta = '';
let intentos = 6;
let intentoActual = 0;

function crearGrid() {
    for (let i = 0; i < intentos; i++) {    
        let fila = document.createElement('div');
        fila.classList.add('fila');
        fila.style.display = 'grid';
        fila.style.gridTemplateColumns = 'repeat(5, 60px)';
        fila.style.gap = '10px';
        fila.style.marginBottom = '10px';

        for (let j = 0; j < 5; j++) {
            let casilla = document.createElement('div');
            casilla.classList.add('casilla');
            fila.appendChild(casilla);
        }
        grid.appendChild(fila);
    }
}

function crearTeclado() {
    keyboard.innerHTML = '';

    const filas = [
        'qwertyuiop',
        'asdfghjkl',
        'zxcvbnm'
    ];

    filas.forEach((filaLetras, index) => {
        const fila = document.createElement('div');
        fila.classList.add('keyboard-row');

        if (index === 2) {
            const enter = document.createElement('button');
            enter.textContent = 'ENTER';
            enter.classList.add('wide');
            enter.addEventListener('click', revisarIntento);
            fila.appendChild(enter);
        }

        filaLetras.split('').forEach(letra => {
            const boton = document.createElement('button');
            boton.textContent = letra.toUpperCase();
            boton.addEventListener('click', () => ingresarLetra(letra.toUpperCase()));
            fila.appendChild(boton);
        });

        if (index === 2) {
            const borrar = document.createElement('button');
            borrar.textContent = '⌫';
            borrar.classList.add('wide');
            borrar.addEventListener('click', borrarLetra);
            fila.appendChild(borrar);
        }

        keyboard.appendChild(fila);
    });
}

// Agregar la letra al intento actual
function ingresarLetra(letra) {
    if (intentoActual < intentos) {
        const fila = grid.children[intentoActual];
        const casillas = fila.children;
        for (let i = 0; i < casillas.length; i++) {
            if (!casillas[i].textContent) {
                casillas[i].textContent = letra;
                break;
            }
        }
    }
}

// Revisar el intento
async function revisarIntento(){
    const fila = grid.children[intentoActual];
    const casillas = Array.from(fila.children);
    const palabraIntento = casillas.map(casilla => casilla.textContent.toLowerCase()).join('');
    
    if (palabraIntento.length < 5) {
        mensaje.textContent = 'Completa la palabra antes de revisar.';
        return;
    }

    // VALIDACIÓN CON RAE
    const existe = await palabraExisteRAE(palabraIntento);
    if (!existe) {
        console.warn(`Palabra "${palabraIntento}" no encontrada en RAE. Se permite.`);
    }
    
    if (palabraIntento === palabraCorrecta) {
        mensaje.textContent = '¡Felicidades, has ganado!';
        colorearFila(casillas, palabraIntento);
        actualizarTeclado(palabraIntento);
        return;
    }

    // Colorear las casillas
    colorearFila(casillas, palabraIntento);

    // Colorear el teclado
    actualizarTeclado(palabraIntento);

    intentoActual++;
    if (intentoActual === intentos) {
        mensaje.textContent = `Perdiste. La palabra correcta era: ${palabraCorrecta.toUpperCase()}`;
    }
}

// Función para colorear las casillas de la fila
function colorearFila(casillas, palabraIntento) {
    for (let i = 0; i < 5; i++) {
        if (palabraIntento[i] === palabraCorrecta[i]) {
            casillas[i].style.backgroundColor = 'green';
            casillas[i].style.color = 'white';
        } else if (palabraCorrecta.includes(palabraIntento[i])) {
            casillas[i].style.backgroundColor = 'yellow';
            casillas[i].style.color = 'black';
        } else {
            casillas[i].style.backgroundColor = 'gray';
            casillas[i].style.color = 'white';
        }
    }
}

// Función para actualizar el teclado
function actualizarTeclado(palabraIntento) {
    for (let i = 0; i < 5; i++) {
        const letra = palabraIntento[i].toUpperCase();
        const boton = Array.from(keyboard.querySelectorAll('button'))
            .find(b => b.textContent === letra);

        if (boton) {
            if (palabraIntento[i] === palabraCorrecta[i]) {
                boton.style.backgroundColor = 'green';
                boton.style.color = 'white';
            } else if (palabraCorrecta.includes(palabraIntento[i])) {
                if (boton.style.backgroundColor !== 'green') {
                    boton.style.backgroundColor = 'yellow';
                    boton.style.color = 'black';
                }
            } else {
                // Si no está ni verde ni amarillo, marcar gris
                if (boton.style.backgroundColor !== 'green' && boton.style.backgroundColor !== 'yellow') {
                    boton.style.backgroundColor = 'gray';
                    boton.style.color = 'white';
                }
            }
        }
    }
}

// Función para borrar la última letra
function borrarLetra() {
    if (intentoActual < intentos) {
        const fila = grid.children[intentoActual];
        const casillas = Array.from(fila.children);
        for (let i = casillas.length - 1; i >= 0; i--) {
            if (casillas[i].textContent) {
                casillas[i].textContent = '';
                break;
            }
        }
    }
}

// Eventos de teclado físico
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') revisarIntento();
    if (e.key === 'Backspace') borrarLetra();
});

// Inicializar el juego
async function iniciarJuego() {
    crearGrid();
    crearTeclado();
    await obtenerPalabra();
}

// Obtener palabra aleatoria
async function obtenerPalabra() {
    try {
        let palabraValida = false;
        while (!palabraValida) {
            const respuesta = await fetch('https://random-word-api.herokuapp.com/word?lang=es');
            const datos = await respuesta.json();
            const palabra = datos[0].toLowerCase();

            if (palabra.length === 5) {
                palabraCorrecta = palabra;
                palabraValida = true;
            }
        }
        console.log('Palabra correcta:', palabraCorrecta);
    } catch (error) {
        mensaje.textContent = 'Error al cargar la palabra';
        console.error(error);
    }
}

// Validación RAE
async function palabraExisteRAE(palabra) {
    const palabraNormalizada = normalizarPalabra(palabra);
    try {
        const respuesta = await fetch(`https://rae-api.com/api/words/${palabraNormalizada}`);
        return respuesta.ok;
    } catch {
        return false;
    }
}

// Normalizar palabra
function normalizarPalabra(palabra) {
    return palabra.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

// Iniciar juego
iniciarJuego();