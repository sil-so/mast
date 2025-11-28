(() => {
  "use strict";

  const CONFIG = {
    selector: '[data-stack="wrapper"]',
    itemSelector: '[data-stack="item"]',

    // -- CONFIGURATION FOR HOVER STATE --
    spreadRadius: 8, // How far elements fly out on hover (increased slightly)
    rotationRange: 3, // How much they rotate on hover

    // -- CONFIGURATION FOR INITIAL (LOAD) STATE --
    initialSpread: 6, // Pixels to offset images initially (messiness)
    initialRotation: 7, // Degrees to rotate images initially (messiness)

    animDuration: 400,
  };

  const initStack = () => {
    const wrappers = document.querySelectorAll(CONFIG.selector);

    wrappers.forEach((wrapper) => {
      const items = Array.from(wrapper.querySelectorAll(CONFIG.itemSelector));
      if (items.length === 0) return;

      const trueGridParent = items[0].parentElement;
      trueGridParent.setAttribute("data-stack-grid", "true");
      trueGridParent.style.minHeight = "auto";

      if (wrapper !== trueGridParent) wrapper.style.display = "contents";

      items.forEach((item, i) => {
        const isTop = i === 0;

        const imgComponent = item.querySelector(".img-component");
        if (imgComponent) {
          const style = imgComponent.getAttribute("style") || "";
          const arMatch = style.match(
            /aspect-ratio:\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/,
          );
          if (arMatch) {
            const w = parseFloat(arMatch[1]);
            const h = parseFloat(arMatch[2]);
            imgComponent.setAttribute(
              "data-orient",
              w > h ? "landscape" : w < h ? "portrait" : "square",
            );
          }
        }

        // --- UPDATED INITIAL STATE LOGIC ---
        // 1. Calculate Initial Rotation
        const initialRot = isTop
          ? 0
          : (
              Math.random() * (CONFIG.initialRotation * 2) -
              CONFIG.initialRotation
            ).toFixed(2);

        // 2. Calculate Initial X/Y Offset (Translation)
        // We pick a random angle and a random distance based on initialSpread config
        const initAngle = Math.random() * Math.PI * 2;
        const initDist = isTop ? 0 : Math.random() * CONFIG.initialSpread;
        const initX = Math.cos(initAngle) * initDist;
        const initY = Math.sin(initAngle) * initDist;

        // Store these values so we can revert to them on "mouseleave"
        item.dataset.initialRot = initialRot;
        item.dataset.initialX = initX;
        item.dataset.initialY = initY;

        Object.assign(item.style, {
          zIndex: items.length - i,
          opacity: isTop ? "1" : "0",
          // Apply both translation and rotation immediately
          transform: `translate(${initX}px, ${initY}px) rotate(${initialRot}deg)`,
          transition: `transform ${CONFIG.animDuration}ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.3s ease`,
        });

        // --- HOVER PRE-CALCULATION ---
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * CONFIG.spreadRadius + 2;
        item.dataset.angle = angle;
        item.dataset.dist = dist;

        const img = item.querySelector("img");
        if (img) {
          if (!img.complete) {
            img.onload = () => {
              if (!isTop) item.style.opacity = "1";
            };
          } else if (!isTop) {
            item.style.opacity = "1";
          }
        }
      });

      // ON HOVER: Spread out widely
      trueGridParent.addEventListener("mouseenter", () => {
        items.forEach((item) => {
          const angle = parseFloat(item.dataset.angle);
          const dist = parseFloat(item.dataset.dist);
          const rot =
            Math.random() * CONFIG.rotationRange * 2 - CONFIG.rotationRange;

          const x = Math.cos(angle) * dist;
          const y = Math.sin(angle) * dist;
          item.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg)`;
        });
      });

      // ON LEAVE: Return to the "messy" initial state (not 0,0)
      trueGridParent.addEventListener("mouseleave", () => {
        items.forEach((item) => {
          const baseRot = item.dataset.initialRot;
          const baseX = item.dataset.initialX || 0;
          const baseY = item.dataset.initialY || 0;

          // Reset to the stored initial offsets
          item.style.transform = `translate(${baseX}px, ${baseY}px) rotate(${baseRot}deg)`;
        });
      });
    });
  };

  const initLightbox = () => {
    const stacks = document.querySelectorAll(CONFIG.selector);

    stacks.forEach((stack) => {
      const items = stack.querySelectorAll(`${CONFIG.itemSelector} img`);
      if (items.length === 0) return;

      const card = stack.closest(".card");
      const badge = card?.querySelector(".stack-badge");
      if (badge) {
        if (items.length > 1) {
          badge.textContent = `${items.length}`;
          badge.style.display = "";
        } else {
          badge.style.display = "none";
        }
      }

      const elements = Array.from(items).map((img) => {
        let src = img.getAttribute("data-src") || img.currentSrc || img.src;
        if (src.startsWith("data:image/svg") && img.getAttribute("data-src")) {
          src = img.getAttribute("data-src");
        }

        return {
          href: src,
          type: "image",
          alt: img.alt || "Work",
        };
      });

      const trueParent = items[0].parentElement;
      trueParent.style.cursor = "zoom-in";

      const lightbox = GLightbox({
        elements: elements,
        touchNavigation: true,
        loop: true,
        openEffect: "zoom",
        closeEffect: "zoom",
      });

      lightbox.on("open", () => {
        trueParent.setAttribute("data-lightbox-locked", "true");
      });

      lightbox.on("close", () => {
        setTimeout(() => {
          trueParent.removeAttribute("data-lightbox-locked");
        }, 500);
      });

      trueParent.addEventListener("click", (e) => {
        if (trueParent.hasAttribute("data-lightbox-locked")) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }

        e.preventDefault();
        e.stopPropagation();
        lightbox.open();
      });
    });
  };

  const boot = () => {
    requestAnimationFrame(() => {
      initStack();

      if (typeof GLightbox !== "undefined") {
        initLightbox();
      } else {
        let attempts = 0;
        const checkGL = setInterval(() => {
          attempts++;
          if (typeof GLightbox !== "undefined") {
            clearInterval(checkGL);
            initLightbox();
          } else if (attempts > 20) {
            clearInterval(checkGL);
          }
        }, 100);
      }
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
