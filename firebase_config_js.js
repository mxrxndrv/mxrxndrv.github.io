// Configuration Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAvajbCbTZ6826H0yIuz7S6MvvQ7sCec_M",
    authDomain: "mxrxndrv-discu.firebaseapp.com",
    projectId: "mxrxndrv-discu",
    storageBucket: "mxrxndrv-discu.firebasestorage.app",
    messagingSenderId: "904395586988",
    appId: "1:904395586988:web:d790c830a7dc7feb3ace09",
    measurementId: "G-0GCH72QW09"
};

// Initialiser Firebase
firebase.initializeApp(firebaseConfig);

// Initialiser Firestore
const db = firebase.firestore();

// Collections
const platsCollection = db.collection('plats');
const menusCollection = db.collection('menus');
const settingsCollection = db.collection('settings');

// Export pour utilisation dans d'autres fichiers
window.firebaseDb = {
    db,
    platsCollection,
    menusCollection,
    settingsCollection
};