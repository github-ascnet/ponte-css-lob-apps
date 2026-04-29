(function () {
  "use strict";

  const appEl = document.getElementById("app");
  const appTitleEl = document.getElementById("app-title-text");
  const STORAGE_KEY = "authz-survey-state-v1";

  const state = {
    config: null,
    currentStep: 0,
    answers: {},
    errors: {},
  };

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    showLoading();
    try {
      const res = await fetch("./data/survey-config.json", {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error("Konfiguration konnte nicht geladen werden.");
      }

      state.config = await res.json();
      applyConfiguredTitles();
      restoreState();
      state.currentStep = clampStep(state.currentStep);
      render();
    } catch (err) {
      showError(err.message || "Unbekannter Fehler.");
    }
  }

  function clampStep(value) {
    const maxStep = getTotalSteps();
    if (!Number.isInteger(value) || value < 0) {
      return 0;
    }
    return Math.min(value, maxStep);
  }

  function applyConfiguredTitles() {
    const configUi = state.config && state.config.ui ? state.config.ui : {};
    const fallbackTitle =
      (state.config && state.config.title) || "Fragekatalog";
    const headerTitle = configUi.appTitle || fallbackTitle;
    const documentTitle = configUi.documentTitle || fallbackTitle;

    if (appTitleEl) {
      appTitleEl.textContent = headerTitle;
    }

    document.title = documentTitle;
  }

  function getTotalSteps() {
    return state.config.sections.length;
  }

  function showLoading() {
    appEl.innerHTML =
      '<section class="panel empty-state"><p>Lade Fragekatalog...</p></section>';
    appEl.setAttribute("aria-busy", "true");
  }

  function showError(message) {
    appEl.innerHTML = [
      '<section class="panel error-state">',
      "<h2>Fehler beim Laden</h2>",
      `<p>${escapeHtml(message)}</p>`,
      '<button class="btn btn-primary" type="button" id="retry-load">Erneut versuchen</button>',
      "</section>",
    ].join("");

    const retryBtn = document.getElementById("retry-load");
    retryBtn.addEventListener("click", init);
    appEl.setAttribute("aria-busy", "false");
  }

  function restoreState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const saved = JSON.parse(raw);
      if (saved && typeof saved === "object") {
        state.answers =
          saved.answers && typeof saved.answers === "object"
            ? saved.answers
            : {};
        state.currentStep = Number.isInteger(saved.currentStep)
          ? saved.currentStep
          : 0;
      }
    } catch (err) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  function persistState() {
    const payload = {
      currentStep: state.currentStep,
      answers: state.answers,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  function render() {
    appEl.setAttribute("aria-busy", "false");

    if (state.currentStep >= getTotalSteps()) {
      renderSummary();
      return;
    }

    const section = state.config.sections[state.currentStep];

    appEl.innerHTML = [
      '<section class="panel">',
      renderProgress(),
      renderStepHeader(section),
      `<form id="survey-form" novalidate>${renderQuestions(section)}</form>`,
      renderStepNav(section),
      "</section>",
    ].join("");

    bindQuestionEvents(section);
    bindStepNavigation(section);
    refreshSelectionStyles();
  }

  function renderProgress() {
    const current = Math.min(state.currentStep + 1, getTotalSteps());
    const percent = Math.round((current / getTotalSteps()) * 100);

    return [
      '<div class="progress-wrap">',
      '<div class="progress-top">',
      '<span class="progress-label">Fortschritt</span>',
      `<span class="progress-count">Schritt ${current} von ${getTotalSteps()}</span>`,
      "</div>",
      '<div class="progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" ',
      `aria-valuenow="${percent}">`,
      `<div class="progress-fill" style="width:${percent}%"></div>`,
      "</div>",
      "</div>",
    ].join("");
  }

  function renderStepHeader(section) {
    return [
      '<header class="step-head">',
      `<span class="section-tag" aria-hidden="true"><i class="fa-solid ${escapeHtml(
        section.icon || "fa-folder"
      )}"></i></span>`,
      `<h2>${escapeHtml(section.title)}</h2>`,
      `<p>${escapeHtml(section.description || "")}</p>`,
      '<p class="required-hint"><strong>*</strong> Pflichtfelder müssen ausgefüllt werden.</p>',
      "</header>",
    ].join("");
  }

  function renderQuestions(section) {
    var rendered = [];
    var i = 0;
    var questions = section.questions;
    while (i < questions.length) {
      var q = questions[i];
      if (q.rowGroup) {
        var group = [];
        var groupId = q.rowGroup;
        while (i < questions.length && questions[i].rowGroup === groupId) {
          group.push(questions[i]);
          i++;
        }
        rendered.push(
          '<div class="question-row">' +
            group.map(renderQuestion).join("") +
            "</div>"
        );
      } else {
        rendered.push(renderQuestion(q));
        i++;
      }
    }
    return '<div class="question-list">' + rendered.join("") + "</div>";
  }

  function renderQuestion(question) {
    const hasError = Boolean(state.errors[question.id]);
    const required = question.required
      ? '<span class="badge-required">*</span>'
      : "";
    const help = question.helpText
      ? `<p class="help">${escapeHtml(question.helpText)}</p>`
      : "";
    const errorHtml = hasError
      ? `<p class="error-msg">${escapeHtml(state.errors[question.id])}</p>`
      : "";

    return [
      `<article class="question ${
        hasError ? "has-error" : ""
      }" data-question-id="${escapeHtml(question.id)}">`,
      `<label class="question-label" for="q-${escapeHtml(
        question.id
      )}">${escapeHtml(question.label)}${required}</label>`,
      help,
      renderQuestionControl(question),
      errorHtml,
      "</article>",
    ].join("");
  }

  function renderQuestionControl(question) {
    switch (question.type) {
      case "text":
        return renderTextInput(question);
      case "radio-cards":
        return renderRadioCards(question);
      case "dropdown":
        return renderDropdown(question);
      case "checkbox-group":
        return renderCheckboxGroup(question);
      case "rating-scale":
        return renderRatingScale(question);
      case "ampel":
        return renderAmpel(question);
      default:
        return '<p class="error-msg">Unbekannter Fragetyp.</p>';
    }
  }

  function renderTextInput(question) {
    const value =
      typeof state.answers[question.id] === "string"
        ? state.answers[question.id]
        : "";
    return [
      `<input class="text-input" type="text" id="q-${escapeHtml(
        question.id
      )}" name="${escapeHtml(question.id)}"`,
      ` value="${escapeHtml(value)}" maxlength="180" placeholder="${escapeHtml(
        question.placeholder || ""
      )}"`,
      ' autocomplete="off">',
    ].join("");
  }

  function renderRadioCards(question) {
    const options = getOptions(question);
    const selected = state.answers[question.id];

    return [
      '<div class="option-grid">',
      options
        .map(function (opt) {
          const isSelected = selected === opt.value;
          return [
            `<label class="option-card ${isSelected ? "is-selected" : ""}">`,
            `<input type="radio" id="q-${escapeHtml(question.id)}-${escapeHtml(
              opt.value
            )}" name="${escapeHtml(question.id)}" value="${escapeHtml(
              opt.value
            )}" ${isSelected ? "checked" : ""}>`,
            `<span>${escapeHtml(opt.label)}</span>`,
            "</label>",
          ].join("");
        })
        .join(""),
      "</div>",
    ].join("");
  }

  function renderDropdown(question) {
    const options = getOptions(question);
    const selected = state.answers[question.id] || "";

    return [
      `<select class="select-input" id="q-${escapeHtml(
        question.id
      )}" name="${escapeHtml(question.id)}">`,
      '<option value="">Bitte auswählen...</option>',
      options
        .map(function (opt) {
          return `<option value="${escapeHtml(
            opt.value
          )}" ${selected === opt.value ? "selected" : ""}>${escapeHtml(opt.label)}</option>`;
        })
        .join(""),
      "</select>",
    ].join("");
  }

  function renderCheckboxGroup(question) {
    const options = getOptions(question);
    const selectedValues = Array.isArray(state.answers[question.id])
      ? state.answers[question.id]
      : [];

    return [
      '<div class="checkbox-grid">',
      options
        .map(function (opt) {
          const checked = selectedValues.includes(opt.value);
          return [
            '<label class="checkbox-item">',
            `<input type="checkbox" id="q-${escapeHtml(
              question.id
            )}-${escapeHtml(opt.value)}" name="${escapeHtml(
              question.id
            )}" value="${escapeHtml(opt.value)}" ${checked ? "checked" : ""}>`,
            `<span>${escapeHtml(opt.label)}</span>`,
            "</label>",
          ].join("");
        })
        .join(""),
      "</div>",
    ].join("");
  }

  function renderRatingScale(question) {
    const options = getOptions(question);
    const selected = state.answers[question.id];

    return [
      '<div class="rating-grid">',
      options
        .map(function (opt) {
          const isSelected = selected === opt.value;
          return [
            `<label class="rating-item ${isSelected ? "is-selected" : ""}">`,
            `<input type="radio" id="q-${escapeHtml(question.id)}-${escapeHtml(
              opt.value
            )}" name="${escapeHtml(question.id)}" value="${escapeHtml(
              opt.value
            )}" ${isSelected ? "checked" : ""}>`,
            `<span title="${escapeHtml(opt.label)}">${escapeHtml(
              opt.value
            )}</span>`,
            "</label>",
          ].join("");
        })
        .join(""),
      "</div>",
    ].join("");
  }

  function renderAmpel(question) {
    const options = getOptions(question);
    const selected = state.answers[question.id];

    return [
      '<div class="traffic-grid">',
      options
        .map(function (opt) {
          const isSelected = selected === opt.value;
          const toneClass = getDotClass(opt.risk || "grey");
          return [
            `<label class="traffic-item ${isSelected ? "is-selected" : ""}">`,
            `<input type="radio" id="q-${escapeHtml(question.id)}-${escapeHtml(
              opt.value
            )}" name="${escapeHtml(question.id)}" value="${escapeHtml(
              opt.value
            )}" ${isSelected ? "checked" : ""}>`,
            `<span class="dot ${toneClass}"></span>`,
            `<span>${escapeHtml(opt.label)}</span>`,
            "</label>",
          ].join("");
        })
        .join(""),
      "</div>",
    ].join("");
  }

  function getOptions(question) {
    if (Array.isArray(question.options)) {
      return question.options;
    }

    const optionSet = state.config.optionSets[question.optionSet];

    // Altes Format: optionSet ist direkt ein Array
    if (Array.isArray(optionSet)) {
      return optionSet;
    }

    // Neues Format: { description, options }
    if (optionSet && Array.isArray(optionSet.options)) {
      return optionSet.options;
    }

    return [];
  }

  function bindQuestionEvents(section) {
    const form = document.getElementById("survey-form");

    form.addEventListener("input", function (event) {
      const target = event.target;
      const question = section.questions.find(function (q) {
        return q.id === target.name;
      });

      if (!question) {
        return;
      }

      applyAnswer(question, form);
      clearError(question.id);
      refreshSelectionStyles();
      updateStepNavigationState(section);
      persistState();
    });

    form.addEventListener("change", function (event) {
      const target = event.target;
      const question = section.questions.find(function (q) {
        return q.id === target.name;
      });

      if (!question) {
        return;
      }

      applyAnswer(question, form);
      clearError(question.id);
      refreshSelectionStyles();
      updateStepNavigationState(section);
      persistState();
    });
  }

  function updateStepNavigationState(section) {
    const nextBtn = document.getElementById("btn-next");
    if (!nextBtn) {
      return;
    }
    nextBtn.disabled = !isStepValid(section);
  }

  function bindStepNavigation(section) {
    const prevBtn = document.getElementById("btn-prev");
    const nextBtn = document.getElementById("btn-next");

    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        state.currentStep = Math.max(0, state.currentStep - 1);
        persistState();
        render();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        if (!validateStep(section)) {
          render();
          return;
        }

        state.currentStep = Math.min(getTotalSteps(), state.currentStep + 1);
        persistState();
        render();
      });
    }
  }

  function applyAnswer(question, form) {
    const fieldName = question.id;

    if (question.type === "checkbox-group") {
      const checked = Array.from(
        form.querySelectorAll(`input[name="${cssEscape(fieldName)}"]:checked`)
      ).map(function (el) {
        return el.value;
      });
      state.answers[fieldName] = checked;
      return;
    }

    if (question.type === "text") {
      const input = form.querySelector(`input[name="${cssEscape(fieldName)}"]`);
      state.answers[fieldName] = input ? input.value.trim() : "";
      return;
    }

    const selected =
      form.querySelector(`[name="${cssEscape(fieldName)}"]:checked`) ||
      form.querySelector(`select[name="${cssEscape(fieldName)}"]`);
    if (selected && selected.value) {
      state.answers[fieldName] = selected.value;
    } else {
      delete state.answers[fieldName];
    }
  }

  function validateStep(section) {
    state.errors = {};

    section.questions.forEach(function (q) {
      if (!q.required) {
        return;
      }

      const answer = state.answers[q.id];
      const isValid = validateAnswer(q.type, answer);
      if (!isValid) {
        state.errors[q.id] = "Dieses Feld ist erforderlich.";
      }
    });

    return Object.keys(state.errors).length === 0;
  }

  function validateAnswer(type, answer) {
    if (type === "checkbox-group") {
      return Array.isArray(answer) && answer.length > 0;
    }

    if (type === "text") {
      return typeof answer === "string" && answer.trim().length > 0;
    }

    return typeof answer === "string" && answer.length > 0;
  }

  function clearError(questionId) {
    if (state.errors[questionId]) {
      delete state.errors[questionId];
    }
  }

  function refreshSelectionStyles() {
    appEl
      .querySelectorAll(".option-card, .rating-item, .traffic-item")
      .forEach(function (node) {
        const input = node.querySelector("input");
        node.classList.toggle("is-selected", Boolean(input && input.checked));
      });
  }

  function renderStepNav(section) {
    const isLastSection = state.currentStep === getTotalSteps() - 1;
    const isNextEnabled = isStepValid(section);

    return [
      '<nav class="nav" aria-label="Schrittnavigation">',
      '<button id="btn-prev" class="btn btn-primary" type="button">Zurück</button>',
      '<div class="nav-right">',
      `<button id="btn-next" class="btn btn-primary" type="button" ${
        isNextEnabled ? "" : "disabled"
      }>${isLastSection ? "Zusammenfassung anzeigen" : "Weiter"}</button>`,
      "</div>",
      "</nav>",
    ].join("");
  }

  function isStepValid(section) {
    return section.questions.every(function (q) {
      if (!q.required) {
        return true;
      }
      return validateAnswer(q.type, state.answers[q.id]);
    });
  }

  function renderSummary() {
    const evaluation = evaluateRisk();

    appEl.innerHTML = [
      '<section class="panel">',
      renderProgress(),
      '<header class="step-head">',
      '<span class="section-tag" aria-hidden="true"><i class="fa-solid fa-clipboard-check"></i></span>',
      "<h2>Ergebnisübersicht</h2>",
      "<p>Alle Antworten sind strukturiert erfasst und als JSON exportierbar.</p>",
      "</header>",
      '<section class="summary-layout" id="summary-print-area">',
      renderRiskCard(evaluation),
      state.config.sections
        .map(function (section) {
          return renderSummarySection(section);
        })
        .join(""),
      "</section>",
      '<nav class="nav">',
      '<button id="btn-back-to-last" class="btn btn-primary" type="button">Zurück</button>',
      '<div class="nav-right">',
      '<button id="btn-reset" class="btn btn-secondary" type="button">Neu starten</button>',
      '<button id="btn-export" class="btn btn-secondary" type="button">JSON speichern</button>',
      '<button id="btn-print" class="btn btn-primary" type="button">Drucken</button>',
      "</div>",
      "</nav>",
      "</section>",
    ].join("");

    bindSummaryActions();
  }

  function renderRiskCard(evaluation) {
    const tone = evaluation.overall || "grey";
    const map = state.config.riskMapping[tone] || state.config.riskMapping.grey;

    return [
      '<section class="risk-card">',
      '<div class="risk-head">',
      "<h3>Automatische Risikoauswertung</h3>",
      `<span class="risk-pill risk-${escapeHtml(tone)}">${escapeHtml(
        map.label
      )}</span>`,
      "</div>",
      `<p>${escapeHtml(map.description)}</p>`,
      '<div class="risk-counts">',
      `<span>Grün: ${evaluation.counts.green}</span>`,
      `<span>Gelb: ${evaluation.counts.yellow}</span>`,
      `<span>Rot: ${evaluation.counts.red}</span>`,
      `<span>Grau: ${evaluation.counts.grey}</span>`,
      "</div>",
      "</section>",
    ].join("");
  }

  function renderSummarySection(section) {
    const items = section.questions
      .map(function (question) {
        const value = formatAnswerForDisplay(
          question,
          state.answers[question.id]
        );
        return [
          "<li>",
          `<span class="summary-key">${escapeHtml(question.label)}</span>`,
          `<span class="summary-value">${escapeHtml(value)}</span>`,
          "</li>",
        ].join("");
      })
      .join("");

    return [
      '<article class="summary-card">',
      `<h3><i class="fa-solid ${escapeHtml(
        section.icon || "fa-folder"
      )}"></i> ${escapeHtml(section.title)}</h3>`,
      `<ul class="summary-list">${items}</ul>`,
      "</article>",
    ].join("");
  }

  function formatAnswerForDisplay(question, value) {
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return "Keine Angabe";
      }

      return value
        .map(function (item) {
          return resolveOptionLabel(question, item);
        })
        .join(", ");
    }

    if (!value) {
      return "Keine Angabe";
    }

    return resolveOptionLabel(question, value);
  }

  function resolveOptionLabel(question, rawValue) {
    if (question.type === "text") {
      return String(rawValue);
    }

    const options = getOptions(question);
    const match = options.find(function (opt) {
      return opt.value === rawValue;
    });

    return match ? match.label : String(rawValue);
  }

  function bindSummaryActions() {
    const backBtn = document.getElementById("btn-back-to-last");
    const exportBtn = document.getElementById("btn-export");
    const printBtn = document.getElementById("btn-print");
    const resetBtn = document.getElementById("btn-reset");

    backBtn.addEventListener("click", function () {
      state.currentStep = Math.max(0, getTotalSteps() - 1);
      persistState();
      render();
    });

    exportBtn.addEventListener("click", exportJson);

    printBtn.addEventListener("click", function () {
      window.print();
    });

    resetBtn.addEventListener("click", function () {
      state.answers = {};
      state.errors = {};
      state.currentStep = 0;
      persistState();
      render();
    });
  }

  function exportJson() {
    const evaluation = evaluateRisk();
    const payload = {
      metadata: {
        title: state.config.title,
        exportedAt: new Date().toISOString(),
        riskSummary: evaluation,
      },
      answers: state.answers,
    };

    const fileNameBase = sanitizeFileName(state.answers.appName || "survey");
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileNameBase}-export.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  function evaluateRisk() {
    const counts = { green: 0, yellow: 0, red: 0, grey: 0 };
    const questionsForEvaluation = getRiskEvaluationQuestions();

    questionsForEvaluation.forEach(function (question) {
      const answer = state.answers[question.id];
      const risk = determineRiskForAnswer(question, answer);
      counts[risk] += 1;
    });

    const overall = deriveOverallRisk(counts);
    return { overall: overall, counts: counts };
  }

  function getRiskEvaluationQuestions() {
    const assessmentSection = state.config.sections.find(function (section) {
      return section.id === "assessment";
    });

    if (
      assessmentSection &&
      Array.isArray(assessmentSection.questions) &&
      assessmentSection.questions.length > 0
    ) {
      return assessmentSection.questions;
    }

    return state.config.sections.flatMap(function (section) {
      return section.questions;
    });
  }

  function determineRiskForAnswer(question, answer) {
    if (
      answer === undefined ||
      answer === null ||
      answer === "" ||
      (Array.isArray(answer) && answer.length === 0)
    ) {
      return "grey";
    }

    if (Array.isArray(answer)) {
      const risks = answer.map(function (value) {
        return resolveRiskByOption(question, value);
      });
      return highestRisk(risks);
    }

    return resolveRiskByOption(question, answer);
  }

  function resolveRiskByOption(question, value) {
    const options = getOptions(question);
    const option = options.find(function (opt) {
      return opt.value === value;
    });

    if (option && option.risk && state.config.riskMapping[option.risk]) {
      return option.risk;
    }

    if (
      question.riskMap &&
      question.riskMap[value] &&
      state.config.riskMapping[question.riskMap[value]]
    ) {
      return question.riskMap[value];
    }

    return "grey";
  }

  function highestRisk(risks) {
    const order = ["grey", "green", "yellow", "red"];
    return risks.reduce(function (acc, item) {
      return order.indexOf(item) > order.indexOf(acc) ? item : acc;
    }, "grey");
  }

  function deriveOverallRisk(counts) {
    if (counts.red > 0) {
      return "red";
    }

    if (counts.yellow > 0) {
      return "yellow";
    }

    if (counts.green > 0) {
      return "green";
    }

    return "grey";
  }

  function getDotClass(risk) {
    switch (risk) {
      case "green":
        return "dot-green";
      case "yellow":
        return "dot-yellow";
      case "red":
        return "dot-red";
      default:
        return "dot-grey";
    }
  }

  function cssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === "function") {
      return window.CSS.escape(value);
    }
    return String(value).replace(/([^a-zA-Z0-9_\-])/g, "\\$1");
  }

  function sanitizeFileName(value) {
    return (
      String(value)
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9\-_]/g, "")
        .replace(/-{2,}/g, "-")
        .replace(/^-|-$/g, "") || "survey"
    );
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
})();
