(function () {
    "use strict";

    // Early exit if no dialogs exist on the page
    if (!document.querySelector("dialog")) {
        return;
    }

    // Initialize modal functionality
    function initModals() {
        try {
            const dialogs = document.querySelectorAll("dialog");

            if (dialogs.length === 0) {
                return;
            }

            // Use event delegation for all clicks
            document.addEventListener("click", handleModalClicks);

            // Setup individual dialog listeners
            dialogs.forEach(setupDialogListeners);

            // Handle auto-open modals with cooldown support
            dialogs.forEach(handleAutoOpenModal);
        } catch (error) {
            console.warn("Modal initialization failed:", error);
        }
    }

    // Handle all modal-related clicks using event delegation
    function handleModalClicks(e) {
        const target = e.target;

        // 1. Handle Open Triggers (Looks for [data-open-modal="ID"])
        const openTrigger = target.closest("[data-open-modal]");
        if (openTrigger) {
          e.preventDefault();
          const modalId = openTrigger.dataset.openModal;
          if (!modalId) return;
          const dialog = document.getElementById(modalId);
        
          if (dialog && dialog.tagName === "DIALOG") {
            dialog.showModal();
            dialog.scrollTop = 0;
          } else {
            console.warn(`No dialog found with ID: ${modalId}`);
          }
          return;
        }

        // 2. Handle Close Buttons (Any button inside a dialog)
        const closeButton = target.closest("dialog button");
        if (closeButton) {
            e.preventDefault();
            const dialog = target.closest("dialog");
            if (dialog) {
                closeModal(dialog);
            }
            return;
        }
    }

    // Setup listeners for each dialog
    function setupDialogListeners(dialog) {
        // Click outside (backdrop) to close
        dialog.addEventListener("click", function (e) {
            if (e.target === dialog) {
                closeModal(dialog);
            }
        });

        // Track when modal is closed to update localStorage if cooldown is enabled
        dialog.addEventListener("close", function () {
            handleModalClose(dialog);
        });
    }

    // Function to close the modal with animation
    function closeModal(dialog) {
        dialog.classList.add("closing");
        dialog.addEventListener("animationend", () => {
            dialog.classList.remove("closing");
            dialog.close();
        }, { once: true });
    }

    // Handle auto-open modal functionality with cooldown support
    function handleAutoOpenModal(dialog) {
        const shouldOpenOnLoad = dialog.dataset.modalOpenOnLoad === "true";

        if (!shouldOpenOnLoad) {
            return;
        }

        const cooldownDays = parseInt(dialog.dataset.modalCooldownDays, 10) || 0;
        const modalId = getModalId(dialog);

        if (!modalId) {
            return;
        }

        if (cooldownDays > 0 && isInCooldown(modalId)) {
            return;
        }

        dialog.showModal();
        dialog.scrollTop = 0;
    }

    // Handle modal close event and store cooldown timestamp
    function handleModalClose(dialog) {
        const cooldownDays = parseInt(dialog.dataset.modalCooldownDays, 10);

        if (cooldownDays > 0) {
            const modalId = getModalId(dialog);
            if (modalId) {
                storeCooldownTimestamp(modalId, cooldownDays);
            }
        }
    }

    // Get the modal ID (Uses the dialog's ID directly)
    function getModalId(dialog) {
        if (dialog.id) {
            return dialog.id;
        }
        
        // Fallback to parent ID if dialog has no ID (legacy support)
        const parent = dialog.parentElement;
        if (parent && parent.id) {
            return parent.id;
        }

        console.log("Dialog or parent must have an ID set for linking and cooldowns.");
        return null;
    }

    // Check if a modal is currently in cooldown period
    function isInCooldown(modalId) {
        try {
            const storageKey = `modal-cooldown-${modalId}`;
            const cooldownUntil = localStorage.getItem(storageKey);

            if (!cooldownUntil) {
                return false;
            }

            const now = Date.now();
            const cooldownTime = parseInt(cooldownUntil, 10);

            if (now > cooldownTime) {
                localStorage.removeItem(storageKey);
                return false;
            }

            return true;
        } catch (error) {
            console.warn("Error checking modal cooldown:", error);
            return false;
        }
    }

    // Store cooldown timestamp in localStorage
    function storeCooldownTimestamp(modalId, days) {
        try {
            const storageKey = `modal-cooldown-${modalId}`;
            const now = Date.now();
            const cooldownDuration = days * 24 * 60 * 60 * 1000; 
            const cooldownUntil = now + cooldownDuration;

            localStorage.setItem(storageKey, cooldownUntil.toString());
        } catch (error) {
            console.warn("Error storing modal cooldown:", error);
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initModals);
    } else {
        initModals();
    }
})();
