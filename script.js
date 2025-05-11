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

// Initialisation Firebase
const app = firebase.initializeApp(firebaseConfig);
const analytics = firebase.analytics();
const db = firebase.firestore();
const auth = firebase.auth();

// Gestion de l'authentification
auth.onAuthStateChanged(user => {
    const authStatus = document.getElementById('authStatus');
    
    if (user) {
        authStatus.innerHTML = `
            <div>Connecté en tant que ${user.email}</div>
            <button onclick="logout()">Déconnexion</button>
        `;
        loadMessages();
    } else {
        authStatus.innerHTML = '<button onclick="login()">Connexion avec Google</button>';
    }
});

// Fonctions d'authentification
function login() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
}

function logout() {
    auth.signOut();
}

// Gestion des messages
function loadMessages() {
    db.collection('messages')
        .orderBy('timestamp', 'desc')
        .onSnapshot(snapshot => {
            const container = document.getElementById('messagesContainer');
            container.innerHTML = '';
            
            snapshot.forEach(doc => {
                const message = doc.data();
                container.innerHTML += `
                    <div class="message">
                        <div>
                            <div class="message-info">
                                ${message.userEmail} - ${new Date(message.timestamp).toLocaleString()}
                            </div>
                            <div>${message.text}</div>
                        </div>
                    </div>
                `;
            });
        });
}

function sendMessage() {
    const user = auth.currentUser;
    const input = document.getElementById('messageInput');
    
    if (user && input.value.trim()) {
        db.collection('messages').add({
            text: input.value,
            userEmail: user.email,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        input.value = '';
        analytics.logEvent('message_sent');

let username = null;

function showUsernameModal() {
    usernameModal.style.display = 'flex';
    usernameInput.focus();
}

function setUsername() {
    const input = usernameInput.value.trim();
    if(input.length >= 3 && input.length <= 20) {
        username = input;
        localStorage.setItem('cafeteriaUsername', username);
        usernameModal.style.display = 'none';
        chatToggle.disabled = false;
        chatToggle.textContent = `💬 ${username}`; // Ajout visuel
    } else {
        alert("Veuillez choisir un pseudo entre 3 et 20 caractères !");
    }
}

// Au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    const savedUsername = localStorage.getItem('cafeteriaUsername');
    if(savedUsername) {
        username = savedUsername;
        chatToggle.disabled = false;
        chatToggle.textContent = `💬 ${username}`;
    } else {
        showUsernameModal();
    }
});
  
