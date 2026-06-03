(function () {
  const questions = window.QUESTION_BANK || [];
  const state = {
    activeId: questions[0] ? questions[0].id : null,
    answered: JSON.parse(localStorage.getItem("abr-answered") || "{}"),
    filter: {
      search: "",
      category: "all",
      difficulty: "all"
    },
    mode: "exam",
    examOrder: [],
    examSignature: ""
  };

  const els = {
    installButton: document.getElementById("installButton"),
    questionTotal: document.getElementById("questionTotal"),
    answeredTotal: document.getElementById("answeredTotal"),
    accuracyTotal: document.getElementById("accuracyTotal"),
    filteredCount: document.getElementById("filteredCount"),
    searchInput: document.getElementById("searchInput"),
    categoryFilter: document.getElementById("categoryFilter"),
    difficultyFilter: document.getElementById("difficultyFilter"),
    modeSelect: document.getElementById("modeSelect"),
    questionList: document.getElementById("questionList"),
    questionCategory: document.getElementById("questionCategory"),
    questionDifficulty: document.getElementById("questionDifficulty"),
    questionPosition: document.getElementById("questionPosition"),
    progressFill: document.getElementById("progressFill"),
    questionTitle: document.getElementById("questionTitle"),
    questionStem: document.getElementById("questionStem"),
    answers: document.getElementById("answers"),
    showExplanation: document.getElementById("showExplanation"),
    nextQuestion: document.getElementById("nextQuestion"),
    explanationPanel: document.getElementById("explanationPanel"),
    explanationText: document.getElementById("explanationText"),
    referenceText: document.getElementById("referenceText"),
    tagText: document.getElementById("tagText"),
    keywordText: document.getElementById("keywordText")
  };

  let deferredInstallPrompt = null;

  function isInstalledApp() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  }

  function updateInstallButton() {
    if (isInstalledApp()) {
      els.installButton.textContent = "Installed";
      els.installButton.disabled = true;
      return;
    }
    els.installButton.textContent = "Install now";
    els.installButton.disabled = false;
  }

  function uniqueValues(key) {
    return [...new Set(questions.map((q) => q[key]).filter(Boolean))].sort();
  }

  function populateFilters() {
    uniqueValues("category").forEach((category) => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = titleCase(category);
      els.categoryFilter.appendChild(option);
    });

    uniqueValues("difficulty").forEach((difficulty) => {
      const option = document.createElement("option");
      option.value = difficulty;
      option.textContent = titleCase(difficulty);
      els.difficultyFilter.appendChild(option);
    });
  }

  function titleCase(value) {
    return String(value)
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function getFilteredQuestions() {
    const term = state.filter.search.trim().toLowerCase();
    return questions.filter((question) => {
      const categoryMatch = state.filter.category === "all" || question.category === state.filter.category;
      const difficultyMatch = state.filter.difficulty === "all" || question.difficulty === state.filter.difficulty;
      const haystack = [
        question.title,
        question.category,
        question.difficulty,
        question.stem,
        ...(question.tags || []),
        ...(question.keywords || []),
        question.reference && question.reference.source,
        question.reference && question.reference.locator,
        question.reference && question.reference.note
      ].join(" ").toLowerCase();
      return categoryMatch && difficultyMatch && (!term || haystack.includes(term));
    });
  }

  function filteredSignature(filtered) {
    return filtered.map((question) => question.id).join("|");
  }

  function shuffleQuestions(items) {
    const shuffled = [...items];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    return shuffled;
  }

  function getDisplayQuestions(filtered) {
    if (state.mode !== "exam") return filtered;
    const signature = filteredSignature(filtered);
    if (signature !== state.examSignature) {
      state.examOrder = shuffleQuestions(filtered).map((question) => question.id);
      state.examSignature = signature;
      if (state.examOrder.length) state.activeId = state.examOrder[0];
    }
    const byId = new Map(filtered.map((question) => [question.id, question]));
    return state.examOrder.map((id) => byId.get(id)).filter(Boolean);
  }

  function renderStats(filtered) {
    const answeredItems = Object.values(state.answered);
    const correct = answeredItems.filter((item) => item.correct).length;
    els.questionTotal.textContent = String(questions.length);
    els.answeredTotal.textContent = String(answeredItems.length);
    els.accuracyTotal.textContent = answeredItems.length ? `${Math.round((correct / answeredItems.length) * 100)}%` : "--";
    els.filteredCount.textContent = `${filtered.length} shown`;
  }

  function renderList(filtered) {
    els.questionList.innerHTML = "";
    filtered.forEach((question, index) => {
      const button = document.createElement("button");
      const displayTitle = state.mode === "exam" ? `Question ${index + 1}` : `${index + 1}. ${question.title}`;
      const primaryMeta = state.mode === "exam" ? "Exam Mode" : titleCase(question.category);
      button.type = "button";
      button.className = `question-row${question.id === state.activeId ? " active" : ""}`;
      button.innerHTML = `
        <span class="row-top">
          <span class="row-title">${escapeHtml(displayTitle)}</span>
          <span class="row-status">${state.answered[question.id] ? "Answered" : ""}</span>
        </span>
        <span class="row-meta">
          <span>${escapeHtml(primaryMeta)}</span>
          <span>${escapeHtml(titleCase(question.difficulty))}</span>
        </span>
      `;
      button.addEventListener("click", () => {
        state.activeId = question.id;
        render();
      });
      els.questionList.appendChild(button);
    });
  }

  function renderQuestion(filtered) {
    const activeQuestion = filtered.find((question) => question.id === state.activeId) || filtered[0] || questions[0];
    if (!activeQuestion) {
      els.questionTitle.textContent = "No questions available";
      return;
    }
    state.activeId = activeQuestion.id;
    const answerState = state.answered[activeQuestion.id];

    els.questionCategory.textContent = state.mode === "exam" ? "Exam Mode" : titleCase(activeQuestion.category);
    els.questionDifficulty.textContent = titleCase(activeQuestion.difficulty);
    const filteredIndex = filtered.findIndex((question) => question.id === activeQuestion.id);
    const position = filteredIndex >= 0 ? filteredIndex + 1 : 1;
    els.questionPosition.textContent = `${position} of ${Math.max(filtered.length, 1)}`;
    els.progressFill.style.width = `${Math.min(100, Math.max(0, (position / Math.max(filtered.length, 1)) * 100))}%`;
    els.questionTitle.textContent = state.mode === "exam" ? `Question ${position}` : activeQuestion.title;
    els.questionStem.textContent = activeQuestion.stem;
    els.answers.innerHTML = "";
    els.explanationPanel.hidden = !answerState || state.mode === "exam";

    activeQuestion.choices.forEach((choice, index) => {
      const button = document.createElement("button");
      const selected = answerState && answerState.selectedIndex === index;
      const correct = index === activeQuestion.correctIndex;
      button.type = "button";
      button.className = "answer";
      if (answerState && correct) button.classList.add("correct");
      if (answerState && selected && !correct) button.classList.add("incorrect");
      button.innerHTML = `<span class="letter">${String.fromCharCode(65 + index)}</span><span>${escapeHtml(choice)}</span>`;
      button.addEventListener("click", () => answerQuestion(activeQuestion, index));
      els.answers.appendChild(button);
    });

    els.explanationText.textContent = activeQuestion.explanation;
    els.referenceText.textContent = formatReference(activeQuestion.reference);
    els.tagText.textContent = (activeQuestion.tags || []).join(", ");
    els.keywordText.textContent = (activeQuestion.keywords || []).join(", ");
  }

  function answerQuestion(question, selectedIndex) {
    state.answered[question.id] = {
      selectedIndex,
      correct: selectedIndex === question.correctIndex,
      at: new Date().toISOString()
    };
    localStorage.setItem("abr-answered", JSON.stringify(state.answered));
    render();
  }

  function formatReference(reference) {
    if (!reference) return "Reference pending EPUB extraction.";
    return [reference.source, reference.locator, reference.note].filter(Boolean).join(" | ");
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function render() {
    const filtered = getFilteredQuestions();
    const displayQuestions = getDisplayQuestions(filtered);
    if (displayQuestions.length && !displayQuestions.some((question) => question.id === state.activeId)) {
      state.activeId = displayQuestions[0].id;
    }
    renderStats(displayQuestions);
    renderList(displayQuestions);
    renderQuestion(displayQuestions);
  }

  function bindEvents() {
    els.modeSelect.value = state.mode;
    els.searchInput.addEventListener("input", (event) => {
      state.filter.search = event.target.value;
      render();
    });
    els.categoryFilter.addEventListener("change", (event) => {
      state.filter.category = event.target.value;
      render();
    });
    els.difficultyFilter.addEventListener("change", (event) => {
      state.filter.difficulty = event.target.value;
      render();
    });
    els.modeSelect.addEventListener("change", (event) => {
      state.mode = event.target.value;
      state.examSignature = "";
      state.examOrder = [];
      render();
    });
    els.showExplanation.addEventListener("click", () => {
      els.explanationPanel.hidden = false;
    });
    els.nextQuestion.addEventListener("click", () => {
      const filtered = getDisplayQuestions(getFilteredQuestions());
      const index = filtered.findIndex((question) => question.id === state.activeId);
      const next = filtered[(index + 1) % filtered.length];
      if (next) state.activeId = next.id;
      render();
    });
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    updateInstallButton();
  });

  els.installButton.addEventListener("click", async () => {
    if (isInstalledApp()) return;
    if (!deferredInstallPrompt) {
      window.alert("To install, open this app from HTTPS or localhost. On iPhone or iPad, use Share > Add to Home Screen.");
      return;
    }
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    updateInstallButton();
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    updateInstallButton();
  });

  updateInstallButton();

  if ("serviceWorker" in navigator && ["http:", "https:"].includes(window.location.protocol)) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js?v=19").then((registration) => {
        registration.update();
      }).catch(() => {
        // The app still works online when service worker registration is unavailable.
      });
    });
  }

  populateFilters();
  bindEvents();
  render();
})();
