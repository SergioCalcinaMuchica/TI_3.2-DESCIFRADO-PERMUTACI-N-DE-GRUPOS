const LETRA_RELLENO = "X";

// Pares, tríos de letras y palabras muy frecuentes en español.
// Solo sirven para ordenar los candidatos del modo sin clave.
const PARES_FRECUENTES = ["ES", "EN", "EL", "DE", "LA", "OS", "AR", "ER", "RE", "ON",
                          "AS", "CI", "ST", "NT", "UE", "AL", "OR", "AD", "TA", "QU",
                          "DO", "CO", "IO", "RA", "NA", "TE", "SE", "LE", "NO", "DA"];
const TRIOS_FRECUENTES = ["QUE", "ENT", "ION", "CIO", "ADO", "ANT", "DEL", "LOS", "LAS",
                          "CON", "ERA", "ARA", "ODO", "ENC"];
const PALABRAS_FRECUENTES = ["DE", "LA", "EL", "EN", "ES", "UN", "UNA", "QUE", "LOS", "LAS",
                             "CON", "POR", "AL", "DEL", "SE", "SU", "LO", "NO", "SI", "MAS",
                             "PARA", "COMO", "ESTA", "ESTE", "SON", "HAY", "MUY", "SERA"];


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
      "Revisa que lo copiaste completo y que el tamaño de la clave es correcto."
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


// ---- Modo sin clave (se prueban todas las claves de un tamaño) ----

// Genera todas las permutaciones de los números 1..n
function todasLasPermutaciones(n) {
  const todas = [];

  function construir(actual, usados) {
    if (actual.length === n) {
      todas.push(actual);
      return;
    }
    for (let numero = 1; numero <= n; numero++) {
      if (!usados.has(numero)) {
        construir([...actual, numero], new Set([...usados, numero]));
      }
    }
  }

  construir([], new Set());
  return todas;
}


// Cuenta cuántas señales de español aparecen. Más puntos, más parece español.
//   1 punto por cada par de letras frecuente
//   2 puntos por cada trío de letras frecuente
//   3 puntos por cada palabra frecuente completa
//   2 puntos si el texto termina en X, porque suele ser el relleno
function puntaje(texto) {
  // Se quitan las tildes y se pasa a mayúsculas para comparar con las listas
  const limpio = texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();
  let total = 0;

  for (const par of PARES_FRECUENTES) {
    total += limpio.split(par).length - 1;
  }
  for (const trio of TRIOS_FRECUENTES) {
    total += 2 * (limpio.split(trio).length - 1);
  }
  for (const palabra of limpio.split(/[^A-Z]+/)) {
    if (PALABRAS_FRECUENTES.includes(palabra)) {
      total += 3;
    }
  }
  if (texto.endsWith(LETRA_RELLENO)) {
    total += 2;
  }
  return total;
}


function probarTodasLasClaves(texto, tamano, cuantos = 10) {
  const letras = Array.from(texto);
  if (letras.length % tamano !== 0) {
    throw new Error(
      `El mensaje tiene ${letras.length} caracteres y no se divide en grupos de ${tamano}.`
    );
  }

  const candidatos = todasLasPermutaciones(tamano).map(clave => {
    const textoProbado = permutarGrupos(letras, invertirClave(clave)).resultado;
    return { clave, texto: textoProbado, puntos: puntaje(textoProbado) };
  });

  candidatos.sort((a, b) => b.puntos - a.puntos);
  return candidatos.slice(0, cuantos);
}


// INTERFAZ
let modo = "cifrar";

// Textos de ejemplo para el botón "Cargar ejemplo"
const EJEMPLOS = {
  "cifrar":    { mensaje: "Hola Mundo",   clave: "3,1,2", tamano: "" },
  "descifrar": { mensaje: "lHoMa dunXoX", clave: "3,1,2", tamano: "" },
  "sin-clave": { mensaje: "lHoMa dunXoX", clave: "",      tamano: "3" }
};

// Referencias a los elementos de la página
const campoMensaje = document.getElementById("mensaje");
const campoClave = document.getElementById("clave");
const campoTamano = document.getElementById("tamano");
const casillaEspacios = document.getElementById("espacios");
const bloqueClave = document.getElementById("bloque-clave");
const bloqueTamano = document.getElementById("bloque-tamano");
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


