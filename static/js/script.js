// Dialog handling functions
function showDialog(dialogId, overlayId) {
    const dialog = document.getElementById(dialogId)
    const overlay = document.getElementById(overlayId)
    dialog.classList.add("show")
    overlay.classList.add("show")
  }
  
  function hideDialog(dialogId, overlayId) {
    const dialog = document.getElementById(dialogId)
    const overlay = document.getElementById(overlayId)
    dialog.classList.remove("show")
    overlay.classList.remove("show")
  }
  
  // Move dialog handling
  let currentMoveItemId = null
  
  // Function to populate move targets in the dialog
  function populateMoveTargets(data) {
    const listSelect = document.getElementById("move-target-list")
    const itemSelect = document.getElementById("move-target-item")
  
    // Clear existing options
    listSelect.innerHTML = ""
    itemSelect.innerHTML = ""
  
    // Add list options
    data.lists.forEach((list) => {
      const option = document.createElement("option")
      option.value = list.id
      option.textContent = list.name
      listSelect.appendChild(option)
    })
  
    // Add item options
    data.items.forEach((item) => {
      const option = document.createElement("option")
      option.value = item.id
      option.textContent = item.name
      itemSelect.appendChild(option)
    })
  }
  
  document.querySelectorAll(".move-item-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const itemId = this.getAttribute("data-item-id")
      currentMoveItemId = itemId
  
      // Fetch available move targets
      fetch("/api/move_targets")
        .then((response) => response.json())
        .then((data) => {
          populateMoveTargets(data)
          showDialog("moveDialog", "moveDialogOverlay")
        })
        .catch((error) => console.error("Error:", error))
    })
  })
  
  document.getElementById("closeMoveDialog").addEventListener("click", () => {
    hideDialog("moveDialog", "moveDialogOverlay")
  })
  
  document.getElementById("cancelMove").addEventListener("click", () => {
    hideDialog("moveDialog", "moveDialogOverlay")
  })
  
  document.getElementById("confirmMove").addEventListener("click", () => {
    if (!currentMoveItemId) return
  
    const targetType = document.getElementById("move-target-type").value
    const targetId =
      targetType === "list"
        ? document.getElementById("move-target-list").value
        : document.getElementById("move-target-item").value
  
    const formData = new FormData()
    formData.append("target_type", targetType)
    formData.append("target_id", targetId)
  
    fetch(`/item/${currentMoveItemId}/move`, {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          window.location.reload()
        }
      })
      .catch((error) => console.error("Error:", error))
  
    hideDialog("moveDialog", "moveDialogOverlay")
  })
  
  // Delete dialog handling
  let currentDeleteItemId = null
  
  document.querySelectorAll(".delete-item-btn").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault()
      const itemId = this.getAttribute("data-item-id")
      currentDeleteItemId = itemId
      showDialog("deleteDialog", "deleteDialogOverlay")
    })
  })
  
  document.getElementById("closeDeleteDialog").addEventListener("click", () => {
    hideDialog("deleteDialog", "deleteDialogOverlay")
  })
  
  document.getElementById("cancelDelete").addEventListener("click", () => {
    hideDialog("deleteDialog", "deleteDialogOverlay")
  })
  
  document.getElementById("confirmDelete").addEventListener("click", () => {
    if (!currentDeleteItemId) return
  
    window.location.href = `/item/${currentDeleteItemId}/delete`
  })
  
  // Close dialogs when clicking overlay
  document.querySelectorAll(".dialog-overlay").forEach((overlay) => {
    overlay.addEventListener("click", () => {
      const dialogId = overlay.id.replace("Overlay", "")
      hideDialog(dialogId, overlay.id)
    })
  })
  
  // Close dialogs with Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".custom-dialog.show").forEach((dialog) => {
        const dialogId = dialog.id
        const overlayId = `${dialogId}Overlay`
        hideDialog(dialogId, overlayId)
      })
    }
  })
  
  