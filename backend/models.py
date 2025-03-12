from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    lists = db.relationship('TodoList', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<User {self.username}>'

class TodoList(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    items = db.relationship('TodoItem', backref='list', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<TodoList {self.name}>'

class TodoItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.String(200), nullable=False)
    is_complete = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    list_id = db.Column(db.Integer, db.ForeignKey('todo_list.id'), nullable=False)
    parent_id = db.Column(db.Integer, db.ForeignKey('todo_item.id'), nullable=True)
    
    children = db.relationship('TodoItem', backref=db.backref('parent', remote_side=[id]), lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<TodoItem {self.text}>'
