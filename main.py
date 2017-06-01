import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_restless import APIManager


app = Flask(__name__, static_url_path='')

app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:Surfanddestroy1$@localhost:3306/mapper'
#app.config['SQLALCHEMY_DATABASE_URI'] = os.environ['SQLALCHEMY_DATABASE_URI']
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False


db = SQLAlchemy(app)


class Marker(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    lat = db.Column(db.Float, unique=False)
    lng = db.Column(db.Float, unique=False)
    title = db.Column(db.String(1000), unique=False)
    notes = db.Column(db.Text)
    map_id = db.Column(db.Integer, db.ForeignKey('map.id'), nullable=False)

    def __init__(self, lat, lng, title, notes, map_id):
        self.lat = lat
        self.lng = lng
        self.title = title
        self.notes = notes
        self.map_id = map_id

    def __repr__(self):
        return '<marker %r>' % self.title


class Map(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(1000), unique=False)
    notes = db.Column(db.Text)
    markers = db.relationship('Marker', backref='map', lazy='dynamic')

db.drop_all()
db.create_all()

api_manager = APIManager(app, flask_sqlalchemy_db=db)
api_manager.create_api(Marker, methods=['GET', 'POST', 'PUT', 'DELETE'])
api_manager.create_api(Map, methods=['GET', 'POST', 'PUT', 'DELETE'])

@app.errorhandler(404)
def page_not_found(e):
    return app.send_static_file('404.html');

@app.route('/index', methods=['GET'])
@app.route('/', methods=['GET'])
def index():
    return app.send_static_file('Index.html')


if __name__ == "__main__":
    app.run(debug=True)
