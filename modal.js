(function () {
  "use strict";

  if (!document.querySelector("dialog")) return;

  function getOrCreateBackdrop() {
    let backdrop = document.getElementById("modal-backdrop");
    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.id = "modal-backdrop";
      document.body.appendChild(backdrop);
    }
    return backdrop;
  }

  function initModals() {
    try {
      const dialogs = document.querySelectorAll("dialog");
      if (dialogs.length === 0) return;

      getOrCreateBackdrop();
      
      document.addEventListener("click", handleModalClicks);
      dialogs.forEach(setupDialogListeners);
      dialogs.forEach(handleAutoOpenModal);
    } catch (error) {
      console.warn("Modal initialization failed:", error);
    }
  }

  function handleModalClicks(e) {
    const target = e.target;

    // 1. Handle Modal-to-Modal Transitions
    const transitionTrigger = target.closest("[data-transition-to-modal]");
    if (transitionTrigger) {
      e.preventDefault();
      e.stopPropagation();
      
      const targetModalId = transitionTrigger.dataset.transitionToModal;
      const currentDialog = target.closest("dialog");
      const targetDialog = document.getElementById(targetModalId);

      if (currentDialog && targetDialog && targetDialog.tagName === "DIALOG") {
        transitionBetweenModals(currentDialog, targetDialog);
      }
      return;
    }

    // 2. Handle Open Triggers
    const openTrigger = target.closest("[data-open-modal]");
    if (openTrigger) {
      e.preventDefault();
      const modalId = openTrigger.dataset.openModal;
      if (!modalId) return;
      const dialog = document.getElementById(modalId);

      if (dialog && dialog.tagName === "DIALOG") {
        openModal(dialog);
      }
      return;
    }

    // 3. Handle Close Buttons
    const closeButton = target.closest("dialog button:not([data-transition-to-modal])");
    if (closeButton) {
      e.preventDefault();
      const dialog = target.closest("dialog");
      if (dialog) {
        closeModal(dialog);
      }
      return;
    }
  }

  function setupDialogListeners(dialog) {
    dialog.addEventListener("click", function (e) {
      if (e.target === dialog) {
        closeModal(dialog);
      }
    });

    dialog.addEventListener("close", function () {
      dialog.classList.remove("transitioned");
      handleModalClose(dialog);
    });
  }

  // ============================================
  // NORMAL MODAL OPEN/CLOSE (Native backdrop)
  // ============================================

  function openModal(dialog) {
    dialog.classList.remove("transitioned");
    dialog.showModal();
    dialog.scrollTop = 0;
  }

  function closeModal(dialog) {
    const backdrop = getOrCreateBackdrop();
    const wasTransitioned = dialog.classList.contains("transitioned");
    
    dialog.classList.add("closing");
    
    if (wasTransitioned) {
      backdrop.classList.remove("no-transition");
      backdrop.classList.remove("visible");
    }
    
    dialog.addEventListener("animationend", () => {
      dialog.classList.remove("closing", "transitioned");
      dialog.close();
    }, { once: true });
  }

  // ============================================
  // MODAL-TO-MODAL TRANSITION (Custom backdrop)
  // ============================================

  function transitionBetweenModals(fromDialog, toDialog) {
    const backdrop = getOrCreateBackdrop();
    
    toDialog.dataset.returnToModal = fromDialog.id;
    
    backdrop.classList.add("no-transition");
    backdrop.classList.add("visible");
    
    backdrop.offsetHeight;
    
    fromDialog.classList.remove("transitioned");
    fromDialog.classList.add("transitioning-out");
    
    fromDialog.addEventListener("animationend", function exitHandler(e) {
      if (e.target !== fromDialog) return;
      
      fromDialog.classList.remove("transitioning-out");
      fromDialog.close();
      
      toDialog.classList.add("transitioning-in");
      toDialog.showModal();
      toDialog.scrollTop = 0;
      
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          toDialog.classList.add("animate-content");
        });
      });
      
    }, { once: true });
    
    toDialog.addEventListener("animationend", function enterHandler(e) {
      if (e.target !== toDialog) return;
      
      toDialog.classList.add("transitioned");
      toDialog.classList.remove("transitioning-in", "animate-content");
      
      backdrop.classList.remove("no-transition");
      
    }, { once: true });
  }

  // ============================================
  // BACK NAVIGATION
  // ============================================

  function transitionBack(currentDialog) {
    const previousModalId = currentDialog.dataset.returnToModal;
    if (!previousModalId) return false;
    
    const previousDialog = document.getElementById(previousModalId);
    if (!previousDialog) return false;
    
    delete currentDialog.dataset.returnToModal;
    transitionBetweenModals(currentDialog, previousDialog);
    return true;
  }

  // ============================================
  // AUTO-OPEN & COOLDOWN
  // ============================================

  function handleAutoOpenModal(dialog) {
    const shouldOpenOnLoad = dialog.dataset.modalOpenOnLoad === "true";
    if (!shouldOpenOnLoad) return;

    const cooldownDays = parseInt(dialog.dataset.modalCooldownDays, 10) || 0;
    const modalId = getModalId(dialog);
    if (!modalId) return;

    if (cooldownDays > 0 && isInCooldown(modalId)) return;

    openModal(dialog);
  }

  function handleModalClose(dialog) {
    const cooldownDays = parseInt(dialog.dataset.modalCooldownDays, 10);
    if (cooldownDays > 0) {
      const modalId = getModalId(dialog);
      if (modalId) storeCooldownTimestamp(modalId, cooldownDays);
    }
  }

  function getModalId(dialog) {
    if (dialog.id) return dialog.id;
    const parent = dialog.parentElement;
    if (parent && parent.id) return parent.id;
    return null;
  }

  function isInCooldown(modalId) {
    try {
      const storageKey = `modal-cooldown-${modalId}`;
      const cooldownUntil = localStorage.getItem(storageKey);
      if (!cooldownUntil) return false;

      const now = Date.now();
      const cooldownTime = parseInt(cooldownUntil, 10);

      if (now > cooldownTime) {
        localStorage.removeItem(storageKey);
        return false;
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  function storeCooldownTimestamp(modalId, days) {
    try {
      const storageKey = `modal-cooldown-${modalId}`;
      const cooldownUntil = Date.now() + days * 24 * 60 * 60 * 1000;
      localStorage.setItem(storageKey, cooldownUntil.toString());
    } catch (error) {
      console.warn("Error storing modal cooldown:", error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initModals);
  } else {
    initModals();
  }

  window.modalTransitionBack = transitionBack;
})();
