const LETRA_RELLENO = "X";

// Convierte un texto como "3,1,2" o "3 1 2" en la lista [3, 1, 2]
function leerClave(texto) {
  const partes = texto.replace(/,/g, " ").split(/\s+/).filter(parte => parte !== "");
  const clave = partes.map(Number);
  validarClave(clave);
  return clave;
}

// Comprueba que la clave tenga cada número del 1 al n una sola vez
function validarClave(clave) {
  const n = clave.length;
  if (n === 0) {
    throw new Error("Escribe una clave, por ejemplo 3,1,2.");
  }

  const ordenada = [...clave].sort((a, b) => a - b);
  for (let i = 0; i < n; i++) {
    if (ordenada[i] !== i + 1) {
      throw new Error(`La clave debe tener cada número del 1 al ${n} una sola vez.`);
    }
  }
}

// Calcula la clave inversa.
function invertirClave(clave) {
  const inversa = new Array(clave.length);
  clave.forEach((valor, indice) => {
    inversa[valor - 1] = indice + 1;
  });
  return inversa;
}

// Corta una lista de letras en grupos del mismo tamaño
function dividirEnGrupos(letras, tamano) {
  const grupos = [];
  for (let inicio = 0; inicio < letras.length; inicio += tamano) {
    grupos.push(letras.slice(inicio, inicio + tamano));
  }
  return grupos;
}

// Reordena UN grupo: cada casillero nuevo saca la letra que indica la clave
function permutarGrupo(grupo, clave) {
  return clave.map(posicion => grupo[posicion - 1]);
}

// Reordena TODOS los grupos.
// Sirve para cifrar (con la clave) y para descifrar (con la clave inversa).
function permutarGrupos(letras, clave) {
  const pasos = dividirEnGrupos(letras, clave.length).map(grupo => ({
    antes: grupo,
    despues: permutarGrupo(grupo, clave)
  }));
  const resultado = pasos.map(paso => paso.despues.join("")).join("");
  return { resultado, pasos };
}

// Quita las X de relleno del final del mensaje
function quitarRelleno(texto) {
  return texto.replace(/X+$/, "");
}

function cifrar(texto, clave) {
  const letras = Array.from(texto);

  // Si el último grupo queda incompleto, se completa con X
  const faltan = (clave.length - (letras.length % clave.length)) % clave.length;
  const conRelleno = letras.concat(Array(faltan).fill(LETRA_RELLENO));

  const { resultado, pasos } = permutarGrupos(conRelleno, clave);
  return { resultado, pasos, claveUsada: clave, rellenadas: faltan };
}

function descifrar(texto, clave) {
  const letras = Array.from(texto);

  // Un mensaje cifrado siempre se divide en grupos exactos
  if (letras.length % clave.length !== 0) {
    throw new Error(
      `El mensaje tiene ${letras.length} caracteres y no se divide en grupos de ${clave.length}. ` +
      "Revisa que lo copiaste completo (los espacios y saltos de línea también cuentan) y que el tamaño de la clave es correcto."
    );
  }

  const inversa = invertirClave(clave);
  const { resultado, pasos } = permutarGrupos(letras, inversa);
  const sinRelleno = quitarRelleno(resultado);

  return {
    resultado: sinRelleno,
    pasos,
    claveUsada: inversa,
    claveOriginal: clave,
    quitadas: resultado.length - sinRelleno.length
  };
}

// INTERFAZ
let modo = "cifrar";

// Textos de ejemplo para el botón "Cargar ejemplo"
const EJEMPLOS = {
  "cifrar":    { mensaje: "Hola Mundo",   clave: "3,1,2" },
  "descifrar": { mensaje: "lHoMa dunXoX", clave: "3,1,2" }
};

// Referencias a los elementos de la página
const campoMensaje = document.getElementById("mensaje");
const campoClave = document.getElementById("clave");
const casillaEspacios = document.getElementById("espacios");
const etiquetaMensaje = document.getElementById("etiqueta-mensaje");
const textoError = document.getElementById("error");
const zonaResultado = document.getElementById("zona-resultado");
const cajaResultado = document.getElementById("resultado");
const textoNota = document.getElementById("nota");
const zonaPasos = document.getElementById("zona-pasos");
const tituloPasos = document.getElementById("titulo-pasos");
const contenidoPasos = document.getElementById("contenido-pasos");
const botonCopiar = document.getElementById("boton-copiar");

// Crea un elemento de forma corta: crear("span", "celda", "texto")
function crear(etiqueta, clase, texto) {
  const elemento = document.createElement(etiqueta);
  if (clase) elemento.className = clase;
  if (texto !== undefined) elemento.textContent = texto;
  return elemento;
}

// Los espacios y los saltos de línea se muestran con un símbolo para que se vean en los pasos
function visible(letra) {
  if (letra === " ") return "␣";
  if (letra === "\n") return "↵";
  return letra;
}

function mostrarError(mensaje) {
  textoError.textContent = mensaje;
  textoError.hidden = false;
}

