from flask import Flask, request, jsonify, session
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User, TodoList, TodoItem
from functools import wraps
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev_key_for_development')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///todo.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SESSION_COOKIE_SECURE'] = True  # Ensure cookies are only sent over HTTPS
app.config['SESSION_COOKIE_HTTPONLY'] = True  # Prevent JavaScript access to session cookie
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'  # Protect against CSRF

CORS(app, supports_credentials=True)
db.init_app(app)

with app.app_context():
    db.create_all()

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'message': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'message': 'Username and password are required'}), 400
    
    if User.query.filter_by(username=username).first():
        return jsonify({'message': 'Username already exists'}), 400
    
    user = User(username=username, password=generate_password_hash(password))
    db.session.add(user)
    db.session.commit()
    
    session['user_id'] = user.id
    
    return jsonify({
        'message': 'User registered successfully',
        'user': {'id': user.id, 'username': user.username}
    }), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    user = User.query.filter_by(username=username).first()
    
    if not user or not check_password_hash(user.password, password):
        return jsonify({'message': 'Invalid username or password'}), 401
    
    session['user_id'] = user.id
    
    return jsonify({
        'message': 'Login successful',
        'user': {'id': user.id, 'username': user.username}
    }), 200

@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    return jsonify({'message': 'Logout successful'}), 200

@app.route('/api/check-auth', methods=['GET'])
def check_auth():
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'authenticated': False}), 401
    
    user = User.query.get(user_id)
    
    if not user:
        session.pop('user_id', None)
        return jsonify({'authenticated': False}), 401
    
    return jsonify({
        'authenticated': True,
        'user': {'id': user.id, 'username': user.username}
    }), 200

# Apply login_required decorator to all routes that require authentication
@app.route('/api/lists', methods=['GET'])
@login_required
def get_lists():
    user_id = session.get('user_id')
    lists = TodoList.query.filter_by(user_id=user_id).all()
    
    return jsonify({
        'lists': [{'id': lst.id, 'name': lst.name} for lst in lists]
    }), 200

@app.route('/api/lists', methods=['POST'])
@login_required
def create_list():
    user_id = session.get('user_id')
    data = request.get_json()
    name = data.get('name')
    
    if not name:
        return jsonify({'message': 'List name is required'}), 400
    
    todo_list = TodoList(name=name, user_id=user_id)
    db.session.add(todo_list)
    db.session.commit()
    
    return jsonify({
        'message': 'List created successfully',
        'list': {'id': todo_list.id, 'name': todo_list.name}
    }), 201

# Apply login_required to all other routes...
@app.route('/api/lists/<int:list_id>', methods=['DELETE'])
@login_required
def delete_list(list_id):
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'message': 'Unauthorized'}), 401
    
    todo_list = TodoList.query.filter_by(id=list_id, user_id=user_id).first()
    
    if not todo_list:
        return jsonify({'message': 'List not found'}), 404
    
    # Delete all items in the list
    TodoItem.query.filter_by(list_id=list_id).delete()
    
    db.session.delete(todo_list)
    db.session.commit()
    
    return jsonify({'message': 'List deleted successfully'}), 200

@app.route('/api/lists/<int:list_id>/items', methods=['GET'])
@login_required
def get_items(list_id):
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'message': 'Unauthorized'}), 401
    
    todo_list = TodoList.query.filter_by(id=list_id, user_id=user_id).first()
    
    if not todo_list:
        return jsonify({'message': 'List not found'}), 404
    
    # Get all top-level items (no parent)
    items = TodoItem.query.filter_by(list_id=list_id, parent_id=None).all()
    
    # Function to recursively build item hierarchy
    def build_item_tree(item):
        children = TodoItem.query.filter_by(parent_id=item.id).all()
        return {
            'id': item.id,
            'text': item.text,
            'is_complete': item.is_complete,
            'children': [build_item_tree(child) for child in children]
        }
    
    return jsonify({
        'items': [build_item_tree(item) for item in items]
    }), 200

