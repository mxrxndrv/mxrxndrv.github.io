// Variables globales
let currentPlats = [];
let currentMenus = [];
let currentWeek = new Date();

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadInitialData();
});

// Initialiser l'application
function initializeApp() {
    // Afficher la section dashboard par défaut
    showSection('dashboard');
    
    // Initialiser le calendrier
    generateCalendarWeek();
    
    // Charger les paramètres
    loadSettings();
}

// Configuration des écouteurs d'événements
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('href').substring(1);
            showSection(section);
            
            // Mettre à jour la navigation active
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Formulaire ajout de plat
    document.getElementById('plat-form').addEventListener('submit', handlePlatSubmit);
    
    // Formulaire ajout de menu
    document.getElementById('menu-form').addEventListener('submit', handleMenuSubmit);
    
    // Formulaire paramètres
    document.getElementById('settings-form').addEventListener('submit', handleSettingsSubmit);
    
    // Fermeture des modales au clic extérieur
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
}

// Charger les données initiales
async function loadInitialData() {
    try {
        await Promise.all([
            loadPlats(),
            loadMenus(),
            updateDashboardStats()
        ]);
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        showAlert('Erreur lors du chargement des données', 'error');
    }
}

// === GESTION DES SECTIONS ===
function showSection(sectionId) {
    // Masquer toutes les sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Afficher la section demandée
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Actions spécifiques par section
        switch(sectionId) {
            case 'plats':
                displayPlats();
                break;
            case 'menus':
                generateCalendarWeek();
                displayMenus();
                break;
            case 'dashboard':
                updateDashboardStats();
                break;
        }
    }
}

