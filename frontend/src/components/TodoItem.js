"use client"

import { useState } from "react"
import { FaChevronRight, FaChevronDown, FaEdit, FaTrash, FaPlus, FaExchangeAlt } from "react-icons/fa"
import ConfirmationModal from "./ConfirmationModal"
import "../styles/TodoItem.css"

function TodoItem({ item, level, onDelete, onToggleComplete, onUpdate, onAddSubItem, onMove, otherLists }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(item.text)
  const [isAddingSubItem, setIsAddingSubItem] = useState(false)
  const [newSubItemText, setNewSubItemText] = useState("")
  const [showMoveOptions, setShowMoveOptions] = useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)

  const hasChildren = item.children && item.children.length > 0
  const maxLevel = 9 // 0-based index, so this is level 10. You can always add more.

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  const handleEditSubmit = (e) => {
    e.preventDefault()
    if (editText.trim()) {
      onUpdate(item.id, editText)
      setIsEditing(false)
    }
  }

  const handleAddSubItemSubmit = (e) => {
    e.preventDefault()
    if (newSubItemText.trim()) {
      onAddSubItem(item.id, newSubItemText)
      setNewSubItemText("")
      setIsAddingSubItem(false)
      setIsExpanded(true) // Expand to show the new sub-item
    }
  }

  const handleMoveToList = (listId) => {
    onMove(item.id, listId)
    setShowMoveOptions(false)
  }

  const handleToggleComplete = () => {
    onToggleComplete(item.id, item.is_complete)
  }

  const handleDeleteClick = () => {
    setShowDeleteConfirmation(true)
  }

  const handleDeleteConfirm = () => {
    onDelete(item.id)
    setShowDeleteConfirmation(false)
  }

  return (
    <li className={`todo-item level-${level}`}>
      <div className="item-content">
        <div className="item-main">
          {hasChildren && (
            <button
              className="expand-button"
              onClick={handleToggleExpand}
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
            </button>
          )}

          {!hasChildren && <div className="expand-placeholder"></div>}

          <input type="checkbox" checked={item.is_complete} onChange={handleToggleComplete} className="item-checkbox" />

          {isEditing ? (
            <form onSubmit={handleEditSubmit} className="edit-form">
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                autoFocus
                className="edit-input"
              />
              <div className="edit-actions">
                <button type="submit" className="save-button">
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false)
                    setEditText(item.text)
                  }}
                  className="cancel-button"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <span className={`item-text ${item.is_complete ? "completed" : ""}`}>{item.text}</span>
          )}
        </div>

        {!isEditing && (
          <div className="item-actions">
            {level === 0 && otherLists.length > 0 && (
              <div className="move-dropdown">
                <button
                  className="action-button move-button"
                  onClick={() => setShowMoveOptions(!showMoveOptions)}
                  aria-label="Move to another list"
                >
                  <FaExchangeAlt />
                </button>

                {showMoveOptions && (
                  <div className="move-options">
                    {otherLists.map((list) => (
                      <button key={list.id} onClick={() => handleMoveToList(list.id)} className="move-option">
                        {list.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button className="action-button edit-button" onClick={() => setIsEditing(true)} aria-label="Edit">
              <FaEdit />
            </button>

            <button className="action-button delete-button" onClick={handleDeleteClick} aria-label="Delete">
              <FaTrash />
            </button>

            {level < maxLevel && (
              <button
                className="action-button add-sub-button"
                onClick={() => {
                  setIsAddingSubItem(!isAddingSubItem)
                  if (!isAddingSubItem) {
                    setIsExpanded(true)
                  }
                }}
                aria-label="Add sub-item"
              >
                <FaPlus />
              </button>
            )}
          </div>
        )}
      </div>

      {isAddingSubItem && (
        <form onSubmit={handleAddSubItemSubmit} className="add-sub-item-form">
          <input
            type="text"
            value={newSubItemText}
            onChange={(e) => setNewSubItemText(e.target.value)}
            placeholder="Add a sub-task..."
            autoFocus
            className="add-sub-item-input"
          />
          <div className="add-sub-item-actions">
            <button type="submit" className="save-button">
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingSubItem(false)
                setNewSubItemText("")
              }}
              className="cancel-button"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {hasChildren && isExpanded && (
        <ul className="sub-items">
          {item.children.map((child) => (
            <TodoItem
              key={child.id}
              item={child}
              level={level + 1}
              onDelete={onDelete}
              onToggleComplete={onToggleComplete}
              onUpdate={onUpdate}
              onAddSubItem={onAddSubItem}
              onMove={onMove}
              otherLists={otherLists}
            />
          ))}
        </ul>
      )}

      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={handleDeleteConfirm}
        message={
          hasChildren
            ? "Are you sure you want to delete this task? This will also delete all subtasks."
            : "Are you sure you want to delete this task?"
        }
      />
    </li>
  )
}

export default TodoItem

