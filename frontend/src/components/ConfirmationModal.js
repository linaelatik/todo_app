"use client"
import "../styles/ConfirmationModal.css"

function ConfirmationModal({ isOpen, onClose, onConfirm, message }) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <p>{message}</p>
        <div className="modal-actions">
          <button onClick={onConfirm} className="confirm-button">
            Confirm
          </button>
          <button onClick={onClose} className="cancel-button">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmationModal

