const form = document.querySelector("#experiment-form");
const overlay = document.querySelector("#result-overlay");
const resultCard = document.querySelector("#result-card");
const closeButton = document.querySelector("#close-result");
const retryButton = document.querySelector("#retry-button");
const scene = document.querySelector("#stage-scene");
const apparatus = document.querySelector("#apparatus");
const liquid = document.querySelector("#liquid");
const stageStatus = document.querySelector("#stage-status");
const stageHint = document.querySelector("#stage-hint");
const questionSteps = [...document.querySelectorAll(".question-step")];
const currentStepNumber = document.querySelector("#current-step-number");
const progressBar = document.querySelector("#step-progress-bar");
const backButton = document.querySelector("#back-button");
const nextButton = document.querySelector("#next-button");
const startButton = document.querySelector("#start-button");
const actionButtonLabel = document.querySelector("#action-button-label");
const reflectionPanel = document.querySelector("#reflection-panel");
const reflectionLabel = document.querySelector("#reflection-label");
const reflectionTitle = document.querySelector("#reflection-title");
const reflectionText = document.querySelector("#reflection-text");
const reflectionButton = document.querySelector("#reflection-button");
let currentStep = 0;
let heatingDone = false;
let isAnimating = false;
let reflectionAction = null;

const resultContent = {
  success: {
    icon: "✓",
    kicker: "MISSION COMPLETE",
    title: "実験成功！",
    summary: "安全な手順で液体を加熱し、しっかり観察できました。",
    danger: "危険な条件はありませんでした。試験管の口を人に向けず、熱が一か所に集中しないように操作できています。",
    lesson: "液体は適量にし、試験管を動かしながら均一に加熱します。加熱後は試験管を自然に冷ますことが大切です。"
  },
  toward: {
    icon: "!",
    kicker: "SAFETY ALERT",
    title: "熱い液体が飛び散った！",
    summary: "突沸した液体が、試験管の口から人の方向へ飛び出しました。",
    danger: "試験管の口を人に向けると、急に沸騰した液体や蒸気が顔や体にかかり、やけどをする危険があります。",
    lesson: "加熱中の試験管の口は、自分にも周りの人にも絶対に向けません。のぞき込むことも避けます。"
  },
  fixed: {
    icon: "✕",
    kicker: "TUBE DAMAGE",
    title: "試験管が割れた！",
    summary: "一点だけが急激に熱くなり、温度差でガラスにひびが入りました。",
    danger: "同じ場所だけを加熱すると、その部分に熱が集中します。ガラス内の温度差が大きくなり、破損につながります。",
    lesson: "試験管は炎の中でゆっくり動かし、液体全体を均一に加熱します。"
  },
  high: {
    icon: "!",
    kicker: "OVERFLOW ALERT",
    title: "液体が吹きこぼれた！",
    summary: "液体が多すぎて、沸騰した液体が試験管の外へあふれました。",
    danger: "液体を入れすぎると、沸騰したときに液面が上がり、熱い液体が外へ飛び出す危険があります。",
    lesson: "試験管に入れる液体は多くても3分の1程度を目安にし、余裕をもたせます。"
  },
  rapid: {
    icon: "✕",
    kicker: "THERMAL SHOCK",
    title: "試験管が割れた！",
    summary: "熱い試験管を急に冷やしたため、急激な温度変化で破損しました。",
    danger: "熱いガラスを水などで急冷すると、内側と外側の温度差による熱応力で割れることがあります。",
    lesson: "加熱後の試験管は試験管立てなどに置き、触らずに自然冷却します。"
  },
  low: {
    icon: "?",
    kicker: "OBSERVATION FAILED",
    title: "よく観察できない…",
    summary: "事故は起きませんでしたが、液体が少なすぎて変化を十分に確認できませんでした。",
    danger: "量が少なすぎると短時間で加熱され、蒸発しやすくなります。目的の変化を見落とす可能性もあります。",
    lesson: "安全だけでなく、実験の目的に合う適量を使うことが、正確な観察につながります。"
  }
};

function getSelections() {
  const data = new FormData(form);
  return {
    amount: data.get("amount"),
    direction: data.get("direction"),
    heating: data.get("heating"),
    cooling: data.get("cooling")
  };
}