function ocultarResultados() {
  textoError.hidden = true;
  zonaResultado.hidden = true;
  zonaPasos.hidden = true;
  textoNota.hidden = true;
}

function cambiarModo(nuevoModo) {
  modo = nuevoModo;

  document.querySelectorAll(".opcion").forEach(boton => {
    boton.classList.toggle("activa", boton.dataset.modo === modo);
  });

  etiquetaMensaje.textContent = (modo === "cifrar") ? "Mensaje de entrada" : "Mensaje cifrado";
  campoMensaje.placeholder = (modo === "cifrar") ? "Hola Mundo" : "lHoMa dunXoX";

  ocultarResultados();
}

// Lee el mensaje y aplica la opción de los espacios.
// Los saltos de línea se conservan: cuentan como un carácter más del mensaje.
function leerMensaje() {
  let mensaje = campoMensaje.value.replace(/\r\n?/g, "\n");
  if (!casillaEspacios.checked) {
    mensaje = mensaje.replace(/ /g, "");
  }
  if (mensaje === "") {
    throw new Error("Escribe un mensaje.");
  }
  return mensaje;
}

// ---- Dibujo de los pasos ----

// Dibuja una fila de casillas, una por cada letra
function dibujarCeldas(letras, claseExtra) {
  const contenedor = crear("span", "celdas");
  letras.forEach(letra => {
    contenedor.appendChild(crear("span", "celda " + claseExtra, visible(letra)));
  });
  return contenedor;
}

function dibujarPasos(pasos, explicacionClave) {
  contenidoPasos.replaceChildren();
  tituloPasos.textContent = `Pasos del proceso (${pasos.length} grupos)`;
  contenidoPasos.appendChild(crear("p", "texto-clave", explicacionClave));

  pasos.forEach((paso, indice) => {
    const fila = crear("div", "fila-paso");
    fila.appendChild(crear("span", "nombre-grupo", `Grupo ${indice + 1}`));
    fila.appendChild(dibujarCeldas(paso.antes, ""));
    fila.appendChild(crear("span", "flecha", "→"));
    fila.appendChild(dibujarCeldas(paso.despues, "nueva"));
    contenidoPasos.appendChild(fila);
  });
}

// Muestra el resultado principal y, si hay, una nota debajo
function mostrarResultado(texto, nota) {
  cajaResultado.textContent = texto;
  zonaResultado.hidden = false;

  textoNota.hidden = !nota;
  textoNota.textContent = nota || "";
}

// ---- Acciones de los botones ----

function procesar() {
  ocultarResultados();

  try {
    const mensaje = leerMensaje();
    const clave = leerClave(campoClave.value);

    if (modo === "cifrar") {
      const salida = cifrar(mensaje, clave);

      const nota = salida.rellenadas > 0
        ? `Se agregaron ${salida.rellenadas} letras X de relleno para completar el último grupo.`
        : "";
      mostrarResultado(salida.resultado, nota);
      dibujarPasos(salida.pasos,
        `Se aplica la clave ${clave.join(" ")} a cada grupo. El casillero 1 saca la letra ${clave[0]}, y así con los demás.`);
      zonaPasos.hidden = false;

    } else if (modo === "descifrar") {
      const salida = descifrar(mensaje, clave);

      const nota = salida.quitadas > 0
        ? `Se quitaron ${salida.quitadas} letras X de relleno del final. Si tu mensaje terminaba en X de verdad, revisa los pasos.`
        : "";
      mostrarResultado(salida.resultado, nota);
      dibujarPasos(salida.pasos,
        `La clave ${salida.claveOriginal.join(" ")} se invierte y queda ${salida.claveUsada.join(" ")}. ` +
        "Esa clave inversa se aplica a cada grupo.");
      zonaPasos.hidden = false;
    }

  } catch (error) {
    mostrarError(error.message);
  }
}

function limpiar() {
  campoMensaje.value = "";
  campoClave.value = "";
  ocultarResultados();
}

function cargarEjemplo() {
  const ejemplo = EJEMPLOS[modo];
  campoMensaje.value = ejemplo.mensaje;
  campoClave.value = ejemplo.clave;
  casillaEspacios.checked = true;
  procesar();
}

function copiarResultado() {
  const texto = cajaResultado.textContent;
  const avisar = () => {
    botonCopiar.textContent = "Copiado";
    setTimeout(() => { botonCopiar.textContent = "Copiar"; }, 1500);
  };

  if (navigator.clipboard) {
    navigator.clipboard.writeText(texto).then(avisar);
  }
}

// ---- Conexión de los botones con las funciones ----

document.querySelectorAll(".opcion").forEach(boton => {
  boton.addEventListener("click", () => cambiarModo(boton.dataset.modo));
});
document.getElementById("boton-procesar").addEventListener("click", procesar);
document.getElementById("boton-limpiar").addEventListener("click", limpiar);
document.getElementById("boton-ejemplo").addEventListener("click", cargarEjemplo);
botonCopiar.addEventListener("click", copiarResultado);