// === GESTION DES PLATS ===
async function loadPlats() {
    try {
        const snapshot = await window.firebaseDb.platsCollection.get();
        currentPlats = [];
        
        snapshot.forEach(doc => {
            currentPlats.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        displayPlats();
        populatePlatSelects();
        
    } catch (error) {
        console.error('Erreur lors du chargement des plats:', error);
        showAlert('Erreur lors du chargement des plats', 'error');
    }
}

function displayPlats() {
    const container = document.getElementById('plats-container');
    if (!container) return;
    
    if (currentPlats.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-utensils" style="font-size: 3rem; color: var(--gray-300); margin-bottom: 1rem;"></i>
                <h3>Aucun plat disponible</h3>
                <p>Commencez par ajouter votre premier plat !</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = currentPlats.map(plat => `
        <div class="plat-card">
            <div class="plat-header">
                <h3 class="plat-title">${plat.nom}</h3>
                <span class="plat-category">${getCategoryLabel(plat.categorie)}</span>
            </div>
            ${plat.description ? `<p class="plat-description">${plat.description}</p>` : ''}
            <div class="plat-details">
                ${plat.prix ? `<span class="plat-price">${plat.prix.toFixed(2)} €</span>` : ''}
                <div class="plat-tags">
                    ${plat.vegetarien ? '<span class="tag vegetarian"><i class="fas fa-leaf"></i> Végétarien</span>' : ''}
                    ${plat.allergenes ? `<span class="tag">${plat.allergenes}</span>` : ''}
                </div>
            </div>
            <div class="plat-actions">
                <button class="btn btn-secondary" onclick="editPlat('${plat.id}')">
                    <i class="fas fa-edit"></i> Modifier
                </button>
                <button class="btn btn-danger" onclick="deletePlat('${plat.id}')">
                    <i class="fas fa-trash"></i> Supprimer
                </button>
            </div>
        </div>
    `).join('');
}

async function handlePlatSubmit(e) {
    e.preventDefault();
    
    const formData = {
        nom: document.getElementById('plat-nom').value.trim(),
        description: document.getElementById('plat-description').value.trim(),
        categorie: document.getElementById('plat-categorie').value,
        prix: parseFloat(document.getElementById('plat-prix').value) || 0,
        allergenes: document.getElementById('plat-allergenes').value.trim(),
        vegetarien: document.getElementById('plat-vegetarien').checked,
        dateCreation: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        await window.firebaseDb.platsCollection.add(formData);
        
        closeModal('platModal');
        document.getElementById('plat-form').reset();
        showAlert('Plat ajouté avec succès !', 'success');
        
        await loadPlats();
        updateDashboardStats();
        
    } catch (error) {
        console.error('Erreur lors de l\'ajout du plat:', error);
        showAlert('Erreur lors de l\'ajout du plat', 'error');
    }
}

async function deletePlat(platId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce plat ?')) {
        return;
    }
    
    try {
        await window.firebaseDb.platsCollection.doc(platId).delete();
        showAlert('Plat supprimé avec succès !', 'success');
        
        await loadPlats();
        updateDashboardStats();
        
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        showAlert('Erreur lors de la suppression', 'error');
    }
}

function searchPlats() {
    const searchTerm = document.getElementById('search-plats').value.toLowerCase();
    const filteredPlats = currentPlats.filter(plat => 
        plat.nom.toLowerCase().includes(searchTerm) ||
        plat.description.toLowerCase().includes(searchTerm) ||
        plat.categorie.toLowerCase().includes(searchTerm)
    );
    
    displayFilteredPlats(filteredPlats);
}

function displayFilteredPlats(plats) {
    const container = document.getElementById('plats-container');
    if (!container) return;
    
    container.innerHTML = plats.map(plat => `
        <div class="plat-card">
            <div class="plat-header">
                <h3 class="plat-title">${plat.nom}</h3>
                <span class="plat-category">${getCategoryLabel(plat.categorie)}</span>
            </div>
            ${plat.description ? `<p class="plat-description">${plat.description}</p>` : ''}
            <div class="plat-details">
                ${plat.prix ? `<span class="plat-price">${plat.prix.toFixed(2)} €</span>` : ''}
                <div class="plat-tags">
                    ${plat.vegetarien ? '<span class="tag vegetarian"><i class="fas fa-leaf"></i> Végétarien</span>' : ''}
                    ${plat.allergenes ? `<span class="tag">${plat.allergenes}</span>` : ''}
                </div>
            </div>
            <div class="plat-actions">
                <button class="btn btn-secondary" onclick="editPlat('${plat.id}')">
                    <i class="fas fa-edit"></i> Modifier
                </button>
                <button class="btn btn-danger" onclick="deletePlat('${plat.id}')">
                    <i class="fas fa-trash"></i> Supprimer
                </button>
            </div>
        </div>
    `).join('');
}

// === GESTION DES MENUS ===
async function loadMenus() {
    try {
        const snapshot = await window.firebaseDb.menusCollection.get();
        currentMenus = [];
        
        snapshot.forEach(doc => {
            currentMenus.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        displayMenus();
        
    } catch (error) {
        console.error('Erreur lors du chargement des menus:', error);
        showAlert('Erreur lors du chargement des menus', 'error');
    }
}

async function handleMenuSubmit(e) {
    e.preventDefault();
    
    const formData = {
        date: document.getElementById('menu-date').value,
        repas: document.getElementById('menu-repas').value,
        entree: document.getElementById('menu-entree').value || null,
        platPrincipal: document.getElementById('menu-plat-principal').value,
        accompagnement: document.getElementById('menu-accompagnement').value || null,
        dessert: document.getElementById('menu-dessert').value || null,
        dateCreation: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        await window.firebaseDb.menusCollection.add(formData);
        
        closeModal('menuModal');
        document.getElementById('menu-form').reset();
        showAlert('Menu créé avec succès !', 'success');
        
        await loadMenus();
        updateDashboardStats();
        
    } catch (error) {
        console.error('Erreur lors de la création du menu:', error);
        showAlert('Erreur lors de la création du menu', 'error');
    }
}

function displayMenus() {
    generateCalendarWeek();
}

// === GESTION DU CALENDRIER ===
function generateCalendarWeek() {
    const container = document.getElementById('calendar-container');
    if (!container) return;
    
    const startOfWeek = getStartOfWeek(currentWeek);
    const weekHeader = document.getElementById('current-week');
    
    if (weekHeader) {
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        weekHeader.textContent = `Semaine du ${formatDate(startOfWeek)} au ${formatDate(endOfWeek)}`;
    }
    
    const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    
    container.innerHTML = daysOfWeek.map((day, index) => {
        const currentDate = new Date(startOfWeek);
        currentDate.setDate(startOfWeek.getDate() + index);
        
        const dayMenus = getMenusForDate(currentDate);
        
        return `
            <div class="calendar-day">
                <div class="day-header">${day}</div>
                <div class="day-number">${currentDate.getDate()}</div>
                <div class="menu-items">
                    ${dayMenus.map(menu => `
                        <div class="menu-item" onclick="showMenuDetails('${menu.id}')">
                            ${getRepasLabel(menu.repas)}: ${getPlatName(menu.platPrincipal)}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
}

function getMenusForDate(date) {
    const dateString = formatDateForComparison(date);
    return currentMenus.filter(menu => menu.date === dateString);
}

function previousWeek() {
    currentWeek.setDate(currentWeek.getDate() - 7);
    generateCalendarWeek();
}

function nextWeek() {
    currentWeek.setDate(currentWeek.getDate() + 7);
    generateCalendarWeek();
}

// === GESTION DES MODALES ===
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        
        // Préparer les données selon le modal
        if (modalId === 'menuModal') {
            populatePlatSelects();
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// === GESTION DES PARAMÈTRES ===
async function loadSettings() {
    try {
        const doc = await window.firebaseDb.settingsCollection.doc('general').get();
        if (doc.exists) {
            const settings = doc.data();
            document.getElementById('school-name').value = settings.schoolName || '';
            document.getElementById('school-address').value = settings.schoolAddress || '';
        }
    } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error);
    }
}

async function handleSettingsSubmit(e) {
    e.preventDefault();
    
    const settingsData = {
        schoolName: document.getElementById('school-name').value.trim(),
        schoolAddress: document.getElementById('school-address').value.trim(),
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        await window.firebaseDb.settingsCollection.doc('general').set(settingsData);
        showAlert('Paramètres sauvegardés avec succès !', 'success');
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        showAlert('Erreur lors de la sauvegarde des paramètres', 'error');
    }
}

// === TABLEAU DE BORD ===
async function updateDashboardStats() {
    try {
        // Nombre total de plats
        document.getElementById('total-plats').textContent = currentPlats.length;
        
        // Nombre total de menus
        document.getElementById('total-menus').textContent = currentMenus.length;
        
        // Plat le plus populaire (basé sur la fréquence dans les menus)
        const platPopulaire = getMostPopularPlat();
        document.getElementById('plat-populaire').textContent = platPopulaire || 'Aucun';
        
    } catch (error) {
        console.error('Erreur lors de la mise à jour des statistiques:', error);
    }
}

function getMostPopularPlat() {
    if (currentMenus.length === 0) return 'Aucun';
    
    const platCount = {};
    currentMenus.forEach(menu => {
        if (menu.platPrincipal) {
            platCount[menu.platPrincipal] = (platCount[menu.platPrincipal] || 0) + 1;
        }
    });
    
    const mostPopularPlatId = Object.keys(platCount).reduce((a, b) => 
        platCount[a] > platCount[b] ? a : b
    );
    
    return getPlatName(mostPopularPlatId);
}

// === FONCTIONS UTILITAIRES ===
function populatePlatSelects() {
    const selects = ['menu-entree', 'menu-plat-principal', 'menu-accompagnement', 'menu-dessert'];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        // Garder la première option (vide ou "Aucun")
        const firstOption = select.firstElementChild;
        select.innerHTML = '';
        select.appendChild(firstOption);
        
        // Filtrer les plats selon la catégorie
        let filteredPlats = currentPlats;
        if (selectId === 'menu-entree') {
            filteredPlats = currentPlats.filter(plat => plat.categorie === 'entree');
        } else if (selectId === 'menu-plat-principal') {
            filteredPlats = currentPlats.filter(plat => plat.categorie === 'plat-principal');
        } else if (selectId === 'menu-accompagnement') {
            filteredPlats = currentPlats.filter(plat => plat.categorie === 'accompagnement');
        } else if (selectId === 'menu-dessert') {
            filteredPlats = currentPlats.filter(plat => plat.categorie === 'dessert');
        }
        
        // Ajouter les options
        filteredPlats.forEach(plat => {
            const option = document.createElement('option');
            option.value = plat.id;
            option.textContent = plat.nom;
            select.appendChild(option);
        });
    });
}

function getCategoryLabel(category) {
    const labels = {
        'entree': 'Entrée',
        'plat-principal': 'Plat Principal',
        'accompagnement': 'Accompagnement',
        'dessert': 'Dessert',
        'boisson': 'Boisson'
    };
    return labels[category] || category;
}

function getRepasLabel(repas) {
    const labels = {
        'petit-dejeuner': 'Petit-déjeuner',
        'dejeuner': 'Déjeuner',
        'gouter': 'Goûter',
        'diner': 'Dîner'
    };
    return labels[repas] || repas;
}

function getPlatName(platId) {
    if (!platId) return '';
    const plat = currentPlats.find(p => p.id === platId);
    return plat ? plat.nom : 'Plat inconnu';
}

function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lundi comme premier jour
    return new Date(d.setDate(diff));
}

function formatDate(date) {
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function formatDateForComparison(date) {
    return date.toISOString().split('T')[0];
}

function showAlert(message, type = 'success') {
    // Créer l'alerte
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i>
        ${message}
    `;
    
    // Ajouter au début du contenu principal
    const mainContent = document.querySelector('.main-content');
    mainContent.insertBefore(alert, mainContent.firstChild);
    
    // Supprimer après 5 secondes
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Fonctions appelées par les boutons HTML
window.showSection = showSection;
window.openModal = openModal;
window.closeModal = closeModal;
window.deletePlat = deletePlat;
window.searchPlats = searchPlats;
window.previousWeek = previousWeek;
window.nextWeek = nextWeek;