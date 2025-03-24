// ui.js
export function setupUI() {
  createScoreCard();
  createToolSelector();
  createShopButton();
}

function createScoreCard() {
  const scoreCard = document.createElement("div");
  scoreCard.className = "score-card";
  scoreCard.innerHTML = `
        <h3>Mined Resources</h3>
        <div class="score-item">
            <span class="label">CARBON:</span>
            <span class="value" id="carbonScore">0</span>
        </div>
        <div class="score-item">
            <span class="label">NICKEL:</span>
            <span class="value" id="nickelScore">0</span>
        </div>
        <div class="score-item">
            <span class="label">IRON:</span>
            <span class="value" id="ironScore">0</span>
        </div>
        <div class="score-item">
            <span class="label">GOLD:</span>
            <span class="value" id="goldScore">0</span>
        </div>
        <div class="score-item">
            <span class="label">PLATINUM:</span>
            <span class="value" id="platinumScore">0</span>
        </div>
    `;
  document.body.appendChild(scoreCard);
}

function createToolSelector() {
  const toolSelector = document.createElement("div");
  toolSelector.className = "tool-selector";
  toolSelector.appendChild(
    createToolButton(
      "shovel",
      '<div style="font-size: 24px; line-height: 1;">⛏</div>',
      "Shovel"
    )
  );
  toolSelector.appendChild(
    createToolButton(
      "dynamite",
      '<div style="font-size: 24px; line-height: 1;">💣</div>',
      "Boom"
    )
  );
  document.body.appendChild(toolSelector);
}

function createToolButton(tool, icon, label) {
  const button = document.createElement("button");
  button.className = "tool-button";
  button.dataset.tool = tool;
  button.style.width = "60px";
  button.style.height = "60px";
  button.style.borderRadius = "10px";
  button.style.background = tool === "shovel" ? "#4466ff" : "#333"; // Default to shovel as active
  button.style.color = "white";
  button.style.cursor = "pointer";
  button.style.display = "flex";
  button.style.flexDirection = "column";
  button.style.alignItems = "center";
  button.style.justifyContent = "center";
  button.style.fontSize = "12px";
  button.style.padding = "8px";
  button.style.transition = "all 0.3s ease";

  const iconElement = document.createElement("div");
  iconElement.className = "icon";
  iconElement.innerHTML = icon;
  iconElement.style.marginBottom = "5px";
  iconElement.style.width = "32px";
  iconElement.style.height = "32px";
  iconElement.style.fontSize = "32px";
  iconElement.style.textShadow = "0 0 5px rgba(255, 255, 0, 0.8)";

  const labelElement = document.createElement("span");
  labelElement.className = "label";
  labelElement.textContent = label;
  labelElement.style.textTransform = "uppercase";
  labelElement.style.fontWeight = "bold";
  labelElement.style.letterSpacing = "1px";

  button.appendChild(iconElement);
  button.appendChild(labelElement);

  button.addEventListener("click", () => {
    document.querySelectorAll(".tool-button").forEach((btn) => {
      btn.classList.remove("active");
      btn.style.background =
        btn.dataset.tool === tool
          ? "linear-gradient(145deg, #4466ff, #2233aa)"
          : "linear-gradient(145deg, #333, #000)";
    });
    button.classList.add("active");
    button.style.transform = "scale(0.9)";
    setTimeout(() => {
      button.style.transform = "scale(1)";
    }, 100);
  });

  return button;
}

function createShopButton() {
  const button = document.createElement("button");
  button.className = "shop-button";
  button.innerHTML = `
        <span class="icon">🛒</span>
        <span class="text">SHOP</span>
    `;
  button.addEventListener("click", () => {
    button.style.transform = "scale(0.9)";
    setTimeout(() => {
      button.style.transform = "scale(1)";
    }, 100);
    window.location.href = "shop.html";
  });
  document.body.appendChild(button);
}

export function updateScoreCard(resources) {
  const scoreElements = {
    carbonScore: document.getElementById("carbonScore"),
    nickelScore: document.getElementById("nickelScore"),
    ironScore: document.getElementById("ironScore"),
    goldScore: document.getElementById("goldScore"),
    platinumScore: document.getElementById("platinumScore"),
  };

  Object.keys(scoreElements).forEach((key) => {
    const element = scoreElements[key];
    const targetValue = resources[key.replace("Score", "").toUpperCase()];

    const tempElement = document.createElement("span");
    tempElement.className = "value";
    tempElement.textContent = element.textContent;
    tempElement.style.position = "absolute";
    tempElement.style.color = "#f00";
    tempElement.style.textShadow = "0 0 5px #f00";
    element.parentNode.appendChild(tempElement);

    let currentValue = parseInt(element.textContent);
    const interval = setInterval(() => {
      if (currentValue < targetValue) {
        currentValue += Math.ceil((targetValue - currentValue) / 10);
        if (currentValue > targetValue) currentValue = targetValue;
        element.textContent = currentValue;
        tempElement.style.transform = `translateY(${
          (currentValue / targetValue) * -10
        }px)`;
        tempElement.style.opacity = 1 - currentValue / targetValue;
      } else {
        clearInterval(interval);
        tempElement.remove();
      }
    }, 50);
  });
}
