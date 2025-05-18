from flask import Flask, render_template, request, redirect, url_for, flash, session
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, date
import os

# Configuration de l'application
app = Flask(__name__)
app.config.from_pyfile('config.py')

# Configuration de la base de données
db_path = os.path.join(os.path.dirname(__file__), 'instance', 'cantine.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Modèles de données
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    comments = db.relationship('Comment', backref='author', lazy=True)
    suggestions = db.relationship('Suggestion', backref='author', lazy=True)

class Menu(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False, unique=True)
    entree = db.Column(db.String(100), nullable=False)
    plat_principal = db.Column(db.String(100), nullable=False)
    dessert = db.Column(db.String(100), nullable=False)
    comments = db.relationship('Comment', backref='menu', lazy=True)

class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    date_posted = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    menu_id = db.Column(db.Integer, db.ForeignKey('menu.id'), nullable=False)

class Suggestion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    date_posted = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

# Création des tables
with app.app_context():
    db.create_all()

# Routes
@app.route('/')
def index():
    today = date.today()
    menu_du_jour = Menu.query.filter_by(date=today).first()
    
    # Récupérer les 5 derniers menus à venir
    menus_futurs = Menu.query.filter(Menu.date >= today)\
                            .order_by(Menu.date.asc())\
                            .limit(5)\
                            .all()
    
    return render_template('index.html', 
                         menu_du_jour=menu_du_jour,
                         menus_futurs=menus_futurs)

@app.route('/menu/<int:menu_id>', methods=['GET', 'POST'])
def menu_detail(menu_id):
    menu = Menu.query.get_or_404(menu_id)
    
    if request.method == 'POST':
        if 'user_id' not in session:
            flash('Vous devez être connecté pour poster un commentaire', 'danger')
            return redirect(url_for('login'))
        
        content = request.form.get('comment')
        if content:
            new_comment = Comment(content=content, 
                                user_id=session['user_id'],
                                menu_id=menu.id)
            db.session.add(new_comment)
            db.session.commit()
            flash('Votre commentaire a été ajouté!', 'success')
            return redirect(url_for('menu_detail', menu_id=menu.id))
    
    comments = Comment.query.filter_by(menu_id=menu.id)\
                           .order_by(Comment.date_posted.desc())\
                           .all()
    
    return render_template('menu.html', menu=menu, comments=comments)

@app.route('/suggestions', methods=['GET', 'POST'])
def suggestions():
    if request.method == 'POST':
        if 'user_id' not in session:
            flash('Vous devez être connecté pour faire une suggestion', 'danger')
            return redirect(url_for('login'))
        
        content = request.form.get('suggestion')
        if content:
            new_suggestion = Suggestion(content=content, 
                                      user_id=session['user_id'])
            db.session.add(new_suggestion)
            db.session.commit()
            flash('Merci pour votre suggestion!', 'success')
            return redirect(url_for('suggestions'))
    
    suggestions = Suggestion.query.order_by(Suggestion.date_posted.desc()).all()
    return render_template('suggestions.html', suggestions=suggestions)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        user = User.query.filter_by(username=username).first()
        
        if user and check_password_hash(user.password, password):
            session['user_id'] = user.id
            session['username'] = user.username
            session['is_admin'] = user.is_admin
            flash('Connexion réussie!', 'success')
            
            if user.is_admin:
                return redirect(url_for('admin'))
            return redirect(url_for('index'))
        else:
            flash('Identifiants incorrects', 'danger')
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    flash('Vous avez été déconnecté', 'info')
    return redirect(url_for('index'))

@app.route('/admin')
def admin():
    if 'is_admin' not in session or not session['is_admin']:
        flash('Accès réservé aux administrateurs', 'danger')
        return redirect(url_for('index'))
    
    today = date.today()
    menus = Menu.query.filter(Menu.date >= today)\
                     .order_by(Menu.date.asc())\
                     .all()
    
    suggestions = Suggestion.query.order_by(Suggestion.date_posted.desc()).all()
    comments = Comment.query.order_by(Comment.date_posted.desc()).all()
    
    return render_template('admin.html', 
                         menus=menus,
                         suggestions=suggestions,
                         comments=comments)

@app.route('/admin/add_menu', methods=['POST'])
def add_menu():
    if 'is_admin' not in session or not session['is_admin']:
        flash('Accès réservé aux administrateurs', 'danger')
        return redirect(url_for('index'))
    
    date_str = request.form.get('date')
    entree = request.form.get('entree')
    plat_principal = request.form.get('plat_principal')
    dessert = request.form.get('dessert')
    
    try:
        menu_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        flash('Date invalide', 'danger')
        return redirect(url_for('admin'))
    
    if Menu.query.filter_by(date=menu_date).first():
        flash('Un menu existe déjà pour cette date', 'danger')
        return redirect(url_for('admin'))
    
    new_menu = Menu(date=menu_date,
                   entree=entree,
                   plat_principal=plat_principal,
                   dessert=dessert)
    db.session.add(new_menu)
    db.session.commit()
    
    flash('Menu ajouté avec succès', 'success')
    return redirect(url_for('admin'))

@app.route('/admin/delete_menu/<int:menu_id>')
def delete_menu(menu_id):
    if 'is_admin' not in session or not session['is_admin']:
        flash('Accès réservé aux administrateurs', 'danger')
        return redirect(url_for('index'))
    
    menu = Menu.query.get_or_404(menu_id)
    db.session.delete(menu)
    db.session.commit()
    
    flash('Menu supprimé avec succès', 'success')
    return redirect(url_for('admin'))

@app.route('/admin/delete_comment/<int:comment_id>')
def delete_comment(comment_id):
    if 'is_admin' not in session or not session['is_admin']:
        flash('Accès réservé aux administrateurs', 'danger')
        return redirect(url_for('index'))
    
    comment = Comment.query.get_or_404(comment_id)
    db.session.delete(comment)
    db.session.commit()
    
    flash('Commentaire supprimé', 'success')
    return redirect(url_for('admin'))

@app.route('/admin/delete_suggestion/<int:suggestion_id>')
def delete_suggestion(suggestion_id):
    if 'is_admin' not in session or not session['is_admin']:
        flash('Accès réservé aux administrateurs', 'danger')
        return redirect(url_for('index'))
    
    suggestion = Suggestion.query.get_or_404(suggestion_id)
    db.session.delete(suggestion)
    db.session.commit()
    
    flash('Suggestion supprimée', 'success')
    return redirect(url_for('admin'))

if __name__ == '__main__':
    app.run(debug=True)

@app.route('/')
def index():
    today = date.today()
    menu_du_jour = Menu.query.filter_by(date=today).first()
    menus_futurs = Menu.query.filter(Menu.date > today).order_by(Menu.date.asc()).limit(5).all()
    return render_template('index.html', menu_du_jour=menu_du_jour, menus_futurs=menus_futurs)

@app.route('/api/menus')
def api_menus():
    menus = Menu.query.all()
    menus_data = []
    
    for menu in menus:
        menus_data.append({
            'date': menu.date.strftime('%Y-%m-%d'),
            'entree': menu.entree,
            'plat_principal': menu.plat_principal,
            'dessert': menu.dessert
        })
    
    return jsonify(menus_data)