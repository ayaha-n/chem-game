class ExperimentScenario {
  constructor(definition) {
    this.id = definition.id;
    this.title = definition.title;
    this.initialScore = definition.initialScore ?? 100;
    this.steps = definition.steps ?? [];
    this.accidents = definition.accidents ?? {};
    this.completion = definition.completion ?? {};
    this.meta = definition.meta ?? {};
  }

  getStep(index) {
    return this.steps[index];
  }

  getOption(stepId, value) {
    const step = this.steps.find((item) => item.id === stepId);
    if (!step) return null;
    if (step.input?.type === "range") {
      const amount = Number(value);
      return step.options.find((option) => {
        const min = option.min ?? -Infinity;
        const max = option.max ?? Infinity;
        return amount >= min && amount <= max;
      });
    }
    return step.options.find((option) => option.value === value);
  }
}

class ExperimentApp {
  constructor(menuSelector) {
    this.menu = document.querySelector(menuSelector);
    this.screens = new Map();
    this.onOpen = new Map();

    document.addEventListener("click", (event) => {
      const launch = event.target.closest("[data-experiment]");
      if (launch) this.open(launch.dataset.experiment);
      if (event.target.closest("[data-back-to-menu]")) this.openMenu();
    });
  }

  register(id, screen, onOpen) {
    if (!screen) return;
    this.screens.set(id, screen);
    if (onOpen) this.onOpen.set(id, onOpen);
    if (window.location.hash === `#${id}`) {
      window.setTimeout(() => this.open(id), 0);
    }
  }

