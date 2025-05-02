// 1. Config Firebase
const firebaseConfig = {
  apiKey: "mxrxndrv756",
  authDomain: "mxrxndrv messenger.mimi.com",
  projectId: "mxrxndrv message",
  storageBucket: "mimi.com",
  messagingSenderId: "19215678",
  appId: "1:19215678:mimi:mxr12mi89"
};

// Initialisation Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();
const auth = firebase.auth();

const chatBox = document.getElementById("chat-box");
const chatForm = document.getElementById("chat-form");
const usernameInput = document.getElementById("username");
const messageInput = document.getElementById("message");

// 2. Envoyer un message
chatForm.addEventListener("submit", function(e) {
  e.preventDefault();
  const username = usernameInput.value;
  const message = messageInput.value;
  db.collection("messages").add({ username, message });
  messageInput.value = "";
});

// 3. Afficher les messages
db.collection("messages").orderBy("timestamp").onSnapshot(function(snapshot) {
  chatBox.innerHTML = "";
  snapshot.forEach(function(doc) {
    const data = doc.data();
    const div = document.createElement("div");
    div.textContent = `${data.username} : ${data.message}`;
    chatBox.appendChild(div);
  });
});
