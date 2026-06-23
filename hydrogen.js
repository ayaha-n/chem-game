const hydrogenScenario = new ExperimentScenario({
  id: "hydrogen",
  title: "水素発生実験",
  initialScore: 100,
  steps: [
    {
      id: "vessel",
      title: "実験器具を選ぶ",
      prompt: "金属と液体を反応させる器具を選ぼう。",
      options: [
        { value: "test-tube", label: "試験管", observation: "試験管をスタンドに固定しました。" },
        { value: "beaker", label: "ビーカー", penalty: 10, observation: "口が広く、発生した気体が周囲へ逃げています。" },
        { value: "sealed", label: "密閉容器", hazard: "sealed", observation: "ふたの閉じた容器を装置に置きました。" }
      ]
    },
    {
      id: "metal",
      title: "金属を選ぶ",
      prompt: "希塩酸と反応させる金属を選ぼう。",
      options: [
        { value: "zinc", label: "亜鉛", observation: "金属を器具の中へ入れました。" },
        { value: "magnesium", label: "マグネシウム", penalty: 15, observation: "金属を入れると、反応の準備ができました。" },
        { value: "copper", label: "銅", penalty: 15, observation: "金属を器具の中へ入れました。" }
      ]
    },
    {
      id: "acid",
      title: "液体を加える",
      prompt: "金属に加える液体を選ぼう。",
      options: [
        { value: "acid", label: "希塩酸", observation: "金属の表面から泡が出始めました。" },
        { value: "water", label: "水", penalty: 20, observation: "液体を加えましたが、目立った変化はありません。" }
      ]
    },
    {
      id: "timing",
      title: "いつから気体を集める？",
      prompt: "発生装置から出てくる気体を、いつ集め始める？",
      options: [
        { value: "immediate", label: "発生直後から集める", observation: "最初に出てきた気体も、そのまま集気びんへ入りました。" },
        { value: "wait", label: "少し待ってから集める", observation: "最初の気体を逃がしてから、集め始めました。" }
      ]
    },
    {
      id: "amount",
      title: "集める量を選ぶ",
      prompt: "確認に使う気体を、どのくらい集める？",
      options: [
        { value: "little", label: "少しだけ", penalty: 10, observation: "集気びんの一部に気体がたまりました。" },
        { value: "half", label: "半分くらい", observation: "集気びんの半分ほどまで気体がたまりました。" },
        { value: "full", label: "いっぱい", penalty: 10, observation: "集気びんの上まで気体を集めました。" }
      ]
    },
    {
      id: "test",
      title: "気体を調べる",
      prompt: "集めた気体の性質を確かめよう。",
      options: [
        { value: "match", label: "マッチを近づける", observation: "火のついたマッチを集気びんへ近づけます。" }
      ]
    }
  ]
});

experimentApp.register("heating", document.querySelector("#heating-game"));
experimentApp.register("hydrogen", document.querySelector("#hydrogen-game"));

const hydrogenForm = document.querySelector("#hydrogen-form");
const hydrogenQuestionArea = document.querySelector("#hydrogen-question-area");
const hydrogenStepTitle = document.querySelector("#hydrogen-step-title");
const hydrogenStepNumber = document.querySelector("#hydrogen-step-number");
const hydrogenProgressBar = document.querySelector("#hydrogen-progress-bar");
const hydrogenScore = document.querySelector("#hydrogen-score");
const hydrogenBack = document.querySelector("#hydrogen-back");
const hydrogenNext = document.querySelector("#hydrogen-next");
const hydrogenObservation = document.querySelector("#hydrogen-observation");
const hydrogenObservationText = document.querySelector("#hydrogen-observation-text");
const hydrogenScene = document.querySelector("#hydrogen-scene");
const hydrogenStatus = document.querySelector("#hydrogen-status");
const hydrogenHint = document.querySelector("#hydrogen-hint");
const reactionVessel = document.querySelector("#reaction-vessel");
const collectedGas = document.querySelector("#collected-gas");
const hydrogenOverlay = document.querySelector("#hydrogen-result-overlay");
const hydrogenResultCard = document.querySelector("#hydrogen-result-card");
const hydrogenRetry = document.querySelector("#hydrogen-retry");
const hydrogenResultMenu = document.querySelector("#hydrogen-result-menu");

