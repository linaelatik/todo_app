from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
import os
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///todo.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
migrate = Migrate(app, db)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

# Models
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    lists = db.relationship('TodoList', backref='user', lazy=True, cascade="all, delete-orphan")

    def __repr__(self):
        return f'<User {self.username}>'

class TodoList(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    items = db.relationship('TodoItem', backref='todo_list', lazy=True, cascade="all, delete-orphan")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<TodoList {self.title}>'

class TodoItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.String(200), nullable=False)
    completed = db.Column(db.Boolean, default=False)
    list_id = db.Column(db.Integer, db.ForeignKey('todo_list.id'), nullable=False)
    parent_id = db.Column(db.Integer, db.ForeignKey('todo_item.id'), nullable=True)
    children = db.relationship('TodoItem', backref=db.backref('parent', remote_side=[id]), 
                               lazy=True, cascade="all, delete-orphan")
    collapsed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    level = db.Column(db.Integer, default=1)

    def __repr__(self):
        return f'<TodoItem {self.content}>'

    def toggle_complete(self):
        self.completed = not self.completed
        for child in self.children:
            child.completed = self.completed
            child.toggle_complete()

    def calculate_level(self):
        level = 1
        current = self.parent
        while current:
            level += 1
            current = current.parent
        return level

# Add this function to update levels for all items
def update_all_item_levels():
    items = TodoItem.query.all()
    for item in items:
        item.level = item.calculate_level()
    db.session.commit()

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Routes
@app.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    return render_template('index.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        user = User.query.filter_by(username=username).first()
        if user:
            flash('Username already exists')
            return redirect(url_for('register'))
        
        hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
        new_user = User(username=username, password=hashed_password)
        
        db.session.add(new_user)
        db.session.commit()
        
        flash('Account created successfully')
        return redirect(url_for('login'))
    
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        user = User.query.filter_by(username=username).first()
        
        if not user or not check_password_hash(user.password, password):
            flash('Please check your login details and try again')
            return redirect(url_for('login'))
        
        login_user(user)
        return redirect(url_for('dashboard'))
    
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/dashboard')
@login_required
def dashboard():
    lists = TodoList.query.filter_by(user_id=current_user.id).all()
    return render_template('dashboard.html', lists=lists)

# List routes
@app.route('/list/new', methods=['POST'])
@login_required
def new_list():
    title = request.form.get('title')
    if not title:
        flash('Title cannot be empty')
        return redirect(url_for('dashboard'))
    
    new_list = TodoList(title=title, user_id=current_user.id)
    db.session.add(new_list)
    db.session.commit()
    
    return redirect(url_for('dashboard'))

@app.route('/list/<int:list_id>')
@login_required
def view_list(list_id):
    todo_list = TodoList.query.get_or_404(list_id)
    
    # Check if the list belongs to the current user
    if todo_list.user_id != current_user.id:
        flash('You do not have permission to view this list')
        return redirect(url_for('dashboard'))
    
    # Get top-level items
    items = TodoItem.query.filter_by(list_id=list_id, parent_id=None).all()
    
    return render_template('list.html', todo_list=todo_list, items=items)

@app.route('/list/<int:list_id>/edit', methods=['POST'])
@login_required
def edit_list(list_id):
    todo_list = TodoList.query.get_or_404(list_id)
    
    # Check if the list belongs to the current user
    if todo_list.user_id != current_user.id:
        flash('You do not have permission to edit this list')
        return redirect(url_for('dashboard'))
    
    title = request.form.get('title')
    if not title:
        flash('Title cannot be empty')
        return redirect(url_for('view_list', list_id=list_id))
    
    todo_list.title = title
    db.session.commit()
    
    return redirect(url_for('view_list', list_id=list_id))

@app.route('/list/<int:list_id>/delete')
@login_required
def delete_list(list_id):
    todo_list = TodoList.query.get_or_404(list_id)
    
    # Check if the list belongs to the current user
    if todo_list.user_id != current_user.id:
        flash('You do not have permission to delete this list')
        return redirect(url_for('dashboard'))
    
    db.session.delete(todo_list)
    db.session.commit()
    
    return redirect(url_for('dashboard'))

# Item routes
@app.route('/item/new', methods=['POST'])
@login_required
def new_item():
    content = request.form.get('content')
    list_id = request.form.get('list_id')
    parent_id = request.form.get('parent_id') or None
    
    if not content or not list_id:
        flash('Content and list ID are required')
        return redirect(url_for('dashboard'))
    
    todo_list = TodoList.query.get_or_404(list_id)
    
    if todo_list.user_id != current_user.id:
        flash('You do not have permission to add items to this list')
        return redirect(url_for('dashboard'))
    
    new_item = TodoItem(
        content=content,
        list_id=list_id,
        parent_id=parent_id
    )
    
    if parent_id:
        parent = TodoItem.query.get_or_404(parent_id)
        new_item.level = parent.level + 1
    else:
        new_item.level = 1
    
    db.session.add(new_item)
    db.session.commit()
    
    return redirect(url_for('view_list', list_id=list_id))

@app.route('/item/<int:item_id>/edit', methods=['POST'])
@login_required
def edit_item_ajax(item_id):
    item = TodoItem.query.get_or_404(item_id)
    
    # Check if the item belongs to the current user
    if item.todo_list.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    content = request.form.get('content')
    if not content:
        return jsonify({'error': 'Content cannot be empty'}), 400
    
    item.content = content
    db.session.commit()
    
    return jsonify({'success': True, 'content': content})

@app.route('/item/<int:item_id>/delete')
@login_required
def delete_item(item_id):
    item = TodoItem.query.get_or_404(item_id)
    
    # Check if the item belongs to the current user
    if item.todo_list.user_id != current_user.id:
        flash('You do not have permission to delete this item')
        return redirect(url_for('dashboard'))
    
    list_id = item.list_id
    db.session.delete(item)
    db.session.commit()
    
    return redirect(url_for('view_list', list_id=list_id))

@app.route('/item/<int:item_id>/toggle', methods=['POST'])
@login_required
def toggle_item(item_id):
    item = TodoItem.query.get_or_404(item_id)
    
    # Check if the item belongs to the current user
    if item.todo_list.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    item.toggle_complete()
    db.session.commit()
    
    return jsonify({'success': True, 'completed': item.completed})

@app.route('/item/<int:item_id>/collapse')
@login_required
def toggle_collapse(item_id):
    item = TodoItem.query.get_or_404(item_id)
    
    # Check if the item belongs to the current user
    if item.todo_list.user_id != current_user.id:
        flash('You do not have permission to modify this item')
        return redirect(url_for('dashboard'))
    
    item.collapsed = not item.collapsed
    db.session.commit()
    
    return redirect(url_for('view_list', list_id=item.list_id))

@app.route('/item/<int:item_id>/move', methods=['POST'])
@login_required
def move_item(item_id):
    item = TodoItem.query.get_or_404(item_id)
    
    if item.todo_list.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    target_id = request.form.get('target_id')
    target_type = request.form.get('target_type')
    
    if target_type == 'list':
        target_list = TodoList.query.get_or_404(target_id)
        if target_list.user_id != current_user.id:
            return jsonify({'error': 'Unauthorized'}), 403
        item.list_id = target_list.id
        item.parent_id = None
        item.level = 1
    elif target_type == 'item':
        target_item = TodoItem.query.get_or_404(target_id)
        if target_item.todo_list.user_id != current_user.id:
            return jsonify({'error': 'Unauthorized'}), 403
        if target_item.id == item_id or target_item.parent_id == item_id:
            return jsonify({'error': 'Cannot move item into itself or its child'}), 400
        item.list_id = target_item.list_id
        item.parent_id = target_item.id
        item.level = target_item.level + 1
    else:
        return jsonify({'error': 'Invalid target type'}), 400
    
    # Update levels for all children
    for child in item.children:
        child.level = child.calculate_level()
        db.session.add(child)
    
    db.session.commit()
    return jsonify({'success': True})

# Add a new route for viewing/editing a specific task
@app.route('/task/<int:item_id>')
@login_required
def view_task(item_id):
    item = TodoItem.query.get_or_404(item_id)
    
    # Check if the item belongs to the current user
    if item.todo_list.user_id != current_user.id:
        flash('You do not have permission to view this task')
        return redirect(url_for('dashboard'))
    
    # Get the parent chain for breadcrumb navigation
    parent_chain = []
    current_parent = item.parent
    while current_parent:
        parent_chain.insert(0, current_parent)
        current_parent = current_parent.parent
    
    return render_template('task.html', item=item, parent_chain=parent_chain)

@app.route('/task/<int:item_id>/update', methods=['POST'])
@login_required
def update_task(item_id):
    item = TodoItem.query.get_or_404(item_id)
    
    # Check if the item belongs to the current user
    if item.todo_list.user_id != current_user.id:
        flash('You do not have permission to edit this task')
        return redirect(url_for('dashboard'))
    
    content = request.form.get('content')
    if not content:
        flash('Content cannot be empty')
        return redirect(url_for('view_task', item_id=item_id))
    
    item.content = content
    db.session.commit()
    
    return redirect(url_for('view_task', item_id=item_id))

# API routes for AJAX operations
@app.route('/api/lists')
@login_required
def api_lists():
    lists = TodoList.query.filter_by(user_id=current_user.id).all()
    return jsonify([{'id': l.id, 'title': l.title} for l in lists])

@app.route('/api/items/<int:list_id>')
@login_required
def api_items(list_id):
    todo_list = TodoList.query.get_or_404(list_id)
    
    # Check if the list belongs to the current user
    if todo_list.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    items = TodoItem.query.filter_by(list_id=list_id, parent_id=None).all()
    
    def item_to_dict(item):
        result = {
            'id': item.id,
            'content': item.content,
            'completed': item.completed,
            'collapsed': item.collapsed,
            'level': item.level,
            'children': [item_to_dict(child) for child in item.children]
        }
        return result
    
    return jsonify([item_to_dict(item) for item in items])

@app.route('/api/move_targets')
@login_required
def get_move_targets():
    lists = TodoList.query.filter_by(user_id=current_user.id).all()
    items = TodoItem.query.join(TodoList).filter(TodoList.user_id == current_user.id).all()
    
    targets = {
        'lists': [{'id': l.id, 'title': l.title} for l in lists],
        'items': [{'id': i.id, 'content': i.content, 'list_id': i.list_id} for i in items]
    }
    
    return jsonify(targets)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        update_all_item_levels()
    app.run(debug=True)

