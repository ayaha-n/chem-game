const hydrogenSulfideScenario = new ExperimentScenario({
  id: "hydrogen-sulfide",
  title: "硫化水素発生実験",
  initialScore: 100,
  meta: {
    formula: "H₂S",
    learningGoals: ["有毒気体の危険性", "安全な観察", "換気", "廃液処理"]
  },
  steps: [
    {
      id: "ironSulfide",
      title: "硫化鉄を準備する",
      prompt: "試験管に入れる硫化鉄の量を選ぼう。",
      effect: "prepare",
      options: [
        {
          value: "small",
          label: "少量",
          effect: "small",
          observation: "試験管の底に少量の硫化鉄が入りました。",
          improvement: "少なすぎると反応が弱く、気体の観察が難しくなります。"
        },
        {
          value: "standard",
          label: "標準量",
          effect: "standard",
          observation: "試験管の底に硫化鉄が入りました。"
        },
        {
          value: "large",
          label: "多量",
          effect: "large",
          penalty: 10,
          risk: 1,
          flags: ["large-material"],
          dangerous: true,
          observation: "試験管の底が硫化鉄で大きく埋まりました。",
          improvement: "反応物を増やすと、後で発生する有毒な気体も増えます。標準量にします。"
        }
      ]
    },
    {
      id: "acid",
      title: "塩酸を加える",
      prompt: "硫化鉄に加える塩酸の量を選ぼう。",
      effect: "reaction",
      duration: 1800,
      input: {
        type: "range",
        min: 0.1,
        max: 5.0,
        step: 0.1,
        default: 0.5,
        unit: "mL",
        label: "硫化鉄に加える塩酸の量"
      },
      options: [
        {
          value: "drops",
          label: "少量",
          min: 0.1,
          max: 1.0,
          effect: "gentle",
          observation: "小さな泡が出て、気体が発生し始めました。"
        },
        {
          value: "half",
          label: "中量",
          min: 1.1,
          max: 3.0,
          effect: "active",
          penalty: 10,
          risk: 1,
          flags: ["more-gas"],
          observation: "泡が増え、気体が次々と発生しています。",
          improvement: "塩酸は必要な量だけ少しずつ加え、気体の発生量を抑えます。"
        },
        {
          value: "lots",
          label: "多量",
          min: 3.1,
          max: 5.0,
          effect: "vigorous",
          penalty: 20,
          risk: 2,
          flags: ["large-gas"],
          dangerous: true,
          observation: "激しく泡立ち、大量の気体が一気に発生しました。",
          improvement: "塩酸を一度に多く加えず、数滴ずつ反応を確認します。"
        }
      ]
    },
    {
      id: "smell",
      title: "においを確認する",
      prompt: "発生した気体のにおいを、どのように確認する？",
      effect: "smell",
      options: [
        {
          value: "direct",
          label: "鼻を近づける",
          effect: "direct",
          accident: "direct-inhalation",
          dangerous: true,
          observation: "顔を試験管へ近づけました。",
          improvement: "気体を直接吸い込まず、必要な場合も離れた位置から手であおぎます。"
        },
        {
          value: "waft",
          label: "手であおいで確認する",
          effect: "waft",
          observation: "試験管から離れ、手で少量の気体をあおぎました。"
        }
      ]
    },
    {
      id: "ventilation",
      title: "換気方法を選ぶ",
      prompt: "教室内に気体を残さないため、どう換気する？",
      effect: "ventilation",
      duration: 1700,
      options: [
        {
          value: "closed",
          label: "窓を閉める",
          effect: "closed",
          penalty: 20,
          risk: 2,
          flags: ["poor-ventilation"],
          dangerous: true,
          observation: "窓が閉まり、気体が教室内をゆっくり漂っています。",
          improvement: "硫化水素を扱うときは窓を開け、気体を室外へ排出します。"
        },
        {
          value: "open",
          label: "窓を開ける",
          effect: "open",
          observation: "窓から気体が少しずつ外へ流れています。"
        },
        {
          value: "fan",
          label: "窓を開けて送風する",
          effect: "fan",
          rating: "高評価",
          observation: "送風によって気体が窓の外へ流れていきました。"
        }
      ]
    },
    {
      id: "waste",
      title: "廃液を処理する",
      prompt: "反応後の液体を、どのように回収する？",
      effect: "waste",
      duration: 1700,
      options: [
        {
          value: "combine",
          label: "教卓の容器へまとめる",
          effect: "combine",
          penalty: 20,
          risk: 2,
          flags: ["unsafe-waste"],
          dangerous: true,
          observation: "濃い廃液が、そのまま一つの容器へ集まりました。",
          improvement: "先生の指示に従い、水で薄めるなど指定された前処理をしてから回収します。"
        },
        {
          value: "dilute",
          label: "水で薄めてから回収する",
          effect: "dilute",
          observation: "廃液を水で薄め、指定された回収容器へ移しました。"
        }
      ]
    },
    {
      id: "finish",
      title: "授業終了",
      prompt: "教室全体の安全状態をシミュレーションで確認しよう。",
      effect: "simulation",
      duration: 2600,
      actionLabel: "安全状態を再生する",
      accidentRule: {
        minRisk: 3,
        accident: "classroom-exposure"
      },
      options: [
        {
          value: "simulate",
          label: "シミュレーション再生",
          effect: "map",
          observation: "教室内の気体、生徒、廃液回収場所を確認しました。"
        }
      ]
    }
  ],
  accidents: {
    "direct-inhalation": {
      effect: "direct-inhalation",
      resultDelay: 1600,
      summary: "有毒な気体を直接吸い込み、実験を続けられなくなりました。",
      what: "気体を吸い込んだ生徒が体調不良になった。",
      why: "硫化水素が発生している試験管へ鼻を近づけ、気体を直接吸い込んだためです。",
      lesson: "気体のにおいを直接かいではいけません。必要な場合は十分に離れ、手で少量をあおいで確認します。"
    },
    "classroom-exposure": {
      effect: "classroom-exposure",
      resultDelay: 2200,
      summary: "教室内の安全管理が不十分で、複数の生徒に影響が出ました。",
      what: "複数の生徒が体調不良を訴え、救急搬送が必要になった。",
      why: "換気不足や不適切な廃液処理によって、硫化水素が教室内、特に床に近い場所へ滞留したためです。",
      lesson: "硫化水素は空気より重く、低い場所にたまりやすい有毒な気体です。換気と実験後の廃液管理まで安全に行います。"
    }
  },
  completion: {
    resultDelay: 1300,
    summary: "気体の発生から換気、廃液回収まで安全に管理できました。選択した操作を振り返ろう。"
  }
});

