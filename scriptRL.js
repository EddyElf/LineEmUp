// Track the currently dragged image
let draggedImg = null;

// Track how many images have been correctly placed
let correctPlacements = 0;

// Counter logic
let count = 33.33;

// Used to permanently disable timer and pause/resume
let gameOver = false;

function updateCounter() {
  const el = document.getElementById("counter");
  if (el) el.textContent = count.toFixed(2);
}

updateCounter();

// TIMER: Start countdown every 100ms
let countdownInterval = setInterval(() => {
  count -= 0.01;
  if (count <= 0) {
    count = 0;
  }
  updateCounter();
}, 100); // Every 100ms = 0.01 per tenth of a second

// Sound effect setup
const dingSound = new Audio('ding.mp3');     // plays when +10 points awarded
const noWantSound = new Audio('nowant.mp3'); // plays when -3 points
const cheersSound = new Audio('cheers.mp3'); // plays at end
const alertSound = new Audio('alert.mp3');   // plays when buttons are clicked

// Define square colors and fixed group assignments
const colors = ["#b000a4", "#3b00b4", "#00b405", "#848484", "#f5ff16", "#ffa802", "#f10606"];
const groupNames = ["A", "B", "C", "half", "D", "E", "F"];

const squareRow = document.getElementById("squareRow");

// REUSABLE LOGIC: Moving an image onto a Colored Square
function handleDropOnSquare(square) {
  if (!draggedImg) return;

  const existingImg = square.querySelector("img");

  // Prevent replacing a locked image
  if (existingImg && existingImg.classList.contains("locked")) {
    console.log("Drop blocked: can't replace a locked image.");
    return;
  }

  // Handle swap logic
  if (existingImg && draggedImg !== existingImg) {
    const fromImageRow = draggedImg.parentElement.id === "imageRow";
    if (fromImageRow) {
      const originalParent = draggedImg.parentElement;
      originalParent.appendChild(existingImg);
    } else {
      const imageRow = document.getElementById("imageRow");
      existingImg.classList.remove("locked");
      existingImg.setAttribute("draggable", "true");
      existingImg.style.position = "";
      existingImg.style.left = "";
      existingImg.style.top = "";
      existingImg.style.margin = "";
      existingImg.style.display = "";
      imageRow.appendChild(existingImg);

      // Decrease correct count if removing a correct image
      if (existingImg.dataset.correctGroup === square.dataset.group) {
        correctPlacements--;
      }
    }
  }

  // Place the dragged image
  square.innerHTML = "";
  square.appendChild(draggedImg);

  // Style it
  draggedImg.style.position = "relative";
  draggedImg.style.left = "0";
  draggedImg.style.top = "0";
  draggedImg.style.margin = "auto";
  draggedImg.style.display = "block";

  const correctGroup = draggedImg.dataset.correctGroup;
  const squareGroup = square.dataset.group;

  if (correctGroup === squareGroup) {
    count += 10;
    dingSound.currentTime = 0;
    dingSound.play();
    draggedImg.classList.add("locked");
    draggedImg.setAttribute("draggable", "false");
    correctPlacements++;

    if (correctPlacements === 7) {
      clearInterval(countdownInterval);
      console.log("✅ All images placed correctly. Timer stopped.");
      showSuccessMessage();
    }
  } else {
    count -= 3;
    noWantSound.currentTime = 0;
    noWantSound.play();
  }

  updateCounter();
}

// REUSABLE LOGIC: Returning an image back to the main Image Row
function handleDropOnImageRow() {
  if (!draggedImg) return;

  console.log("Dropped back into imageRow:", draggedImg);
  const imageRow = document.getElementById("imageRow");
  imageRow.appendChild(draggedImg);

  // Reset styles and re-enable dragging
  draggedImg.style.position = "";
  draggedImg.style.left = "";
  draggedImg.style.top = "";
  draggedImg.style.margin = "";
  draggedImg.style.display = "";
  draggedImg.classList.remove("locked");
  draggedImg.setAttribute("draggable", "true");
}

// Append squares with desktop drop handlers
colors.forEach((color, index) => {
  const square = document.createElement("div");
  square.style.backgroundColor = color;
  square.classList.add("square");
  square.dataset.group = groupNames[index];

  // Allow squares to receive drops (Desktop Mouse)
  square.addEventListener("dragover", e => e.preventDefault());
  square.addEventListener("drop", e => {
    e.preventDefault();
    handleDropOnSquare(square);
  });

  squareRow.appendChild(square);
});

