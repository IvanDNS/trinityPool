import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCvAkjnBWvfNnDyzistVBFP2mZcymrRRQo",
  authDomain: "trinity-pool.firebaseapp.com",
  databaseURL: "https://trinity-pool-default-rtdb.firebaseio.com",
  projectId: "trinity-pool",
  storageBucket: "trinity-pool.appspot.com",
  messagingSenderId: "808109751915",
  appId: "1:808109751915:web:19dea37524c488b15dbb2e"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ------------------------------
// CARGAR PARTIDAS
// ------------------------------
const partidasRef = ref(db, "partidas");

let partidas = [];
let partidasVisibles = [];
let estadoOrden = {};

onValue(partidasRef, (snapshot) => {
  const data = snapshot.val();
  partidas = [];

  if (data) {
    partidas = Object.entries(data)
      .map(([id, p]) => ({ ...p, id })) // <-- añadimos la key como campo "id"
      .sort((a, b) => b.id.localeCompare(a.id));
  }

  partidasVisibles = [...partidas];
  renderizarPartidas(partidasVisibles);

// ganadorPorMes
const resultados = ganadorPorMesSeparado(partidas);

resultados.forEach(({ mes, anio, ganador, victorias }) => {
  console.log(`Mes: ${mes}, Año: ${anio}, Ganador: ${ganador}, Victorias: ${victorias}`);

  // Si quieres modificar el HTML
  const img = document.getElementById(`trofeo-${mes}-${anio}`);
  if (img) {
    const nombre = ganador.toLowerCase().replace(/\s/g, "");
    img.src = `/img/trofeo/trofeo-${nombre}.png`;
  }

  const victoriasEl = document.getElementById(`victorias-${mes}-${anio}`);
  if (victoriasEl) {
    victoriasEl.textContent = `${ganador} ganó ${victorias} veces`;
  }
});


});


