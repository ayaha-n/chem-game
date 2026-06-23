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
  liquid.className = `liquid ${choices.amount}`;
  apparatus.classList.toggle("toward", choices.direction === "toward");
  stageHint.textContent = choices.direction === "toward"
    ? "注意：試験管の口が人の方向を向いています。"
    : "条件を選んで、実験を開始しよう。";
}

function chooseResult(choices) {
  // 重大な事故を優先して、一度のプレイでは最も重要な結果を示す。
  if (choices.direction === "toward") return "toward";
  if (choices.heating === "fixed") return "fixed";
  if (choices.amount === "high") return "high";
  if (choices.cooling === "rapid") return "rapid";
  if (choices.amount === "low") return "low";
  return "success";
}

function setSceneEffect(type, choices) {
  scene.className = "stage-scene running";
  scene.classList.toggle("moving", choices.heating === "moving");
  apparatus.classList.toggle("toward", choices.direction === "toward");

  if (type === "toward") scene.classList.add("splashing");
  if (type === "high") scene.classList.add("overflowing");
  if (type === "fixed" || type === "rapid") scene.classList.add("cracked");
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
  scene.className = "stage-scene";
  updatePreview();
  stageStatus.textContent = "STANDBY";
  stageHint.textContent = "条件を変えて、もう一度ためしてみよう。";
  document.querySelector(".start-button").focus();
}

form.addEventListener("change", updatePreview);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const choices = getSelections();
  const result = chooseResult(choices);

  stageStatus.textContent = "HEATING...";
  stageHint.textContent = "加熱中… 試験管のようすを観察しよう。";
  setSceneEffect(result, choices);

  window.setTimeout(() => {
    stageStatus.textContent = result === "success" ? "COMPLETE" : "WARNING";
    showResult(result);
  }, 1500);
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
