(() => {
  const { createEquation } = window.NumberRunEquations;
  const { createRandom } = window.NumberRunRandom;
  const { createRenderer } = window.NumberRunRenderer;

  const canvas = document.querySelector("#game");
  const renderer = createRenderer(canvas);
  const overlay = document.querySelector("#overlay");
  const playButton = document.querySelector("#play");
  const paceButtons = [...document.querySelectorAll(".pace-option")];

  const ui = {
    best: document.querySelector("#best"),
    copy: document.querySelector("#copy"),
    distance: document.querySelector("#distance"),
    eyebrow: document.querySelector("#eyebrow"),
    level: document.querySelector("#level"),
    question: document.querySelector("#question"),
    result: document.querySelector("#result"),
    score: document.querySelector("#score"),
    title: document.querySelector("#title"),
  };

  const GATE_COLLISION_DISTANCE = 230;
  const GATE_TRAVEL_DISTANCE = 700;

  const game = {
    state: "ready",
    distance: 0,
    score: 0,
    streak: 0,
    gateCount: 0,
    lane: 1,
    paceSeconds: 7,
    speed: 100,
    flash: 0,
    shake: 0,
    gates: [],
    random: createRandom(),
    bestDistance: loadBestDistance(),
  };

  let previousFrame = 0;
  let animationFrame = 0;
  let touchStartX = null;

  showBestDistance();
  setupPaceButtons();
  setupControls();
  drawIdleScene();

  function setupPaceButtons() {
    for (const button of paceButtons) {
      button.addEventListener("click", () => {
        game.paceSeconds = Number(button.dataset.seconds);

        for (const option of paceButtons) {
          const isSelected = option === button;
          option.classList.toggle("active", isSelected);
          option.setAttribute("aria-pressed", String(isSelected));
        }
      });
    }
  }

  function setupControls() {
    playButton.addEventListener("click", startRun);

    window.addEventListener("keydown", handleKeyDown, { passive: false });
    canvas.addEventListener("touchstart", handleTouchStart, { passive: true });
    canvas.addEventListener("touchend", handleTouchEnd, { passive: true });
  }

  function handleKeyDown(event) {
    const movementKeys = ["ArrowLeft", "ArrowRight", "a", "A", "d", "D", " "];

    if (movementKeys.includes(event.key)) {
      event.preventDefault();
    }

    if (game.state !== "playing" && (event.key === "Enter" || event.key === " ")) {
      startRun();
      return;
    }

    if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
      changeLane(-1);
    }

    if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
      changeLane(1);
    }
  }

  function handleTouchStart(event) {
    touchStartX = event.changedTouches[0].clientX;
  }

  function handleTouchEnd(event) {
    if (touchStartX === null) return;

    const swipeDistance = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(swipeDistance) > 24) {
      changeLane(swipeDistance < 0 ? -1 : 1);
    }

    touchStartX = null;
  }

  function changeLane(direction) {
    if (game.state !== "playing") return;

    game.lane = Math.max(0, Math.min(2, game.lane + direction));
  }

  function startRun() {
    resetRun();
    game.state = "playing";
    overlay.classList.add("hidden");

    previousFrame = performance.now();
    cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(frame);
  }

  function resetRun() {
    game.distance = 0;
    game.score = 0;
    game.streak = 0;
    game.gateCount = 0;
    game.lane = 1;
    game.speed = GATE_TRAVEL_DISTANCE / game.paceSeconds;
    game.flash = 0;
    game.shake = 0;
    game.gates = [];
    game.random = createRandom();

    const firstGate = createNextGate();
    firstGate.z = GATE_COLLISION_DISTANCE + GATE_TRAVEL_DISTANCE;
    game.gates.push(firstGate);

    ui.score.textContent = "0";
    ui.distance.textContent = "0";
    ui.question.innerHTML = `${firstGate.problem} <b>= ?</b>`;
    ui.level.textContent = "GATE 1 · WARM UP";
    ui.result.hidden = true;
  }

  function createNextGate() {
    const equation = createEquation(game.random, game.gateCount);
    game.gateCount += 1;

    return {
      z: 0,
      problem: equation.problem,
      solution: equation.solution,
      choices: equation.choices,
      chosen: false,
      selected: null,
    };
  }

  function frame(now) {
    if (game.state !== "playing") return;

    const deltaTime = Math.min(0.04, (now - previousFrame) / 1000 || 0);
    previousFrame = now;

    updateRun(deltaTime);
    renderer.draw({
      distance: game.distance,
      gates: game.gates,
      lane: game.lane,
      state: game.state,
      dt: deltaTime,
      flash: game.flash,
      shake: game.shake,
    });

    if (game.state === "playing") {
      animationFrame = requestAnimationFrame(frame);
    }
  }

  function updateRun(deltaTime) {
    game.distance += game.speed * deltaTime * 0.12;
    checkForNewRecord();

    for (const gate of [...game.gates]) {
      gate.z -= game.speed * deltaTime;

      if (gate.z <= GATE_COLLISION_DISTANCE && !gate.chosen) {
        chooseGate(gate);
      }
    }

    game.gates = game.gates.filter((gate) => gate.z > -90);
    game.flash = Math.max(0, game.flash - deltaTime);
    game.shake = Math.max(0, game.shake - deltaTime * 28);

    ui.distance.textContent = String(Math.floor(game.distance));
    ui.level.textContent = `GATE ${game.streak + 1} · ${game.streak ? `STREAK ${game.streak}` : "WARM UP"}`;
  }

  function checkForNewRecord() {
    const distanceRecord = Math.floor(game.distance);
    if (distanceRecord <= game.bestDistance) return;

    game.bestDistance = distanceRecord;
    saveBestDistance();
    showBestDistance();
  }

  function chooseGate(gate) {
    gate.chosen = true;
    gate.selected = game.lane;

    const answer = gate.choices[game.lane];
    if (!answer.correct) {
      endRun(gate.solution);
      return;
    }

    game.streak += 1;
    game.score += 100 + game.streak * 25;
    game.flash = 0.16;
    ui.score.textContent = game.score.toLocaleString();

    renderer.burstAtLane(game.lane);
    game.gates = game.gates.filter((activeGate) => activeGate !== gate);

    const nextGate = createNextGate();
    nextGate.z = GATE_COLLISION_DISTANCE + GATE_TRAVEL_DISTANCE;
    game.gates.push(nextGate);
    ui.question.innerHTML = `${nextGate.problem} <b>= ?</b>`;
  }

  function endRun(correctEquation) {
    game.state = "over";
    game.shake = 10;
    game.bestDistance = Math.max(game.bestDistance, Math.floor(game.distance));

    saveBestDistance();
    showBestDistance();

    ui.eyebrow.textContent = "Wrong gate";
    ui.title.innerHTML = "Run it<br><span>back.</span>";
    ui.copy.textContent = `The correct choice was ${correctEquation}. Build a longer streak next run.`;
    ui.result.hidden = false;
    ui.result.textContent = `${game.score.toLocaleString()} points · ${Math.floor(game.distance)} m · streak ${game.streak}`;
    playButton.innerHTML = 'RUN AGAIN <span aria-hidden="true">↗</span>';

    window.setTimeout(() => overlay.classList.remove("hidden"), 220);
  }

  function showBestDistance() {
    ui.best.innerHTML = `${game.bestDistance} <small>m</small>`;
  }

  function loadBestDistance() {
    try {
      return Number(localStorage.getItem("numberRunBest") || 0);
    } catch {
      return 0;
    }
  }

  function saveBestDistance() {
    try {
      localStorage.setItem("numberRunBest", String(game.bestDistance));
    } catch {
      // The game still works if browser storage is unavailable.
    }
  }

  function drawIdleScene() {
    renderer.draw({
      distance: 0,
      gates: [],
      lane: game.lane,
      state: game.state,
      dt: 0,
      flash: 0,
      shake: 0,
    });
  }
})();
