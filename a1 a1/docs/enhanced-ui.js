// Enhanced UI Controls
class UIController {
  constructor() {
    this.hiddenElements = new Set();
    this.allHidden = false;

    // Initialize hide/show controls
    this.initializeControls();
  }

  initializeControls() {
    // Add hide all button
    const hideAllBtn = document.createElement("button");
    hideAllBtn.className = "hide-all-button";
    hideAllBtn.textContent = "Hide UI";
    hideAllBtn.onclick = () => this.toggleAllUI();
    document.body.appendChild(hideAllBtn);

    // Add hide/show buttons to stats display
    this.addStatsControls();
  }

  addStatsControls() {
    const statsDisplay = document.querySelector(".stats-display");
    if (!statsDisplay) return;

    // Create header with hide button
    const header = document.createElement("div");
    header.className = "stats-header";

    const title = document.createElement("span");
    title.textContent = "Character Stats";

    const hideBtn = document.createElement("button");
    hideBtn.className = "hide-button";
    hideBtn.textContent = "×";
    hideBtn.onclick = () => this.toggleElement(statsDisplay);

    header.appendChild(title);
    header.appendChild(hideBtn);

    // Insert header at start of stats display
    statsDisplay.insertBefore(header, statsDisplay.firstChild);
  }

  toggleElement(element) {
    if (element.classList.contains("hidden")) {
      element.classList.remove("hidden");
      this.hiddenElements.delete(element);
    } else {
      element.classList.add("hidden");
      this.hiddenElements.add(element);
    }
  }

  toggleAllUI() {
    const uiElements = document.querySelectorAll(
      ".game-panel, .game-button, .stats-display"
    );

    if (this.allHidden) {
      // Show all UI
      uiElements.forEach((el) => el.classList.remove("hidden"));
      this.hiddenElements.clear();
      this.allHidden = false;
      document.querySelector(".hide-all-button").textContent = "Hide UI";
    } else {
      // Hide all UI except hide-all button
      uiElements.forEach((el) => {
        if (!el.classList.contains("hide-all-button")) {
          el.classList.add("hidden");
          this.hiddenElements.add(el);
        }
      });
      this.allHidden = true;
      document.querySelector(".hide-all-button").textContent = "Show UI";
    }
  }
}

// Initialize UI controller when document is ready
document.addEventListener("DOMContentLoaded", () => {
  window.uiController = new UIController();
});
