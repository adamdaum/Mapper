import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Column, Integer, Text, String, Numeric, Float
from flask_restless import APIManager


app = Flask(__name__, static_url_path='')

app.config['SQLALCHEMY_DATABASE_URI'] = os.environ['SQLALCHEMY_DATABASE_URI']
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

#app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:Surfanddestroy1$@localhost:3306/mapper'

db = SQLAlchemy(app)

class Marker(db.Model):
    id = Column(Integer, primary_key=True)
    lat = Column(Float, unique=False)
    lng = Column(Float, unique=False)
    title = Column(Text, unique=False)
    description = Column(String(1000))

db.create_all()

api_manager = APIManager(app, flask_sqlalchemy_db=db)
api_manager.create_api(Marker, methods=['GET', 'POST', 'PUT', 'DELETE'])

@app.errorhandler(404)
def page_not_found(e):
    return app.send_static_file('404.html');

@app.route('/', methods=['GET'])
def index():
    return app.send_static_file('Index.html')

app.debug = True

if __name__ == "__main__":
    app.run()