const hydrogenState = {
  step: 0,
  score: hydrogenScenario.initialScore,
  choices: {},
  history: [],
  airMixed: false,
  gasGenerated: false,
  awaitingContinue: false,
  locked: false,
  gameOver: false
};

function getHydrogenOption(stepId, value) {
  const step = hydrogenScenario.steps.find((item) => item.id === stepId);
  return step.options.find((option) => option.value === value);
}

function renderHydrogenStep() {
  const step = hydrogenScenario.steps[hydrogenState.step];
  const selected = hydrogenState.choices[step.id];

  hydrogenStepTitle.textContent = step.title;
  hydrogenStepNumber.textContent = hydrogenState.step + 1;
  hydrogenProgressBar.style.width = `${((hydrogenState.step + 1) / hydrogenScenario.steps.length) * 100}%`;
  hydrogenObservation.hidden = true;
  hydrogenState.awaitingContinue = false;

  hydrogenQuestionArea.innerHTML = `
    <fieldset class="hydrogen-question">
      <legend><span>${String(hydrogenState.step + 1).padStart(2, "0")}</span> ${step.title}</legend>
      <p class="question-guide">${step.prompt}</p>
      <div class="hydrogen-option-grid ${step.options.length === 3 ? "three" : ""}">
        ${step.options.map((option) => `
          <label class="option-card">
            <input type="radio" name="hydrogen-choice" value="${option.value}" ${selected === option.value ? "checked" : ""}>
            <span>${option.label}</span>
          </label>
        `).join("")}
      </div>
    </fieldset>
  `;

  hydrogenBack.disabled = hydrogenState.step === 0 || hydrogenState.locked;
  hydrogenNext.disabled = !selected;
  hydrogenNext.innerHTML = hydrogenState.step === 5
    ? `マッチを近づける <span aria-hidden="true">→</span>`
    : `操作する <span aria-hidden="true">→</span>`;
}

function updateHydrogenScore() {
  hydrogenScore.textContent = hydrogenState.score;
  hydrogenScore.classList.remove("score-hit");
  void hydrogenScore.offsetWidth;
  hydrogenScore.classList.add("score-hit");
}

function applyVesselVisual(value) {
  reactionVessel.className = "selected-vessel";
  if (value === "beaker") reactionVessel.classList.add("beaker-vessel");
  else if (value === "sealed") reactionVessel.classList.add("sealed-vessel");
  else reactionVessel.classList.add("test-tube-vessel");
}

function applyPersistentScene() {
  const { vessel, metal, acid, timing, amount } = hydrogenState.choices;
  applyVesselVisual(vessel || "test-tube");
  hydrogenScene.className = "hydrogen-scene";
  if (metal) hydrogenScene.classList.add(`metal-${metal}`);
  if (acid === "acid" && metal !== "copper") hydrogenScene.classList.add("has-reaction");
  if (acid === "acid" && metal === "magnesium") hydrogenScene.classList.add("vigorous-reaction");
  if (timing && hydrogenState.gasGenerated) hydrogenScene.classList.add("collecting");
  if (timing === "immediate") hydrogenScene.classList.add("air-mixed");
  collectedGas.className = "collected-gas";
  if (amount && hydrogenState.gasGenerated) collectedGas.classList.add(`gas-${amount}`);
}

function lockHydrogenControls(locked) {
  hydrogenState.locked = locked;
  hydrogenForm.querySelectorAll("input, button").forEach((control) => {
    control.disabled = locked;
  });
}

