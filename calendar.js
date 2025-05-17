document.addEventListener('DOMContentLoaded', function() {
    const calendar = document.getElementById('menu-calendar');
    const currentMonthEl = document.getElementById('current-month');
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');
    const menuDetails = document.getElementById('menu-details');
    const selectedDateEl = document.getElementById('selected-date');
    const menuContent = document.getElementById('menu-content');
    
    let currentDate = new Date();
    let menus = []; // Cette variable sera remplie via une requête AJAX
    
    // Récupérer les menus depuis le serveur
    fetch('/api/menus')
        .then(response => response.json())
        .then(data => {
            menus = data;
            renderCalendar();
        });
    
    // Rendre le calendrier
    function renderCalendar() {
        calendar.innerHTML = '';
        
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        currentMonthEl.textContent = new Date(year, month).toLocaleDateString('fr-FR', { 
            month: 'long', 
            year: 'numeric' 
        });
        
        // Ajouter les en-têtes des jours
        const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        days.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-header-day';
            dayHeader.textContent = day;
            calendar.appendChild(dayHeader);
        });
        
        // Premier jour du mois
        const firstDay = new Date(year, month, 1).getDay();
        
        // Nombre de jours dans le mois
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Ajouter les cases vides pour les jours précédents
        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            calendar.appendChild(emptyDay);
        }
        
        // Ajouter les jours du mois
        for (let day = 1; day <= daysInMonth; day++) {
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day';
            dayEl.textContent = day;
            
            const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            
            // Vérifier s'il y a un menu pour ce jour
            const hasMenu = menus.some(menu => menu.date === dateStr);
            if (hasMenu) {
                dayEl.classList.add('has-menu');
            }
            
            dayEl.addEventListener('click', () => showMenuDetails(dateStr));
            calendar.appendChild(dayEl);
        }
    }
    
    function showMenuDetails(dateStr) {
        const menu = menus.find(m => m.date === dateStr);
        
        if (menu) {
            const date = new Date(menu.date);
            selectedDateEl.textContent = date.toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
            });
            
            menuContent.innerHTML = `
                <div class="menu-card">
                    <p><strong>Entrée:</strong> ${menu.entree}</p>
                    <p><strong>Plat principal:</strong> ${menu.plat_principal}</p>
                    <p><strong>Dessert:</strong> ${menu.dessert}</p>
                </div>
            `;
            
            menuDetails.style.display = 'block';
        }
    }
    
    prevBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    
    nextBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
});