const sulfideScene = document.querySelector("#scenario-scene");
const sulfideStatus = document.querySelector("#scenario-status");
const sulfideHint = document.querySelector("#scenario-hint");

function restoreSulfideScene(state) {
  sulfideScene.className = "sulfide-scene";
  Object.entries(state.choices).forEach(([stepId, choice]) => {
    sulfideScene.classList.add(`${stepId}-${choice}`);
  });
  sulfideStatus.textContent = "READY";
  sulfideHint.textContent = "次の操作を選ぼう。";
}

const sulfideEffects = {
  reset() {
    sulfideScene.className = "sulfide-scene";
    sulfideStatus.textContent = "SETUP";
    sulfideHint.textContent = "硫化鉄の量を選ぼう。";
  },

  restore: restoreSulfideScene,

  play(stepEffect, optionEffect, state, step) {
    restoreSulfideScene(state);
    sulfideScene.classList.add(`effect-${stepEffect}`, `effect-${optionEffect}`);
    sulfideStatus.textContent = stepEffect === "simulation" ? "SIMULATING..." : "OBSERVING...";

    const hints = {
      prepare: "試験管へ硫化鉄を入れています。",
      reaction: "泡と気体の発生量を観察しよう。",
      smell: "顔と試験管の距離を観察しよう。",
      ventilation: "気体がどちらへ流れるか観察しよう。",
      waste: "廃液が回収容器へ移る様子を観察しよう。",
      simulation: "気体の広がり、生徒、廃液回収場所を確認しよう。"
    };
    sulfideHint.textContent = hints[stepEffect];
  },

  accident(effect) {
    sulfideScene.classList.add("sulfide-danger", `accident-${effect}`);
    sulfideStatus.textContent = "EMERGENCY";
    sulfideHint.textContent = effect === "direct-inhalation"
      ? "気体を吸い込んだ生徒が体調不良になりました！"
      : "教室内で複数の生徒が体調不良を訴えています！";
  },

  complete() {
    sulfideScene.classList.add("simulation-safe");
    sulfideStatus.textContent = "SAFE";
    sulfideHint.textContent = "気体は排出され、廃液も安全に回収されています。";
  }
};

const sulfideRunner = new ScenarioRunner({
  scenario: hydrogenSulfideScenario,
  elements: {
    form: document.querySelector("#scenario-form"),
    question: document.querySelector("#scenario-question-area"),
    title: document.querySelector("#scenario-step-title"),
    number: document.querySelector("#scenario-step-number"),
    total: document.querySelector("#scenario-step-total"),
    progress: document.querySelector("#scenario-progress-bar"),
    score: document.querySelector("#scenario-score"),
    back: document.querySelector("#scenario-back"),
    next: document.querySelector("#scenario-next"),
    observation: document.querySelector("#scenario-observation"),
    observationText: document.querySelector("#scenario-observation-text"),
    overlay: document.querySelector("#scenario-result-overlay"),
    card: document.querySelector("#scenario-result-card"),
    kicker: document.querySelector("#scenario-result-kicker"),
    resultTitle: document.querySelector("#scenario-result-title"),
    finalScore: document.querySelector("#scenario-final-score"),
    summary: document.querySelector("#scenario-result-summary"),
    accident: document.querySelector("#scenario-accident"),
    what: document.querySelector("#scenario-what"),
    why: document.querySelector("#scenario-why"),
    lesson: document.querySelector("#scenario-lesson"),
    history: document.querySelector("#scenario-choice-list"),
    stat: document.querySelector("#scenario-stat"),
    retry: document.querySelector("#scenario-retry"),
    menu: document.querySelector("#scenario-result-menu")
  },
  effects: sulfideEffects
});

experimentApp.register(
  "hydrogen-sulfide",
  document.querySelector("#hydrogen-sulfide-game"),
  () => sulfideRunner.reset()
);