function showHydrogenObservation(text) {
  hydrogenObservationText.textContent = text;
  hydrogenObservation.hidden = false;
}

function recordHydrogenChoice(step, option) {
  const currentIndex = hydrogenScenario.steps.findIndex((item) => item.id === step.id);
  const removedEntries = hydrogenState.history.filter((entry) => {
    const entryIndex = hydrogenScenario.steps.findIndex((item) => item.id === entry.stepId);
    return entryIndex >= currentIndex;
  });
  hydrogenState.score += removedEntries.reduce((sum, entry) => sum + entry.penalty, 0);
  hydrogenState.history = hydrogenState.history.filter((entry) => {
    const entryIndex = hydrogenScenario.steps.findIndex((item) => item.id === entry.stepId);
    return entryIndex < currentIndex;
  });
  hydrogenScenario.steps.slice(currentIndex).forEach((futureStep) => {
    delete hydrogenState.choices[futureStep.id];
  });

  const penalty = option.penalty || 0;
  hydrogenState.score = Math.max(0, hydrogenState.score - penalty);
  hydrogenState.choices[step.id] = option.value;
  hydrogenState.history.push({
    stepId: step.id,
    stepTitle: step.title,
    choice: option.label,
    penalty,
    note: option.observation
  });
  syncHydrogenFlags();
  updateHydrogenScore();
}

function syncHydrogenFlags() {
  hydrogenState.gasGenerated = hydrogenState.choices.acid === "acid"
    && hydrogenState.choices.metal !== "copper";
  hydrogenState.airMixed = hydrogenState.choices.timing === "immediate";
}

function animateHydrogenStep(step, option) {
  applyPersistentScene();
  hydrogenStatus.textContent = "OBSERVING...";
  hydrogenHint.textContent = "装置の変化を観察しよう。";

  if (step.id === "vessel") {
    applyVesselVisual(option.value);
  }

  if (step.id === "metal") {
    hydrogenScene.classList.add(`adding-${option.value}`);
  }

  if (step.id === "acid") {
    const metal = hydrogenState.choices.metal;
    if (option.value === "acid" && metal !== "copper") {
      hydrogenState.gasGenerated = true;
      hydrogenScene.classList.add("has-reaction");
      if (metal === "magnesium") hydrogenScene.classList.add("vigorous-reaction");
    } else {
      hydrogenState.gasGenerated = false;
      hydrogenScene.classList.add("no-reaction");
    }
  }

  if (step.id === "timing") {
    hydrogenState.airMixed = option.value === "immediate";
    if (hydrogenState.gasGenerated) hydrogenScene.classList.add("collecting");
    if (hydrogenState.airMixed) hydrogenScene.classList.add("air-mixed");
  }

  if (step.id === "amount") {
    if (hydrogenState.gasGenerated) {
      collectedGas.className = `collected-gas gas-${option.value}`;
      hydrogenScene.classList.add("gas-filling");
    }
  }
}

function getActualObservation(step, option) {
  if ((step.id === "timing" || step.id === "amount") && !hydrogenState.gasGenerated) {
    return "装置から気体が出てこないため、集気びんにも気体はたまりません。";
  }
  return option.observation;
}

function pressureAccident() {
  hydrogenScene.classList.add("pressure-rising", "danger");
  hydrogenStatus.textContent = "DANGER";
  hydrogenHint.textContent = "密閉容器の内部圧力が上がっています！";

  window.setTimeout(() => {
    hydrogenScene.classList.add("pressure-burst", "screen-shake");
    hydrogenHint.textContent = "容器が破裂しました！";
  }, 1300);

  window.setTimeout(() => {
    showHydrogenResult({
      gameOver: true,
      type: "pressure",
      what: "密閉容器が破裂した。",
      why: "発生した水素に出口がなく、容器内にたまり続けて圧力が上がったためです。",
      lesson: "気体を発生させる装置は密閉しません。気体の通り道が確保されているか、実験前に確認します。"
    });
  }, 2800);
}

