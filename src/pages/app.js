import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-analytics.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";

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

// Mostrar partidas
onValue(partidasRef, (snapshot) => {
  const data = snapshot.val();
  const tbody = document.getElementById("tablaPartidas");
  tbody.innerHTML = "";

  if (data) {
    Object.values(data).forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="border px-4 py-2">${row.fecha}</td>
        <td class="border px-4 py-2">${row.jugador1 ?? ""}</td>
        <td class="border px-4 py-2">${row.jugador2 ?? ""}</td>
        <td class="border px-4 py-2">${row.jugador3 ?? ""}</td>
        <td class="border px-4 py-2 font-bold">${row.ganador}</td>
      `;
      tbody.appendChild(tr);
    });
  }
});

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

  const nuevaPartida = {
    fecha: document.getElementById("fecha").value,
    jugador1: jugadoresSeleccionados[0] || null,
    jugador2: jugadoresSeleccionados[1] || null,
    jugador3: jugadoresSeleccionados[2] || null,
    ganador: ganadorSeleccionado
  };

  push(partidasRef, nuevaPartida);
  document.getElementById("formulario").reset();
  actualizarGanador(); // limpia el select después del reset
};

// 🔁 Actualiza el select de "ganador" según jugadores seleccionados
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

// 🎯 Escuchar cambios en los checkboxes
window.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('.jugadorCheck').forEach(cb => {
    cb.addEventListener('change', actualizarGanador);
  });
});
