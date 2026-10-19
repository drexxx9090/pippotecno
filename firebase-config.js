// PASO: pegá acá tus datos de Firebase (Configuración del proyecto > Tus apps > Web)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDphwPPAAC0gJzn3oOemYAQvJCh22GRIQ4",
  authDomain: "pippotecno-72936.firebaseapp.com",
  projectId: "pippotecno-72936",
  storageBucket: "pippotecno-72936.firebasestorage.app",
  messagingSenderId: "100588231722",
  appId: "1:100588231722:web:03358dafa2e62a3e4d3753"
};
// La apiKey es pública por diseño: la seguridad real está en firestore.rules
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