function testCollectedGas() {
  applyPersistentScene();
  hydrogenScene.classList.add("testing-gas");
  hydrogenStatus.textContent = "TESTING...";
  hydrogenHint.textContent = "マッチの火を気体へ近づけています。";

  window.setTimeout(() => {
    if (hydrogenState.airMixed && hydrogenState.gasGenerated) {
      hydrogenScene.classList.add("hydrogen-explosion", "screen-shake", "danger");
      hydrogenStatus.textContent = "EXPLOSION";
      hydrogenHint.textContent = "爆鳴気が発生し、試験管が破損しました！";

      window.setTimeout(() => {
        showHydrogenResult({
          gameOver: true,
          type: "explosion",
          what: "爆鳴気が発生し、試験管が破損した。",
          why: "発生直後の気体には装置内の空気が混ざり、水素と酸素の混合気体になっていたためです。",
          lesson: "水素を集めるときは、最初に出てくる気体をすぐに使わず、装置内の空気を追い出してから集めます。"
        });
      }, 1900);
      return;
    }

    if (!hydrogenState.gasGenerated) {
      hydrogenScene.classList.add("no-pop");
      hydrogenStatus.textContent = "NO REACTION";
      hydrogenHint.textContent = "火を近づけても、音や変化はありませんでした。";
    } else {
      hydrogenScene.classList.add("safe-pop");
      hydrogenStatus.textContent = "POP!";
      hydrogenHint.textContent = "小さく「ポン」と音がしました。";
    }

    window.setTimeout(() => showHydrogenResult({ gameOver: false }), 1600);
  }, 1100);
}

function performHydrogenChoice() {
  if (hydrogenState.awaitingContinue) {
    hydrogenState.step += 1;
    hydrogenStatus.textContent = "READY";
    hydrogenHint.textContent = "次の操作を選ぼう。";
    applyPersistentScene();
    renderHydrogenStep();
    return;
  }

  const input = hydrogenQuestionArea.querySelector("input:checked");
  if (!input || hydrogenState.locked) return;

  const step = hydrogenScenario.steps[hydrogenState.step];
  const option = getHydrogenOption(step.id, input.value);
  recordHydrogenChoice(step, option);
  lockHydrogenControls(true);
  animateHydrogenStep(step, option);

  if (
    step.id === "acid"
    && hydrogenState.choices.vessel === "sealed"
    && hydrogenState.gasGenerated
  ) {
    pressureAccident();
    return;
  }

  if (step.id === "test") {
    testCollectedGas();
    return;
  }

  window.setTimeout(() => {
    lockHydrogenControls(false);
    showHydrogenObservation(getActualObservation(step, option));
    hydrogenState.awaitingContinue = true;
    hydrogenNext.disabled = false;
    hydrogenNext.innerHTML = `次のステップへ <span aria-hidden="true">→</span>`;
    hydrogenBack.disabled = true;
    hydrogenStatus.textContent = "OBSERVED";
  }, 1400);
}

function buildReviewList() {
  const list = document.querySelector("#hydrogen-choice-list");
  list.innerHTML = hydrogenState.history.map((entry) => `
    <li class="${entry.penalty ? "review-warning" : "review-safe"}">
      <span>${entry.stepTitle}</span>
      <strong>${entry.choice}</strong>
      <small>${entry.penalty ? `−${entry.penalty}点` : "減点なし"}</small>
      ${entry.penalty ? `<p>${getPenaltyExplanation(entry.stepId, hydrogenState.choices[entry.stepId])}</p>` : ""}
    </li>
  `).join("");
}

