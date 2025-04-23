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
let partidasVisibles = []; // 👈 importante
let estadoOrden = {};

onValue(partidasRef, (snapshot) => {
  const data = snapshot.val();
  partidas = [];

  if (data) {
    partidas = Object.values(data);
    partidasVisibles = [...partidas]; 
  }

  renderizarPartidas(partidas);
});

function renderizarPartidas(lista) {
  const tbody = document.getElementById("tablaPartidas");
  if (!tbody) return;

  tbody.innerHTML = "";
  lista.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="px-4 py-2">${row.fecha}</td>
      <td class="px-4 py-2">${row.jugador1 ?? "-----"}</td>
      <td class="px-4 py-2">${row.jugador2 ?? "-----"}</td>
      <td class="px-4 py-2">${row.jugador3 ?? "-----"}</td>
      <td class="px-4 py-2 font-bold">${row.ganador}</td>
    `;
    tbody.appendChild(tr);
  });
}

//Cambiar Seccion del main
window.mostrarSeccion = (seccion) => {
  const historial = document.getElementById("seccion-historial");
  const estadisticas = document.getElementById("seccion-estadisticas");

  if (!historial || !estadisticas) return;

  if (seccion === "estadisticas") {
    historial.classList.add("hidden");
    estadisticas.classList.remove("hidden");
  } else if (seccion === "historial") {
    estadisticas.classList.add("hidden");
    historial.classList.remove("hidden");
  }

    // Cambiar estilo activo del menú
    document.querySelectorAll('.item-menu').forEach(el => {
      if (el.dataset.seccion === seccion) {
        el.classList.add('bg-cyan-700');
      } else {
        el.classList.remove('bg-cyan-700');
      }
    });

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
// ORDENAR TABLA
// ------------------------------
window.ordenarPor = (campo) => {
  const asc = !estadoOrden[campo];
  estadoOrden[campo] = asc;

  partidasVisibles.sort((a, b) => {
    const valA = (a[campo] || "").toLowerCase?.() || "";
    const valB = (b[campo] || "").toLowerCase?.() || "";

    const esNuloA = !a[campo];
    const esNuloB = !b[campo];

    if (esNuloA && !esNuloB) return asc ? 1 : -1;
    if (!esNuloA && esNuloB) return asc ? -1 : 1;
    if (valA < valB) return asc ? -1 : 1;
    if (valA > valB) return asc ? 1 : -1;
    return 0;
  });

  renderizarPartidas(partidasVisibles);
};

// filtrar ganadores
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
