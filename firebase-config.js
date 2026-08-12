// Import the functions you need from the SDKs you need
// IMPORTANT: como este arquivo é carregado direto no navegador (sem bundler,
// via <script type="module">), TODAS as importações precisam vir da CDN do
// gstatic. Especificadores "nus" (ex: "firebase/app") só funcionam com um
// bundler (Vite, Webpack etc.) e quebram o site em produção.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAtmaLD5d_2px1YJ251V_pDOBuJk0O2yOg",
  authDomain: "almatie.firebaseapp.com",
  projectId: "almatie",
  storageBucket: "almatie.firebasestorage.app",
  messagingSenderId: "1011119969194",
  appId: "1:1011119969194:web:251c0e8351ffa4875e11d3",
  measurementId: "G-5F0XQ3Z0PV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Observação: removi o getAnalytics() daqui. Analytics precisa rodar em um
// contexto https real (não funciona em file:// nem sempre em localhost) e
// não é usado em nenhuma outra parte do site. Se quiser reativar, importe
// "firebase-analytics.js" da mesma CDN acima e chame getAnalytics(app).