function getPenaltyExplanation(stepId, value) {
  const explanations = {
    "vessel:beaker": "口が広く、気体を導いて集める器具として扱いにくい選択です。",
    "metal:magnesium": "希塩酸との反応が激しくなりやすく、気体の発生量を制御しにくくなります。",
    "metal:copper": "銅は希塩酸とはほとんど反応せず、水素を発生させられません。",
    "acid:water": "常温の水では、選んだ金属から水素を十分に発生させられません。",
    "amount:little": "量が少なすぎると、気体の性質を確認しにくくなります。",
    "amount:full": "必要以上に集めると、扱う可燃性気体の量が増えます。"
  };
  return explanations[`${stepId}:${value}`] || "";
}

function showHydrogenResult(result) {
  hydrogenState.gameOver = result.gameOver;
  if (result.gameOver) {
    hydrogenState.score = 0;
    updateHydrogenScore();
  }
  hydrogenOverlay.hidden = false;
  hydrogenOverlay.setAttribute("aria-hidden", "false");
  hydrogenResultCard.classList.toggle("game-over", result.gameOver);
  document.querySelector("#hydrogen-result-kicker").textContent = result.gameOver ? "GAME OVER" : "MISSION REVIEW";
  document.querySelector("#hydrogen-result-title").textContent = result.gameOver ? "事故が発生しました" : "実験の振り返り";
  document.querySelector("#hydrogen-final-score").textContent = hydrogenState.score;
  document.querySelector("#hydrogen-result-summary").textContent = result.gameOver
    ? "危険な操作により、実験を続けられなくなりました。原因を確認して、もう一度挑戦しよう。"
    : hydrogenState.gasGenerated
      ? "水素の性質を確認できました。選んだ操作と安全性を振り返ろう。"
      : "事故は起きませんでしたが、水素を発生・確認できませんでした。選択を振り返ろう。";

  const accident = document.querySelector("#accident-explanation");
  accident.hidden = !result.gameOver;
  if (result.gameOver) {
    document.querySelector("#hydrogen-what").textContent = result.what;
    document.querySelector("#hydrogen-why").textContent = result.why;
    document.querySelector("#hydrogen-lesson").textContent = result.lesson;
  }

  buildReviewList();
  const mistake = hydrogenState.history.find((entry) => entry.penalty);
  const stat = mistake
    ? 28 + ((hydrogenState.history.length * 7 + hydrogenState.score) % 35)
    : 14;
  document.querySelector("#hydrogen-stat").textContent = mistake
    ? `${stat}%の人が「${mistake.choice}」で同じミスをしました（練習用データ）`
    : `${stat}%の人がすべて安全な操作を選べました（練習用データ）`;
}

function resetHydrogenGame() {
  Object.assign(hydrogenState, {
    step: 0,
    score: hydrogenScenario.initialScore,
    choices: {},
    history: [],
    airMixed: false,
    gasGenerated: false,
    awaitingContinue: false,
    locked: false,
    gameOver: false
  });

  hydrogenOverlay.hidden = true;
  hydrogenOverlay.setAttribute("aria-hidden", "true");
  hydrogenScore.textContent = hydrogenScenario.initialScore;
  hydrogenStatus.textContent = "SETUP";
  hydrogenHint.textContent = "器具を選んで実験を始めよう。";
  collectedGas.className = "collected-gas";
  applyPersistentScene();
  renderHydrogenStep();
}

hydrogenQuestionArea.addEventListener("change", (event) => {
  if (event.target.name !== "hydrogen-choice") return;
  hydrogenNext.disabled = false;
});

hydrogenNext.addEventListener("click", performHydrogenChoice);

hydrogenBack.addEventListener("click", () => {
  if (hydrogenState.step === 0 || hydrogenState.locked) return;
  hydrogenState.step -= 1;
  syncHydrogenFlags();
  applyPersistentScene();
  renderHydrogenStep();
});

hydrogenRetry.addEventListener("click", resetHydrogenGame);
hydrogenResultMenu.addEventListener("click", () => {
  resetHydrogenGame();
  experimentApp.openMenu();
});

resetHydrogenGame();
