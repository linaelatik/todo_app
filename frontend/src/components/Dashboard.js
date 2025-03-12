import React, { useState, useEffect } from 'react';
import TodoList from './TodoList';
import ListSelector from './ListSelector';
import '../styles/Dashboard.css';

function Dashboard({ user, handleLogout }) {
  const [lists, setLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [newListName, setNewListName] = useState('');
  const [isCreatingList, setIsCreatingList] = useState(false);

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    try {
      const response = await fetch('/api/lists', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setLists(data.lists);
        
        // Select the first list by default if available
        if (data.lists.length > 0 && !selectedList) {
          setSelectedList(data.lists[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching lists:', error);
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    
    try {
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newListName }),
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setLists([...lists, data.list]);
        setSelectedList(data.list);
        setNewListName('');
        setIsCreatingList(false);
      }
    } catch (error) {
      console.error('Error creating list:', error);
    }
  };

  const handleDeleteList = async (listId) => {
    if (!window.confirm('Are you sure you want to delete this list?')) return;
    
    try {
      const response = await fetch(`/api/lists/${listId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        const updatedLists = lists.filter(list => list.id !== listId);
        setLists(updatedLists);
        
        if (selectedList && selectedList.id === listId) {
          setSelectedList(updatedLists.length > 0 ? updatedLists[0] : null);
        }
      }
    } catch (error) {
      console.error('Error deleting list:', error);
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Hierarchical Todo</h1>
        <div className="user-info">
          <span>Welcome, {user.username}</span>
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </div>
      </header>
      
      <div className="dashboard-content">
        <aside className="sidebar">
          <div className="list-header">
            <h2>My Lists</h2>
            {!isCreatingList ? (
              <button 
                onClick={() => setIsCreatingList(true)}
                className="create-list-button"
              >
                + New List
              </button>
            ) : (
              <div className="new-list-form">
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="List name"
                  autoFocus
                />
                <div className="new-list-actions">
                  <button onClick={handleCreateList}>Save</button>
                  <button onClick={() => {
                    setIsCreatingList(false);
                    setNewListName('');
                  }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
          
          <ListSelector 
            lists={lists} 
            selectedList={selectedList} 
            onSelectList={setSelectedList}
            onDeleteList={handleDeleteList}
          />
        </aside>
        
        <main className="main-content">
          {selectedList ? (
            <TodoList 
              list={selectedList} 
              lists={lists}
              onListsChange={fetchLists}
            />
          ) : (
            <div className="empty-state">
              <p>No lists available. Create a new list to get started!</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
