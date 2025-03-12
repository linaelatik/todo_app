
# Hierarchical Todo App

A full-stack todo application that supports hierarchical task management with multiple lists and subtasks.

## Features

### User Authentication
- Secure user registration and login
- Session management
- Password hashing

### Todo List Management
- Create multiple todo lists
- Delete lists with all associated tasks
- Switch between different lists

### Hierarchical Tasks
- Create tasks and subtasks (up to 10 levels deep, can be more if needed by adjusting line 18 in frontend/src/components/TodoItem.js)
- Mark tasks as complete/incomplete (affects subtasks)
- Edit task text inline
- Move tasks between lists
- Delete tasks (automatically removes subtasks)

## Project Structure

```plaintext
todo_app/
├── backend/
│   ├── app.py          # Main Flask application
│   ├── models.py       # Database models
│   └── requirements.txt # Python dependencies
└── frontend/
    ├── src/
    │   ├── components/ # React components
    │   └── styles/     # CSS files
    └── package.json    # Node.js dependencies
```

## Setup Instructions

### Prerequisites

- Python 3.11 (Required for compatibility with SQLAlchemy)
- Node.js (v14 or higher)

### Backend Setup

1. Create and activate virtual environment:
   ```bash
   # Create virtual environment with Python 3.11
   python3.11 -m venv backend/venv

   # Activate virtual environment
   source backend/venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. Run the backend server:
   ```bash
   python app.py
   ```

### Frontend Setup

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Register a new account or login
3. Create your first todo list
4. Add tasks and subtasks
5. Organize your tasks by moving them between lists

## Technical Stack

### Backend
- Flask (Web Framework)
- SQLAlchemy (ORM)
- SQLite (Database)
- Flask-CORS (Cross-Origin Resource Sharing)

### Frontend
- React
- React Router
- CSS Modules
- React Icons

### Security
- Session-based authentication
- Secure password hashing
- HTTPS-only cookies
- CSRF protection

### Demo Video: 
https://www.loom.com/share/35805fecf19749bdb6a1c7123719096a?sid=0c3334fb-7054-4ac7-89c4-a582f249016a

## IMPORTANT NOTE ABOUT VIDEO!!! 
- I said in the video that you could only add 3 subtasks as it would be complicated but I figured it out and now the code * allows adding up to 10 LEVELS (you can make it more by changing in frontend/src/components/TodoItem.js )
- I did not mention this due to time constraints but you can also delete Lists.