// Los espacios se muestran con un símbolo para que se vean en los pasos
function visible(letra) {
  return letra === " " ? "␣" : letra;
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

  // En el modo sin clave se pide el tamaño del grupo en lugar de la clave
  bloqueClave.hidden = (modo === "sin-clave");
  bloqueTamano.hidden = (modo !== "sin-clave");

  etiquetaMensaje.textContent = (modo === "cifrar") ? "Mensaje de entrada" : "Mensaje cifrado";
  campoMensaje.placeholder = (modo === "cifrar") ? "Hola Mundo" : "lHoMa dunXoX";

  ocultarResultados();
}


// Lee el mensaje y aplica la opción de los espacios
function leerMensaje() {
  let mensaje = campoMensaje.value.replace(/\r?\n/g, "");
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


function dibujarCandidatos(candidatos, tamano) {
  contenidoPasos.replaceChildren();
  tituloPasos.textContent = `Mejores candidatos (${candidatos.length})`;
  contenidoPasos.appendChild(crear("p", "texto-clave",
    `Se probaron las ${candidatos.length > 0 ? factorial(tamano) : 0} claves posibles de tamaño ${tamano}. ` +
    "El orden es solo una ayuda, la decisión final es leer cuál tiene sentido."));

  candidatos.forEach((candidato, indice) => {
    const fila = crear("div", "candidato");
    fila.appendChild(crear("span", "posicion", String(indice + 1)));
    fila.appendChild(crear("span", "datos-candidato",
      `Clave ${candidato.clave.join(" ")}, puntaje ${candidato.puntos}`));
    fila.appendChild(crear("span", "texto-candidato", candidato.texto));
    contenidoPasos.appendChild(fila);
  });
}


function factorial(n) {
  return n <= 1 ? 1 : n * factorial(n - 1);
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

    if (modo === "cifrar") {
      const clave = leerClave(campoClave.value);
      const salida = cifrar(mensaje, clave);

      const nota = salida.rellenadas > 0
        ? `Se agregaron ${salida.rellenadas} letras X de relleno para completar el último grupo.`
        : "";
      mostrarResultado(salida.resultado, nota);
      dibujarPasos(salida.pasos,
        `Se aplica la clave ${clave.join(" ")} a cada grupo. El casillero 1 saca la letra ${clave[0]}, y así con los demás.`);
      zonaPasos.hidden = false;

    } else if (modo === "descifrar") {
      const clave = leerClave(campoClave.value);
      const salida = descifrar(mensaje, clave);

      const nota = salida.quitadas > 0
        ? `Se quitaron ${salida.quitadas} letras X de relleno del final. Si tu mensaje terminaba en X de verdad, revisa los pasos.`
        : "";
      mostrarResultado(salida.resultado, nota);
      dibujarPasos(salida.pasos,
        `La clave ${salida.claveOriginal.join(" ")} se invierte y queda ${salida.claveUsada.join(" ")}. ` +
        "Esa clave inversa se aplica a cada grupo.");
      zonaPasos.hidden = false;

    } else {
      const tamano = Number(campoTamano.value);
      if (!Number.isInteger(tamano) || tamano < 2 || tamano > 8) {
        throw new Error("El tamaño del grupo debe ser un número entero entre 2 y 8.");
      }

      const candidatos = probarTodasLasClaves(mensaje, tamano);
      const hayEmpate = candidatos.length > 1 && candidatos[1].puntos === candidatos[0].puntos;

      const nota = hayEmpate
        ? "Hay varios candidatos con el mismo puntaje, revisa la lista de abajo y elige el que tenga sentido."
        : `Este es el candidato con mejor puntaje (clave ${candidatos[0].clave.join(" ")}). Revisa los demás abajo.`;
      mostrarResultado(quitarRelleno(candidatos[0].texto), nota);
      dibujarCandidatos(candidatos, tamano);
      zonaPasos.hidden = false;
    }

  } catch (error) {
    mostrarError(error.message);
  }
}


function limpiar() {
  campoMensaje.value = "";
  campoClave.value = "";
  campoTamano.value = "";
  ocultarResultados();
}


function cargarEjemplo() {
  const ejemplo = EJEMPLOS[modo];
  campoMensaje.value = ejemplo.mensaje;
  campoClave.value = ejemplo.clave;
  campoTamano.value = ejemplo.tamano;
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