function updatePreview() {
  const choices = getSelections();
  liquid.className = `liquid ${choices.amount || ""}`;
  apparatus.classList.toggle("toward", choices.direction === "toward");
  if (!isAnimating && !reflectionAction) {
    stageHint.textContent = "選択した条件が実験装置に反映されています。";
  }
}

function syncStepActions() {
  const hasAnswer = Boolean(questionSteps[currentStep].querySelector("input:checked"));
  nextButton.disabled = !hasAnswer;
  startButton.disabled = !hasAnswer;
  if (currentStep >= 2 && !reflectionAction) {
    startButton.hidden = !hasAnswer;
  }
}

function showStep(step) {
  currentStep = Math.max(0, Math.min(step, questionSteps.length - 1));
  reflectionPanel.hidden = true;
  reflectionButton.hidden = true;
  reflectionAction = null;

  questionSteps.forEach((question, index) => {
    const isActive = index === currentStep;
    question.hidden = !isActive;
    question.classList.toggle("active", isActive);
  });

  currentStepNumber.textContent = currentStep + 1;
  progressBar.style.width = `${((currentStep + 1) / questionSteps.length) * 100}%`;
  backButton.hidden = false;
  backButton.disabled = currentStep === 0 || heatingDone || isAnimating;

  nextButton.hidden = currentStep >= 2;
  startButton.hidden = currentStep < 2;
  actionButtonLabel.textContent = currentStep === 2 ? "加熱する" : "冷却する";
  syncStepActions();

  const activeChoice = questionSteps[currentStep].querySelector("input:checked");
  if (activeChoice) activeChoice.focus({ preventScroll: true });
}

function chooseResult(choices) {
  // 重大な事故を優先して、一度のプレイでは最も重要な結果を示す。
  if (choices.direction === "toward") return "toward";
  if (choices.heating === "fixed") return "fixed";
  if (choices.amount === "high") return "high";
  if (choices.cooling === "water" || choices.cooling === "wet-cloth") return "rapid";
  if (choices.amount === "low") return "low";
  return "success";
}

function setControlsDisabled(disabled) {
  isAnimating = disabled;
  form.querySelectorAll("input, button").forEach((control) => {
    control.disabled = disabled;
  });
}

function resetScene() {
  scene.className = "stage-scene";
  apparatus.classList.toggle("toward", getSelections().direction === "toward");
}

function buildHeatingReflection(choices) {
  const notes = [];

  if (choices.amount === "high") {
    notes.push("液体が多く、泡が急に増えて吹きこぼれました。");
  } else if (choices.amount === "low") {
    notes.push("液体は穏やかに沸騰しましたが、量が少なく変化を観察しにくい状態でした。");
  } else {
    notes.push("液体の量には余裕があり、泡の様子を観察できました。");
  }

  if (choices.direction === "toward") {
    notes.push("試験管の口から飛んだ液体が人に当たる危険がありました。");
  }

  if (choices.heating === "fixed") {
    notes.push("一点に熱が集中し、ガラスが赤熱してヒビが入りました。");
  } else {
    notes.push("試験管を動かしたため、熱が一か所に集中しませんでした。");
  }

  const hasAccident = choices.amount === "high"
    || choices.direction === "toward"
    || choices.heating === "fixed";

  return {
    title: hasAccident ? "加熱中に危険な変化が起きました" : "加熱の様子を確認しました",
    text: notes.join("")
  };
}

function buildCoolingReflection(cooling) {
  if (cooling === "natural") {
    return {
      title: "試験管はゆっくり冷えました",
      text: "そのまま置くと温度が少しずつ下がるため、ガラスに急な温度差が生じにくくなります。"
    };
  }

  const method = cooling === "water" ? "水につけた" : "濡れ布を当てた";
  return {
    title: "急な温度変化で試験管が割れました",
    text: `熱い試験管を${method}ため、ガラスの内側と外側に大きな温度差が生じ、ヒビが広がりました。`
  };
}

function showReflection(phase, content, buttonText, action) {
  questionSteps.forEach((question) => {
    question.hidden = true;
    question.classList.remove("active");
  });

  reflectionLabel.textContent = phase === "heating" ? "加熱の振り返り" : "冷却の振り返り";
  reflectionTitle.textContent = content.title;
  reflectionText.textContent = content.text;
  reflectionPanel.hidden = false;
  reflectionButton.innerHTML = `${buttonText} <span aria-hidden="true">→</span>`;
  reflectionButton.hidden = false;
  reflectionAction = action;

  backButton.hidden = true;
  nextButton.hidden = true;
  startButton.hidden = true;
  reflectionButton.focus();
}

