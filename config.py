import os

# Clé secrète pour les sessions
SECRET_KEY = 'votre_cle_secrete_ici'

# Configuration de la base de données
basedir = os.path.abspath(os.path.dirname(__file__))
SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, 'instance', 'cantine.db')