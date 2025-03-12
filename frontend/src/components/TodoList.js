"use client"

import { useState, useEffect } from "react"
import TodoItem from "./TodoItem"
import "../styles/TodoList.css"

function TodoList({ list, lists, onListsChange }) {
  const [items, setItems] = useState([])
  const [newItemText, setNewItemText] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (list) {
      fetchItems()
    }
  }, [list])

  const fetchItems = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/lists/${list.id}/items`, {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setItems(data.items)
      }
    } catch (error) {
      console.error("Error fetching items:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddItem = async (e) => {
    e.preventDefault()
    if (!newItemText.trim()) return

    try {
      const response = await fetch(`/api/lists/${list.id}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: newItemText,
          parent_id: null,
        }),
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setItems([...items, data.item])
        setNewItemText("")
      }
    } catch (error) {
      console.error("Error adding item:", error)
    }
  }

  const handleDeleteItem = async (itemId) => {
    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (response.ok) {
        setItems(removeItemAndChildren(items, itemId))
      }
    } catch (error) {
      console.error("Error deleting item:", error)
    }
  }

  const handleToggleComplete = async (itemId, isComplete) => {
    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_complete: !isComplete }),
        credentials: "include",
      })

      if (response.ok) {
        setItems(updateItemAndChildrenCompletion(items, itemId, !isComplete))
      }
    } catch (error) {
      console.error("Error toggling item completion:", error)
    }
  }

  const updateItemAndChildrenCompletion = (items, itemId, isComplete) => {
    return items.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          is_complete: isComplete,
          children: item.children ? updateAllChildrenCompletion(item.children, isComplete) : item.children,
        }
      }
      if (item.children) {
        return {
          ...item,
          children: updateItemAndChildrenCompletion(item.children, itemId, isComplete),
        }
      }
      return item
    })
  }

  const updateAllChildrenCompletion = (children, isComplete) => {
    return children.map((child) => ({
      ...child,
      is_complete: isComplete,
      children: child.children ? updateAllChildrenCompletion(child.children, isComplete) : child.children,
    }))
  }

  const updateItemCompletion = (items, itemId, isComplete) => {
    return items.map((item) => {
      if (item.id === itemId) {
        return { ...item, is_complete: isComplete }
      }
      if (item.children) {
        return { ...item, children: updateItemCompletion(item.children, itemId, isComplete) }
      }
      return item
    })
  }

  const removeItemAndChildren = (items, itemId) => {
    return items.filter((item) => {
      if (item.id === itemId) return false
      if (item.children) {
        item.children = removeItemAndChildren(item.children, itemId)
      }
      return true
    })
  }

  const handleUpdateItem = async (itemId, newText) => {
    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: newText }),
        credentials: "include",
      })

      if (response.ok) {
        setItems(updateItemText(items, itemId, newText))
      }
    } catch (error) {
      console.error("Error updating item:", error)
    }
  }

  const updateItemText = (items, itemId, newText) => {
    return items.map((item) => {
      if (item.id === itemId) {
        return { ...item, text: newText }
      }
      if (item.children) {
        return { ...item, children: updateItemText(item.children, itemId, newText) }
      }
      return item
    })
  }

  const handleAddSubItem = async (parentId, text) => {
    try {
      const response = await fetch(`/api/lists/${list.id}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          parent_id: parentId,
        }),
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setItems(addSubItemToParent(items, parentId, data.item))
      }
    } catch (error) {
      console.error("Error adding sub-item:", error)
    }
  }

  const addSubItemToParent = (items, parentId, newItem) => {
    return items.map((item) => {
      if (item.id === parentId) {
        return { ...item, children: [...(item.children || []), newItem] }
      }
      if (item.children) {
        return { ...item, children: addSubItemToParent(item.children, parentId, newItem) }
      }
      return item
    })
  }

  const handleMoveItem = async (itemId, targetListId) => {
    try {
      const response = await fetch(`/api/items/${itemId}/move`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ target_list_id: targetListId }),
        credentials: "include",
      })

      if (response.ok) {
        setItems(removeItemAndChildren(items, itemId))
        onListsChange()
      }
    } catch (error) {
      console.error("Error moving item:", error)
    }
  }

  if (isLoading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div className="todo-list">
      <div className="list-header">
        <h2>{list.name}</h2>
      </div>

      <form onSubmit={handleAddItem} className="add-item-form">
        <input
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          placeholder="Add a new task..."
          className="add-item-input"
        />
        <button type="submit" className="add-item-button">
          Add
        </button>
      </form>

      <div className="items-container">
        {items.length === 0 ? (
          <p className="empty-list">No tasks yet. Add one above!</p>
        ) : (
          <ul className="items-list">
            {items.map((item) => (
              <TodoItem
                key={item.id}
                item={item}
                level={0}
                onDelete={handleDeleteItem}
                onToggleComplete={handleToggleComplete}
                onUpdate={handleUpdateItem}
                onAddSubItem={handleAddSubItem}
                onMove={handleMoveItem}
                otherLists={lists.filter((l) => l.id !== list.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default TodoList