function runHeating() {
  const choices = getSelections();
  setControlsDisabled(true);
  resetScene();
  scene.classList.add("running", "heating");
  scene.classList.toggle("moving", choices.heating === "moving");

  const calmHeating = choices.amount !== "high"
    && choices.direction === "away"
    && choices.heating === "moving";
  scene.classList.toggle("calm", calmHeating);

  if (choices.amount === "high") {
    scene.classList.add("overheating", "overflowing");
  }

  if (choices.direction === "toward") {
    scene.classList.add("splashing", "person-hit");
  }

  if (choices.heating === "fixed") {
    scene.classList.add("hotspot");
    window.setTimeout(() => scene.classList.add("cracked"), 1100);
    if (choices.amount === "high" || choices.direction === "toward") {
      scene.classList.add("broken");
    }
  }

  stageStatus.textContent = "HEATING...";
  stageHint.textContent = "加熱中… 泡、試験管、人の様子を観察しよう。";

  window.setTimeout(() => {
    heatingDone = true;
    setControlsDisabled(false);
    stageStatus.textContent = calmHeating ? "HEATED" : "WARNING";
    showReflection(
      "heating",
      buildHeatingReflection(choices),
      "Step 4へ",
      () => {
        resetScene();
        scene.classList.add("heated");
        stageStatus.textContent = "HOT";
        stageHint.textContent = "加熱後の試験管です。冷却方法を選ぼう。";
        showStep(3);
      }
    );
  }, 3000);
}

function runCooling() {
  const choices = getSelections();
  setControlsDisabled(true);
  resetScene();
  scene.classList.add("cooling");
  stageStatus.textContent = "COOLING...";

  if (choices.cooling === "natural") {
    scene.classList.add("slow-cooling");
    stageHint.textContent = "試験管の温度がゆっくり下がっています。";
  } else {
    scene.classList.add(choices.cooling === "water" ? "water-cooling" : "cloth-cooling");
    scene.classList.add("cracked", "broken");
    stageHint.textContent = "急激な温度変化が起きています。";
  }

  window.setTimeout(() => {
    setControlsDisabled(false);
    stageStatus.textContent = choices.cooling === "natural" ? "COOLED" : "DAMAGE";
    showReflection(
      "cooling",
      buildCoolingReflection(choices.cooling),
      "最終結果を見る",
      () => showResult(chooseResult(choices))
    );
  }, 2800);
}

function showResult(type) {
  const content = resultContent[type];
  resultCard.classList.toggle("success", type === "success");
  document.querySelector("#result-icon").textContent = content.icon;
  document.querySelector("#result-kicker").textContent = content.kicker;
  document.querySelector("#result-title").textContent = content.title;
  document.querySelector("#result-summary").textContent = content.summary;
  document.querySelector("#danger-text").textContent = content.danger;
  document.querySelector("#lesson-text").textContent = content.lesson;

  overlay.classList.add("open");
  overlay.setAttribute("aria-hidden", "false");
  closeButton.focus();
}

function closeResult() {
  overlay.classList.remove("open");
  overlay.setAttribute("aria-hidden", "true");
  form.reset();
  heatingDone = false;
  isAnimating = false;
  reflectionAction = null;
  resetScene();
  updatePreview();
  stageStatus.textContent = "STANDBY";
  stageHint.textContent = "条件を選んで、実験を始めよう。";
  showStep(0);
  nextButton.focus();
}

form.addEventListener("change", () => {
  updatePreview();
  syncStepActions();
});

nextButton.addEventListener("click", () => {
  showStep(currentStep + 1);
});

backButton.addEventListener("click", () => {
  showStep(currentStep - 1);
});

reflectionButton.addEventListener("click", () => {
  if (reflectionAction) reflectionAction();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!questionSteps[currentStep].querySelector("input:checked")) return;

  if (currentStep === 2) {
    runHeating();
  } else if (currentStep === 3) {
    runCooling();
  }
});

closeButton.addEventListener("click", closeResult);
retryButton.addEventListener("click", closeResult);

overlay.addEventListener("click", (event) => {
  if (event.target === overlay) closeResult();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && overlay.classList.contains("open")) {
    closeResult();
  }
});

updatePreview();
showStep(0);