// INPUT CONTROLLER: Binds both Drag and Touch events to images
function bindImageEvents(img) {
  // --- DESKTOP MOUSE EVENTS ---
  img.addEventListener("dragstart", e => {
    draggedImg = img;
    e.dataTransfer.setData("text/plain", "");
  });

  // --- TOUCH SCREEN SYSTEM ---
  let touchOffsetX = 0;
  let touchOffsetY = 0;

  img.addEventListener("touchstart", function (event) {
    // If image has already been locked into place, ignore touch events
    if (img.classList.contains("locked")) return;

    draggedImg = event.target;

    const rect = draggedImg.getBoundingClientRect();
    const touch = event.touches[0];

    // Measure where the user's finger actually touched inside the image boundaries
    touchOffsetX = touch.clientX - rect.left;
    touchOffsetY = touch.clientY - rect.top;

    draggedImg.style.opacity = "0.5";
    draggedImg.style.position = "fixed";
    draggedImg.style.zIndex = "1000";
    
    // Explicitly lock dimensions so it doesn't distort or shrink when lifted
    draggedImg.style.width = rect.width + "px";
    draggedImg.style.height = rect.height + "px";

    draggedImg.style.left = (touch.clientX - touchOffsetX) + "px";
    draggedImg.style.top = (touch.clientY - touchOffsetY) + "px";
  });

  img.addEventListener("touchmove", function (event) {
    if (!draggedImg) return;
    event.preventDefault(); // Lock browser page-bouncing and scrolling

    const touch = event.touches[0];
    draggedImg.style.left = (touch.clientX - touchOffsetX) + "px";
    draggedImg.style.top = (touch.clientY - touchOffsetY) + "px";
  }, { passive: false });

  img.addEventListener("touchend", function (event) {
    if (!draggedImg) return;

    // Reset layout rules so item can nest inside standard layout rows smoothly again
    draggedImg.style.position = "";
    draggedImg.style.zIndex = "";
    draggedImg.style.left = "";
    draggedImg.style.top = "";
    draggedImg.style.width = "";
    draggedImg.style.height = "";

    const touch = event.changedTouches[0];

    // Clear element collision tracking temporarily to see what's directly underneath
    draggedImg.style.pointerEvents = "none";
    let elementAtPoint = document.elementFromPoint(touch.clientX, touch.clientY);
    draggedImg.style.pointerEvents = "";

    let dropTarget = null;
    if (elementAtPoint) {
      // Find out if we are over a game square, or the origin row container
      dropTarget = elementAtPoint.closest(".square") || elementAtPoint.closest("#imageRow");
    }

    // Execute matching rule engines based on target detected
    if (dropTarget) {
      if (dropTarget.classList.contains("square")) {
        handleDropOnSquare(dropTarget);
      } else if (dropTarget.id === "imageRow") {
        handleDropOnImageRow();
      }
    }

    // Reset visibility tracking cleanly
    if (draggedImg) {
      draggedImg.style.opacity = "1";
      draggedImg = null;
    }
  });
}

// Display SUCCESS message
function showSuccessMessage() {
  cheersSound.currentTime = 0;
  cheersSound.play();

  const pauseBtn = document.getElementById("pauseBtn");
  if (pauseBtn) {
    pauseBtn.disabled = true; 
  }

  const imageRow = document.getElementById("imageRow");
  imageRow.innerHTML = "";

  const successMsg = document.createElement("div");
  successMsg.textContent = "SUCCESS!";
  successMsg.style.color = "#bfff91";
  successMsg.style.backgroundColor = "hotpink";
  successMsg.style.padding = ".05rem";
  successMsg.style.borderRadius = "1rem";
  successMsg.style.fontSize = "clamp(4rem, 10vw, 10rem)";
  successMsg.style.fontWeight = "bold";
  successMsg.style.textAlign = "center";
  successMsg.style.width = "100%";
  successMsg.style.boxSizing = "border-box";

  imageRow.appendChild(successMsg);
}

// Reset game with confirmation
function reset() {
  alertSound.play();
  if (confirm("Are you sure you want to reset?")) {
    window.location.href = "index.html";    
  }
}

let isPaused = false;

// Pause the game
function pause() {
  alertSound.play();
  if (isPaused || gameOver) return; 
  isPaused = true;
  clearInterval(countdownInterval);

  const overlay = document.createElement("div");
  overlay.id = "pauseOverlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.backgroundColor = "#bfff91";
  overlay.style.color = "hotpink";
  overlay.style.display = "flex";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.textAlign = "center";
  overlay.style.zIndex = "9999";
  overlay.style.fontSize = "clamp(3rem, 8vw, 8rem)";
  overlay.style.fontWeight = "bold";
  overlay.textContent = "THE GAME HAS BEEN PAUSED, PLEASE PRESS ANYWHERE TO UNPAUSE.";

  document.body.appendChild(overlay);
  overlay.addEventListener("click", () => {
    document.body.removeChild(overlay);
    resumeCountdown();
  });
}

// Resume the timer
function resumeCountdown() {
  if (!isPaused || gameOver) return; 
  isPaused = false;

  countdownInterval = setInterval(() => {
    count -= 0.01;
    if (count <= 0) {
      count = 0;
      clearInterval(countdownInterval);
    }
    updateCounter();
  }, 100);
}

// Load random images from images.json
fetch('images.json')
  .then(response => response.json())
  .then(data => {
    const imageRow = document.getElementById("imageRow");
    const groups = data.game2.groups;

    const selectedImages = groups.map(group => {
      const sets = group.sets;
      const randomSet = sets[Math.floor(Math.random() * sets.length)];
      const randomItem = randomSet.items[Math.floor(Math.random() * randomSet.items.length)];
      return {
        src: randomItem.image,
        correctGroup: group.groupId
      };
    });

    // Shuffle images
    for (let i = selectedImages.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [selectedImages[i], selectedImages[j]] = [selectedImages[j], selectedImages[i]];
    }

    // Create and display image elements
    selectedImages.forEach(({ src, correctGroup }) => {
      const img = document.createElement("img");
      img.src = src;
      img.alt = "Draggable image";
      img.classList.add("group-image");
      img.setAttribute("draggable", "true");
      img.dataset.correctGroup = correctGroup;

      // Wire up both drag and touch handlers on image initialization!
      bindImageEvents(img);

      imageRow.appendChild(img);
    });
  })
  .catch(err => console.error("Failed to load images:", err));

// Allow dropping images back to imageRow via desktop mouse
const imageRow = document.getElementById("imageRow");
imageRow.addEventListener("dragover", e => e.preventDefault());
imageRow.addEventListener("drop", e => {
  e.preventDefault();
  handleDropOnImageRow();
});