  open(id) {
    this.menu.hidden = true;
    this.screens.forEach((screen, key) => {
      screen.hidden = key !== id;
    });
    this.onOpen.get(id)?.();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  openMenu() {
    this.menu.hidden = false;
    this.screens.forEach((screen) => {
      screen.hidden = true;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

class ScenarioRunner {
  constructor({ scenario, elements, effects = {} }) {
    this.scenario = scenario;
    this.el = elements;
    this.effects = effects;
    this.state = {};
    this.bind();
    this.reset();
  }

  bind() {
    this.el.question.addEventListener("change", () => {
      this.el.next.disabled = false;
    });
    this.el.question.addEventListener("input", (event) => {
      if (event.target.matches("input[type='range'][name='scenario-choice']")) {
        this.updateRangeReadout(event.target);
        this.el.next.disabled = false;
      }
    });
    this.el.next.addEventListener("click", () => this.advance());
    this.el.back.addEventListener("click", () => this.goBack());
    this.el.retry.addEventListener("click", () => this.reset());
    this.el.menu.addEventListener("click", () => {
      this.reset();
      experimentApp.openMenu();
    });
  }

  reset() {
    this.state = {
      step: 0,
      score: this.scenario.initialScore,
      choices: {},
      history: [],
      inputs: {},
      flags: {},
      risk: 0,
      locked: false,
      awaitingContinue: false,
      gameOver: false
    };
    this.el.overlay.hidden = true;
    this.el.overlay.setAttribute("aria-hidden", "true");
    this.el.score.textContent = this.state.score;
    this.effects.reset?.(this.state);
    this.render();
  }

  render() {
    const step = this.scenario.getStep(this.state.step);
    const selected = this.state.choices[step.id];
    this.el.title.textContent = step.title;
    this.el.number.textContent = this.state.step + 1;
    this.el.total.textContent = `/ ${this.scenario.steps.length}`;
    this.el.progress.style.width = `${((this.state.step + 1) / this.scenario.steps.length) * 100}%`;
    this.el.observation.hidden = true;
    this.state.awaitingContinue = false;

    this.el.question.innerHTML = `
      <fieldset class="hydrogen-question">
        <legend><span>${String(this.state.step + 1).padStart(2, "0")}</span> ${step.title}</legend>
        <p class="question-guide">${step.prompt}</p>
        ${step.input?.type === "range" ? this.renderRangeInput(step) : this.renderOptionGrid(step, selected)}
      </fieldset>
    `;
    this.el.back.disabled = this.state.step === 0 || this.state.locked;
    this.el.next.disabled = step.input?.type === "range" ? false : !selected;
    this.el.next.innerHTML = `${step.actionLabel ?? "操作する"} <span aria-hidden="true">→</span>`;
  }

  renderOptionGrid(step, selected) {
    return `
      <div class="hydrogen-option-grid ${step.options.length === 3 ? "three" : ""}">
        ${step.options.map((option) => `
          <label class="option-card">
            <input type="radio" name="scenario-choice" value="${option.value}" ${selected === option.value ? "checked" : ""}>
            <span>${option.label}</span>
          </label>
        `).join("")}
      </div>
    `;
  }

  renderRangeInput(step) {
    const input = step.input;
    const value = this.state.inputs[step.id] ?? input.default ?? input.min ?? 0;
    const unit = input.unit ?? "";
    const option = this.scenario.getOption(step.id, value);
    return `
      <div class="range-control">
        <div class="range-readout">
          <strong><span data-range-value>${value}</span>${unit}</strong>
          <small data-range-label>${option?.label ?? ""}</small>
        </div>
        <input
          type="range"
          name="scenario-choice"
          min="${input.min}"
          max="${input.max}"
          step="${input.step ?? 1}"
          value="${value}"
          aria-label="${input.label ?? step.title}"
        >
        <div class="range-scale">
          <span>${input.min}${unit}</span>
          <span>${input.max}${unit}</span>
        </div>
      </div>
    `;
  }

  updateRangeReadout(input) {
    const step = this.scenario.getStep(this.state.step);
    const option = this.scenario.getOption(step.id, input.value);
    this.el.question.querySelector("[data-range-value]").textContent = input.value;
    this.el.question.querySelector("[data-range-label]").textContent = option?.label ?? "";
  }

  advance() {
    if (this.state.awaitingContinue) {
      this.state.step += 1;
      this.effects.restore?.(this.state);
      this.render();
      return;
    }

    const input = this.el.question.querySelector("input[name='scenario-choice']:checked")
      ?? this.el.question.querySelector("input[type='range'][name='scenario-choice']");
    if (!input || this.state.locked) return;
    const step = this.scenario.getStep(this.state.step);
    const option = this.scenario.getOption(step.id, input.value);
    if (!option) return;
    this.record(step, option, input.value);
    this.setLocked(true);
    this.effects.play?.(step.effect, option.effect, this.state, step, option);

    const accident = this.resolveAccident(step, option);
    const delay = option.duration ?? step.duration ?? 1400;
    window.setTimeout(() => {
      if (accident) {
        this.triggerAccident(accident);
      } else if (this.state.step === this.scenario.steps.length - 1) {
        this.finish();
      } else {
        this.setLocked(false);
        this.el.observationText.textContent = option.observation;
        this.el.observation.hidden = false;
        this.state.awaitingContinue = true;
        this.el.next.disabled = false;
        this.el.next.innerHTML = `次のステップへ <span aria-hidden="true">→</span>`;
        this.el.back.disabled = true;
      }
    }, delay);
  }

  record(step, option, inputValue) {
    const index = this.state.step;
    const removed = this.state.history.filter((entry) => entry.index >= index);
    this.state.score += removed.reduce((sum, entry) => sum + entry.penalty, 0);
    this.state.risk -= removed.reduce((sum, entry) => sum + entry.risk, 0);
    removed.forEach((entry) => {
      (entry.flags ?? []).forEach((flag) => delete this.state.flags[flag]);
      delete this.state.choices[entry.stepId];
      delete this.state.inputs[entry.stepId];
    });
    this.state.history = this.state.history.filter((entry) => entry.index < index);

    const penalty = option.penalty ?? 0;
    const risk = option.risk ?? 0;
    this.state.score = Math.max(0, this.state.score - penalty);
    this.state.risk += risk;
    (option.flags ?? []).forEach((flag) => {
      this.state.flags[flag] = true;
    });
    this.state.choices[step.id] = option.value;
    if (step.input?.type === "range") this.state.inputs[step.id] = inputValue;
    this.state.history.push({
      index,
      stepId: step.id,
      stepTitle: step.title,
      choice: this.formatChoiceLabel(step, option, inputValue),
      penalty,
      risk,
      flags: option.flags ?? [],
      improvement: option.improvement ?? "",
      rating: option.rating ?? "",
      dangerous: Boolean(option.dangerous || option.accident)
    });
    this.updateScore();
  }

  formatChoiceLabel(step, option, inputValue) {
    if (step.input?.type !== "range") return option.label;
    return `${inputValue}${step.input.unit ?? ""}（${option.label}）`;
  }

  resolveAccident(step, option) {
    if (option.accident) return this.scenario.accidents[option.accident];
    const rule = step.accidentRule;
    if (!rule) return null;
    if (rule.minRisk != null && this.state.risk >= rule.minRisk) {
      return this.scenario.accidents[rule.accident];
    }
    if (rule.anyFlags?.some((flag) => this.state.flags[flag])) {
      return this.scenario.accidents[rule.accident];
    }
    return null;
  }

  triggerAccident(accident) {
    this.state.gameOver = true;
    this.state.score = 0;
    this.updateScore();
    this.effects.accident?.(accident.effect, this.state, accident);
    window.setTimeout(() => this.showResult(accident), accident.resultDelay ?? 1700);
  }

  finish() {
    this.effects.complete?.(this.state);
    window.setTimeout(() => this.showResult(null), this.scenario.completion.resultDelay ?? 1200);
  }

  goBack() {
    if (this.state.step === 0 || this.state.locked) return;
    this.state.step -= 1;
    this.effects.restore?.(this.state);
    this.render();
  }

  setLocked(locked) {
    this.state.locked = locked;
    this.el.form.querySelectorAll("input, button").forEach((control) => {
      control.disabled = locked;
    });
  }

  updateScore() {
    this.el.score.textContent = this.state.score;
    this.el.score.classList.remove("score-hit");
    void this.el.score.offsetWidth;
    this.el.score.classList.add("score-hit");
  }

  showResult(accident) {
    this.el.overlay.hidden = false;
    this.el.overlay.setAttribute("aria-hidden", "false");
    this.el.card.classList.toggle("game-over", Boolean(accident));
    this.el.kicker.textContent = accident ? "GAME OVER" : "MISSION REVIEW";
    this.el.resultTitle.textContent = accident ? "事故が発生しました" : "実験の振り返り";
    this.el.finalScore.textContent = this.state.score;
    this.el.summary.textContent = accident
      ? accident.summary
      : this.scenario.completion.summary;
    this.el.accident.hidden = !accident;
    if (accident) {
      this.el.what.textContent = accident.what;
      this.el.why.textContent = accident.why;
      this.el.lesson.textContent = accident.lesson;
    }
    this.renderHistory();
  }

  renderHistory() {
    this.el.history.innerHTML = this.state.history.map((entry) => `
      <li class="${entry.penalty || entry.dangerous ? "review-warning" : "review-safe"}">
        <span>${entry.stepTitle}</span>
        <strong>${entry.choice}</strong>
        <small>${entry.dangerous ? "危険操作" : entry.rating || (entry.penalty ? `−${entry.penalty}点` : "減点なし")}</small>
        ${entry.improvement ? `<p>${entry.improvement}</p>` : ""}
      </li>
    `).join("");
    const mistake = this.state.history.find((entry) => entry.penalty || entry.dangerous);
    const percent = mistake ? 31 + ((this.state.score + this.state.history.length * 9) % 37) : 16;
    this.el.stat.textContent = mistake
      ? `${percent}%のプレイヤーが「${mistake.choice}」で同じミスをしました（練習用データ）`
      : `${percent}%のプレイヤーがすべて安全な操作を選べました（練習用データ）`;
  }
}

const experimentApp = new ExperimentApp("#experiment-menu");
