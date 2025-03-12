import React from 'react';
import { FaTrash } from 'react-icons/fa';
import '../styles/ListSelector.css';

function ListSelector({ lists, selectedList, onSelectList, onDeleteList }) {
  return (
    <div className="list-selector">
      {lists.length === 0 ? (
        <p className="no-lists">No lists yet</p>
      ) : (
        <ul>
          {lists.map(list => (
            <li 
              key={list.id} 
              className={selectedList && selectedList.id === list.id ? 'selected' : ''}
            >
              <div 
                className="list-item" 
                onClick={() => onSelectList(list)}
              >
                <span>{list.name}</span>
              </div>
              <button 
                className="delete-list-button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteList(list.id);
                }}
              >
                <FaTrash />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ListSelector;