function renderizarPartidas(lista) {
  const tbody = document.getElementById("tablaPartidas");
  if (!tbody) return;

  tbody.innerHTML = "";

  lista.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="px-4 py-2">${formatearFecha(row.fecha)}</td>
      <td class="px-4 py-2">${row.jugador1 ?? "-----"}</td>
      <td class="px-4 py-2">${row.jugador2 ?? "-----"}</td>
      <td class="px-4 py-2">${row.jugador3 ?? "-----"}</td>
      <td class="px-4 py-2 font-bold text-center${
        row.ganador === 'Ivánchiz'
          ? ' text-yellow-400'
          : row.ganador === 'Fatyka'
          ? ' text-green-400'
          : row.ganador === 'Yuri'
          ? ' text-purple-400'
          : ''
      }">${row.ganador}</td>
    `;
    tbody.appendChild(tr);
  });
}

//Formatear fecha
function formatearFecha(fechaISO) {
  if (!fechaISO) return "";

  const fecha = new Date(fechaISO);
  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const anio = fecha.getFullYear();

  return `${dia}/${mes}/${anio}`;
}

// ------------------------------
// ORDENAR TABLA
// ------------------------------
window.ordenarPor = (campo) => {
  const asc = !estadoOrden[campo];
  estadoOrden[campo] = asc;

  // Ordenamos por id, ignorando campo
  partidasVisibles.sort((a, b) => {
    return asc ? a.id.localeCompare(b.id) : b.id.localeCompare(a.id);
  });

  renderizarPartidas(partidasVisibles);
};


//Contar ausencias
function contarAusencias(nombreJugador) {
  return partidas.filter(p =>
    p.jugador1 !== nombreJugador &&
    p.jugador2 !== nombreJugador &&
    p.jugador3 !== nombreJugador
  ).length;
}


// ------------------------------
// FILTRAR GANADORES
// ------------------------------
const ganadores = ["Ivánchiz", "Fatyka", "Yuri", "Todos"];
let indexGanador = 0;
window.filtrarCiclicoGanador = () => {
  const ganador = ganadores[indexGanador];

  const boton = document.getElementById("botonFiltroGanador");
  if (boton) {
    boton.textContent = ganador === "Todos" ? "Mostrar todos" : `Ganadas por ${ganador}`;
  }

  partidasVisibles = ganador === "Todos"
    ? [...partidas]
    : partidas.filter(p => p.ganador === ganador);

  renderizarPartidas(partidasVisibles);

  indexGanador = (indexGanador + 1) % ganadores.length;
};


// ------------------------------
// CARGAR ESTADÍSTICAS
// ------------------------------
const estadisticasRef = ref(db, "estadisticas");

onValue(estadisticasRef, (snapshot) => {
  const data = snapshot.val();
  if (!data) return;

  // Carga las estadísticas para los jugadores que estén en la base
  Object.keys(data).forEach((jugador) => {
    mostrarEstadisticas(jugador, data[jugador]);
  });

  // También llenamos la tabla de resumen
const tbody = document.getElementById("tabla-estadisticas");
if (tbody) {
  tbody.innerHTML = ""; // Limpiar primero

  Object.entries(data).forEach(([jugador, stats]) => {
    const { partidas_jugadas = 0, victorias = 0, derrotas = 0, winrate = "0%" } = stats;

    const fila = document.createElement("tr");
    fila.classList.add("border-t", "border-gray-700");

    fila.innerHTML = `
      <td class="px-4 py-2 text-yellow-400 font-bold">${jugador}</td>
      <td class="px-4 py-2">${partidas_jugadas}</td>
      <td class="px-4 py-2 font-bold text-green-400">${victorias}</td>
      <td class="px-4 py-2 font-bold text-red-400">${derrotas}</td>
      <td class="px-4 py-2 font-bold text-yellow-400">${winrate}</td>
    `;

    tbody.appendChild(fila);
  });
}
});

function mostrarEstadisticas(nombre, stats) {
  if (!stats) return;
  const bolasEmbocadas = (parseInt(stats.victorias) || 0) * 8;
  const ausencias = contarAusencias(nombre);
  const minutos = (parseInt(stats.partidas_jugadas) || 0) * 32;
  const horas = (parseInt(stats.partidas_jugadas) || 0) * 0.53;
  const longestStreak = calcularRachaMaxima(nombre);
  // Normalizo id sin tildes
  const idSafe = nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s/g, '');

  document.querySelectorAll(`.partidas-${idSafe}`).forEach(el => {
    el.textContent = stats.partidas_jugadas ?? 0;
  });
  document.querySelectorAll(`.victorias-${idSafe}`).forEach(el => {
    el.textContent = stats.victorias ?? 0;
  });
  document.querySelectorAll(`.derrotas-${idSafe}`).forEach(el => {
    el.textContent = stats.derrotas ?? 0;
  });
  document.querySelectorAll(`.winrate-${idSafe}`).forEach(el => {
    el.textContent = stats.winrate ?? 0;
  });
  document.querySelectorAll(`.winrateBar-${idSafe}`).forEach(bar => {
    const winrateNum = parseFloat((stats.winrate ?? "0").replace("%", ""));
    bar.style.width = `${winrateNum}%`;
  });
  document.querySelectorAll(`.bolasEmbocadas-${idSafe}`).forEach(el => {
    el.textContent = bolasEmbocadas.toLocaleString();
  });
  document.querySelectorAll(`.ausencias-${idSafe}`).forEach(el => {
    el.textContent = ausencias;
  });
  document.querySelectorAll(`.minutos-${idSafe}`).forEach(el => {
    el.textContent = minutos.toLocaleString();
  });
  document.querySelectorAll(`.horas-${idSafe}`).forEach(el => {
    el.textContent = horas.toLocaleString();
  });
  document.querySelectorAll(`.racha-${idSafe}`).forEach(el => {
    el.textContent = longestStreak;
  });
  
}

function calcularRachaMaxima(jugador) {
  if (!partidas || partidas.length === 0) return 0;

  let rachaActual = 0;
  let rachaMaxima = 0;

  partidas.forEach(p => {
    const jugo = p.jugador1 === jugador || p.jugador2 === jugador || p.jugador3 === jugador;
    const gano = p.ganador === jugador;

    if (jugo && gano) {
      rachaActual++;
      rachaMaxima = Math.max(rachaMaxima, rachaActual);
    } else if (jugo) {
      rachaActual = 0; // jugó y no ganó → se rompe la racha
    }
    // Si no jugó, no afecta la racha
  });

  return rachaMaxima;
}

// ------------------------------
// HALL DE LA FAMA, CONTAR VICTORIAS POR MES Y MOSTRAR
// ------------------------------
function ganadorPorMesSeparado(lista) {
  const contador = {};

  lista.forEach((partida) => {
    if (!partida.fecha || !partida.ganador) return;

    const fecha = new Date(partida.fecha);
    const mes = fecha.getMonth() + 1;
    const anio = fecha.getFullYear();
    const clave = `${mes}-${anio}`;

    if (!contador[clave]) {
      contador[clave] = {};
    }

    if (!contador[clave][partida.ganador]) {
      contador[clave][partida.ganador] = { victorias: 0, vencidos: new Set() };
    }

    contador[clave][partida.ganador].victorias++;

    const vencidos = [partida.jugador1, partida.jugador2, partida.jugador3].filter(j => j && j !== partida.ganador);
    vencidos.forEach(v => contador[clave][partida.ganador].vencidos.add(v));
  });

  const resultado = [];

  for (const mes in contador) {
    const jugadores = contador[mes];
    let maxJugador = null;
    let maxVictorias = -1;
    let maxVencidos = -1;

    for (const jugador in jugadores) {
      const { victorias, vencidos } = jugadores[jugador];

      if (victorias > maxVictorias) {
        maxJugador = jugador;
        maxVictorias = victorias;
        maxVencidos = vencidos.size;
      } else if (victorias === maxVictorias) {
        if (vencidos.size > maxVencidos) {
          maxJugador = jugador;
          maxVencidos = vencidos.size;
        }
      }
    }

    resultado.push({
      mes: parseInt(mes.split("-")[0]),    // solo el número de mes
      anio: parseInt(mes.split("-")[1]),   // el año
      ganador: maxJugador,
      victorias: maxVictorias
    });
  }

  return resultado;
}


// Cambiar Sección del main (conservar estructura general)
window.mostrarSeccion = function(id) {
  // Ocultar todas las secciones inferiores
  document.querySelectorAll('[id^="seccion-"]').forEach(sec => sec.classList.add("hidden"));
  
  // Mostrar la sección inferior activa
  const activa = document.getElementById(`seccion-${id}`);
  if (activa) activa.classList.remove("hidden");

  // Siempre mostrar secciónSuperior1 (el banner superior)
  document.querySelectorAll('[id^="seccionSuperior"]').forEach(sup => sup.classList.add("hidden"));
  const superior1 = document.getElementById("seccionSuperior1");
  if (superior1) superior1.classList.remove("hidden");

  // Cambiar color activo del menú
  document.querySelectorAll(".item-menu").forEach(el => el.classList.remove("bg-[#04D7FF]"));
  
  const activoMenu = document.querySelector(`[data-seccion="${id}"]`);
  if (activoMenu) activoMenu.classList.add("bg-[#04D7FF]");
};




window.cambiarSeccionSuperior = function(id, elemento) {
  const secciones = document.querySelectorAll('[id^="seccionSuperior"]');
  secciones.forEach(sec => sec.classList.add("hidden"));

  const activa = document.getElementById(id);
  if (activa) activa.classList.remove("hidden");

  document.querySelectorAll(".item-menu").forEach(el => {
    el.classList.remove("bg-[#04D7FF]");
  });

  if (elemento) {
    elemento.classList.add("bg-[#04D7FF]");
  }
};


// ------------------------------
// MÚSICA
// ------------------------------
const audio = document.getElementById('miCancion');
const boton = document.getElementById('botonMusica');
const icono = document.getElementById('iconoMusica');
audio.volume = 0.2;

boton.addEventListener('click', () => {
  if (audio.paused) {
    audio.play();
    icono.classList.remove('fa-circle-play');
    icono.classList.add('fa-circle-pause');
  } else {
    audio.pause();
    icono.classList.remove('fa-circle-pause');
    icono.classList.add('fa-circle-play');
  }
});

// ------------------------------
// SLIDER
// ------------------------------
window.toggleSlide = function (id = '') {
  const basic = document.getElementById('slide-basic' + (id ? '-' + id : ''));
  const stats = document.getElementById('slide-stats' + (id ? '-' + id : ''));
  const icon = document.querySelector(`#toggle-arrow${id ? '-' + id : ''} i`);

  const isBasicVisible = basic.classList.contains('translate-x-0');

  if (isBasicVisible) {
    basic.classList.remove('translate-x-0', 'opacity-100', 'z-10');
    basic.classList.add('-translate-x-full', 'opacity-0', 'z-0');

    stats.classList.remove('translate-x-full', 'opacity-0', 'z-0');
    stats.classList.add('translate-x-0', 'opacity-100', 'z-10');

    if (icon) icon.classList.replace('fa-arrow-right', 'fa-arrow-left');
  } else {
    stats.classList.remove('translate-x-0', 'opacity-100', 'z-10');
    stats.classList.add('translate-x-full', 'opacity-0', 'z-0');

    basic.classList.remove('-translate-x-full', 'opacity-0', 'z-0');
    basic.classList.add('translate-x-0', 'opacity-100', 'z-10');

    if (icon) icon.classList.replace('fa-arrow-left', 'fa-arrow-right');
  }
};
