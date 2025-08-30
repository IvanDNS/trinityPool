import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-analytics.js";
import { getDatabase, ref, push, onValue, remove } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";
import { set } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";



const firebaseConfig = {
  apiKey: "AIzaSyCvAkjnBWvfNnDyzistVBFP2mZcymrRRQo",
  authDomain: "trinity-pool.firebaseapp.com",
  databaseURL: "https://trinity-pool-default-rtdb.firebaseio.com",
  projectId: "trinity-pool",
  storageBucket: "trinity-pool.appspot.com",
  messagingSenderId: "808109751915",
  appId: "1:808109751915:web:19dea37524c488b15dbb2e",
  measurementId: "G-VKMELEK8QH"
};

const app = initializeApp(firebaseConfig);
getAnalytics(app);

const db = getDatabase(app);
const partidasRef = ref(db, "partidas");
const estadisticasRef = ref(db, "estadisticas");

//Calcular estadisticas
function calcularEstadisticas(data) {
  const stats = {};

  // Recorremos todas las partidas
  Object.values(data).forEach((partida) => {
    const jugadores = [partida.jugador1, partida.jugador2, partida.jugador3].filter(Boolean);

    jugadores.forEach(jugador => {
      if (!stats[jugador]) {
        stats[jugador] = { jugadas: 0, victorias: 0, derrotas: 0 };
      }
      stats[jugador].jugadas++;
    });

    if (partida.ganador) {
      if (!stats[partida.ganador]) {
        stats[partida.ganador] = { jugadas: 0, victorias: 0, derrotas: 0 };
      }
      stats[partida.ganador].victorias++;
    }

    // Derrotas = partidas jugadas - victorias
    Object.keys(stats).forEach(jugador => {
      stats[jugador].derrotas = stats[jugador].jugadas - stats[jugador].victorias;
    });
  });

  // Calcular winrate y guardar
  const statsConWinrate = {};
  Object.entries(stats).forEach(([jugador, s]) => {
    statsConWinrate[jugador] = {
      partidas_jugadas: s.jugadas,
      victorias: s.victorias,
      derrotas: s.derrotas,
      winrate: s.jugadas > 0 ? ((s.victorias / s.jugadas) * 100).toFixed(1) + "%" : "0%"
    };
  });

  return statsConWinrate;
}


// Mostrar partidas con botón eliminar
onValue(partidasRef, (snapshot) => {
  const data = snapshot.val();
  const tbody = document.getElementById("tablaPartidas");
  tbody.innerHTML = "";

  if (data) {
    Object.entries(data).forEach(([key, row]) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="border px-4 py-2">${row.fecha}</td>
        <td class="border px-4 py-2">${row.jugador1 ?? ""}</td>
        <td class="border px-4 py-2">${row.jugador2 ?? ""}</td>
        <td class="border px-4 py-2">${row.jugador3 ?? ""}</td>
        <td class="border px-4 py-2 font-bold">${row.ganador}</td>
        <td class="border px-4 py-2">
          <button class="bg-red-500 text-white px-2 py-1 rounded" onclick="eliminarPartida('${key}')">🗑️</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }
  const estadisticas = calcularEstadisticas(data);
  ref(db, "estadisticas"); // Referencia ya creada arriba

// Guardar estadísticas en Firebase

set(estadisticasRef, estadisticas);

});

// Agregar partida
window.agregarPartida = () => {
  const checkboxes = document.querySelectorAll('input[name="jugador"]:checked');
  const jugadoresSeleccionados = Array.from(checkboxes).map(cb => cb.value);

  if (jugadoresSeleccionados.length < 2 || jugadoresSeleccionados.length > 3) {
    alert("Debes seleccionar entre 2 y 3 jugadores.");
    return;
  }

  const ganadorSeleccionado = document.getElementById("ganador").value;
  if (!ganadorSeleccionado || ganadorSeleccionado === "Selecciona un ganador") {
    alert("Debes seleccionar un ganador.");
    return;
  }

  const fechaRaw = document.getElementById("fecha").value; // dd/mm/yyyy
  const [dia, mes, anio] = fechaRaw.split("/");
  const fechaISO = new Date(`${anio}-${mes}-${dia}`).toISOString();

  const timestamp = Date.now();
  const idGenerado = `partida${timestamp}`;
  
  const nuevaPartida = {
    fecha: fechaISO,
    jugador1: jugadoresSeleccionados[0] || null,
    jugador2: jugadoresSeleccionados[1] || null,
    jugador3: jugadoresSeleccionados[2] || null,
    ganador: ganadorSeleccionado
  };

  set(ref(db, `partidas/${idGenerado}`), nuevaPartida);
  document.getElementById("formulario").reset();
  actualizarGanador();
};


// Eliminar partida
window.eliminarPartida = (id) => {
  if (confirm("¿Estás seguro de que quieres eliminar esta partida?")) {
    const partidaRef = ref(db, `partidas/${id}`);
    remove(partidaRef);
    onValue(partidasRef, (snapshot) => {
      const data = snapshot.val() || {};
      const estadisticas = calcularEstadisticas(data);
      set(estadisticasRef, estadisticas);
    });
  }
};

// Actualiza select de ganador
function actualizarGanador() {
  const checkboxes = document.querySelectorAll('input[name="jugador"]:checked');
  const ganadorSelect = document.getElementById("ganador");

  ganadorSelect.innerHTML = '<option disabled selected>Selecciona un ganador</option>';
  checkboxes.forEach(cb => {
    const option = document.createElement("option");
    option.value = cb.value;
    option.textContent = cb.value;
    ganadorSelect.appendChild(option);
  });
}

// Escuchar cambios en checkboxes
window.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('.jugadorCheck').forEach(cb => {
    cb.addEventListener('change', actualizarGanador);
  });
});

// LOGIN

const auth = getAuth(app);

// Función para iniciar sesión
const loginForm = document.getElementById("loginForm");
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      document.getElementById("loginContainer").classList.add("hidden");
      document.getElementById("contenido").classList.remove("hidden");
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      document.getElementById("loginError").textContent = "Error: " + errorMessage;
      document.getElementById("loginError").classList.remove("hidden");
    });
});


onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById("loginContainer").classList.add("hidden");
    document.getElementById("contenido").classList.remove("hidden");
  } else {
    document.getElementById("contenido").classList.add("hidden");
    document.getElementById("loginContainer").classList.remove("hidden");
  }
});

window.cerrarSesion = () => {
  signOut(auth);
};
 