@app.route('/api/lists/<int:list_id>/items', methods=['POST'])
@login_required
def create_item(list_id):
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'message': 'Unauthorized'}), 401
    
    todo_list = TodoList.query.filter_by(id=list_id, user_id=user_id).first()
    
    if not todo_list:
        return jsonify({'message': 'List not found'}), 404
    
    data = request.get_json()
    text = data.get('text')
    parent_id = data.get('parent_id')
    
    if not text:
        return jsonify({'message': 'Item text is required'}), 400
    
    # If parent_id is provided, verify it exists and belongs to the same list
    if parent_id:
        parent = TodoItem.query.filter_by(id=parent_id, list_id=list_id).first()
        if not parent:
            return jsonify({'message': 'Parent item not found'}), 404
    
    item = TodoItem(text=text, list_id=list_id, parent_id=parent_id)
    db.session.add(item)
    db.session.commit()
    
    return jsonify({
        'message': 'Item created successfully',
        'item': {
            'id': item.id,
            'text': item.text,
            'is_complete': item.is_complete,
            'children': []
        }
    }), 201

@app.route('/api/items/<int:item_id>', methods=['PATCH'])
@login_required
def update_item(item_id):
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'message': 'Unauthorized'}), 401
    
    item = TodoItem.query.join(TodoList).filter(
        TodoItem.id == item_id,
        TodoList.user_id == user_id
    ).first()
    
    if not item:
        return jsonify({'message': 'Item not found'}), 404
    
    data = request.get_json()
    
    if 'text' in data:
        item.text = data['text']
    
    if 'is_complete' in data:
        new_status = data['is_complete']
        update_item_and_children(item, new_status)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Item updated successfully',
        'item': {
            'id': item.id,
            'text': item.text,
            'is_complete': item.is_complete
        }
    }), 200

def update_item_and_children(item, is_complete):
    item.is_complete = is_complete
    for child in item.children:
        update_item_and_children(child, is_complete)

@app.route('/api/items/<int:item_id>', methods=['DELETE'])
@login_required
def delete_item(item_id):
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'message': 'Unauthorized'}), 401
    
    item = TodoItem.query.join(TodoList).filter(
        TodoItem.id == item_id,
        TodoList.user_id == user_id
    ).first()
    
    if not item:
        return jsonify({'message': 'Item not found'}), 404
    
    # Function to recursively delete an item and all its children
    def delete_item_tree(item_id):
        children = TodoItem.query.filter_by(parent_id=item_id).all()
        for child in children:
            delete_item_tree(child.id)
        
        TodoItem.query.filter_by(id=item_id).delete()
    
    delete_item_tree(item_id)
    db.session.commit()
    
    return jsonify({'message': 'Item deleted successfully'}), 200

@app.route('/api/items/<int:item_id>/move', methods=['POST'])
@login_required
def move_item(item_id):
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'message': 'Unauthorized'}), 401
    
    data = request.get_json()
    target_list_id = data.get('target_list_id')
    
    if not target_list_id:
        return jsonify({'message': 'Target list ID is required'}), 400
    
    # Verify the item exists and belongs to the user
    item = TodoItem.query.join(TodoList).filter(
        TodoItem.id == item_id,
        TodoList.user_id == user_id
    ).first()
    
    if not item:
        return jsonify({'message': 'Item not found'}), 404
    
    # Verify the target list exists and belongs to the user
    target_list = TodoList.query.filter_by(id=target_list_id, user_id=user_id).first()
    
    if not target_list:
        return jsonify({'message': 'Target list not found'}), 404
    
    # Only allow moving top-level items (no parent)
    if item.parent_id is not None:
        return jsonify({'message': 'Only top-level items can be moved between lists'}), 400
    
    # Move the item to the target list
    item.list_id = target_list_id
    db.session.commit()
    
    return jsonify({'message': 'Item moved successfully'}), 200

if __name__ == '__main__':
    app.run(debug=True)

