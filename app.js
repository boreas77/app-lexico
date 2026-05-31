const boxesStorageKey = "caja-lexico-ele.boxes";
const oldWordsStorageKey = "caja-lexico-ele.words";
const activeBoxStorageKey = "caja-lexico-ele.activeBoxId";

const boxForm = document.querySelector("#box-form");
const boxNameInput = document.querySelector("#new-box-name");
const boxList = document.querySelector("#box-list");
const activeBoxName = document.querySelector("#active-box-name");
const activeBoxMeta = document.querySelector("#active-box-meta");
const wordForm = document.querySelector("#word-form");
const spanishWordInput = document.querySelector("#spanish-word");
const translationInput = document.querySelector("#translation");
const wordList = document.querySelector("#word-list");
const emptyState = document.querySelector("#empty-state");
const wordCount = document.querySelector("#word-count");
const boxCount = document.querySelector("#box-count");
const clearBoxButton = document.querySelector("#clear-box");
const generateStoryButton = document.querySelector("#generate-story");
const storyOutput = document.querySelector("#story-output");

let boxes = loadBoxes();
let activeBoxId = loadActiveBoxId();

if (!boxes.length) {
  boxes = [createBox("Mi primera caja")];
  activeBoxId = boxes[0].id;
  saveState();
}

if (!getActiveBox()) {
  activeBoxId = boxes[0].id;
  saveState();
}

function loadBoxes() {
  try {
    const savedBoxes = JSON.parse(localStorage.getItem(boxesStorageKey));

    if (Array.isArray(savedBoxes) && savedBoxes.length) {
      return savedBoxes;
    }

    const oldWords = JSON.parse(localStorage.getItem(oldWordsStorageKey));
    if (Array.isArray(oldWords) && oldWords.length) {
      return [
        {
          id: crypto.randomUUID(),
          name: "General",
          words: oldWords.map((item) => ({
            id: item.id || crypto.randomUUID(),
            spanish: item.spanish,
            translation: item.translation,
            createdAt: item.createdAt || Date.now()
          })),
          createdAt: Date.now()
        }
      ];
    }
  } catch {
    return [];
  }

  return [];
}

function loadActiveBoxId() {
  return localStorage.getItem(activeBoxStorageKey);
}

function createBox(name) {
  return {
    id: crypto.randomUUID(),
    name,
    words: [],
    createdAt: Date.now()
  };
}

function saveState() {
  localStorage.setItem(boxesStorageKey, JSON.stringify(boxes));
  localStorage.setItem(activeBoxStorageKey, activeBoxId);
}

function normalizeText(value) {
  return value.trim().replace(/\s+/g, " ");
}

function pluralize(count, singular, plural) {
  return count === 1 ? `1 ${singular}` : `${count} ${plural}`;
}

function getActiveBox() {
  return boxes.find((box) => box.id === activeBoxId);
}

function getActiveWords() {
  return getActiveBox()?.words || [];
}

function render() {
  renderBoxes();
  renderWords();
}

function renderBoxes() {
  boxList.innerHTML = "";
  boxCount.textContent = pluralize(boxes.length, "caja", "cajas");

  boxes.forEach((box) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = box.id === activeBoxId ? "box-button active" : "box-button";
    button.setAttribute("aria-pressed", box.id === activeBoxId ? "true" : "false");
    button.addEventListener("click", () => selectBox(box.id));

    const name = document.createElement("strong");
    name.textContent = box.name;

    const meta = document.createElement("span");
    meta.textContent = pluralize(box.words.length, "palabra", "palabras");

    button.append(name, meta);
    item.append(button);
    boxList.append(item);
  });
}

function renderWords() {
  const box = getActiveBox();
  const words = getActiveWords();

  activeBoxName.textContent = box.name;
  activeBoxMeta.textContent = `${pluralize(words.length, "palabra", "palabras")} en esta caja`;
  wordCount.textContent = pluralize(totalWords(), "palabra", "palabras");
  wordList.innerHTML = "";
  emptyState.hidden = words.length > 0;
  clearBoxButton.disabled = words.length === 0;
  generateStoryButton.disabled = words.length < 3;

  words.forEach((item) => {
    const card = document.createElement("li");
    card.className = "word-card";

    const content = document.createElement("div");
    content.className = "word-main";

    const word = document.createElement("strong");
    word.textContent = item.spanish;

    const translation = document.createElement("span");
    translation.textContent = item.translation;

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-button";
    deleteButton.setAttribute("aria-label", `Eliminar ${item.spanish}`);
    deleteButton.textContent = "x";
    deleteButton.addEventListener("click", () => deleteWord(item.id));

    content.append(word, translation);
    card.append(content, deleteButton);
    wordList.append(card);
  });
}

function totalWords() {
  return boxes.reduce((total, box) => total + box.words.length, 0);
}

function selectBox(id) {
  activeBoxId = id;
  saveState();
  storyOutput.textContent = "Guarda al menos tres palabras en esta caja y pulsa generar.";
  render();
}

function addBox(event) {
  event.preventDefault();

  const name = normalizeText(boxNameInput.value);
  if (!name) {
    return;
  }

  const existingBox = boxes.find((box) => box.name.toLowerCase() === name.toLowerCase());
  if (existingBox) {
    selectBox(existingBox.id);
    boxForm.reset();
    return;
  }

  const newBox = createBox(name);
  boxes = [newBox, ...boxes];
  activeBoxId = newBox.id;
  saveState();
  boxForm.reset();
  render();
  spanishWordInput.focus();
}

function addWord(event) {
  event.preventDefault();

  const box = getActiveBox();
  const spanish = normalizeText(spanishWordInput.value);
  const translation = normalizeText(translationInput.value);

  if (!box || !spanish || !translation) {
    return;
  }

  box.words = [
    {
      id: crypto.randomUUID(),
      spanish,
      translation,
      createdAt: Date.now()
    },
    ...box.words
  ];

  saveState();
  renderWords();
  renderBoxes();
  wordForm.reset();
  spanishWordInput.focus();
}

function deleteWord(id) {
  const box = getActiveBox();
  if (!box) {
    return;
  }

  box.words = box.words.filter((item) => item.id !== id);
  saveState();
  render();
}

function clearBox() {
  const box = getActiveBox();
  if (!box || !box.words.length) {
    return;
  }

  const confirmed = window.confirm(`¿Vaciar todas las palabras de "${box.name}"?`);
  if (!confirmed) {
    return;
  }

  box.words = [];
  saveState();
  storyOutput.textContent = "Guarda al menos tres palabras en esta caja y pulsa generar.";
  render();
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function articleFor(word) {
  const cleanWord = word.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const feminineEndings = ["a", "dad", "tad", "cion", "sion", "umbre"];
  return feminineEndings.some((ending) => cleanWord.endsWith(ending)) ? "la" : "el";
}

function sentenceForWord(item, index) {
  const word = item.spanish;
  const article = articleFor(word);
  const templates = [
    `Al entrar, vio ${article} ${word} sobre la mesa y entendió por qué todos hablaban en voz baja.`,
    `Después, ${article} ${word} cambió el plan: nadie podía continuar la aventura sin acercarse y observarlo bien.`,
    `En la esquina apareció ${article} ${word}, tan importante que el grupo decidió protegerlo hasta el final.`,
    `Cuando parecía que todo estaba perdido, ${article} ${word} ayudó a resolver el problema de una forma inesperada.`,
    `Antes de salir, cada estudiante tuvo que usar ${article} ${word} en una acción concreta para demostrar que lo había comprendido.`
  ];

  return templates[index % templates.length];
}

function generateStory() {
  const box = getActiveBox();
  const words = getActiveWords();

  if (!box || words.length < 3) {
    storyOutput.textContent = "Guarda al menos tres palabras en esta caja para generar una historia con contexto.";
    return;
  }

  const selected = shuffle(words).slice(0, Math.min(8, words.length));
  const places = [
    "una clase de español que se había convertido en una aventura",
    "un mercado donde cada puesto escondía una sorpresa",
    "una biblioteca en la que los libros se movían solos",
    "un viaje de intercambio lleno de malentendidos divertidos"
  ];
  const characters = [
    "Lina, una estudiante curiosa",
    "Amir, que siempre hacía preguntas difíciles",
    "Sofía, la compañera que tomaba notas de todo",
    "Mateo, que aprendía mejor cuando algo salía mal"
  ];
  const ending = pickRandom([
    "Al final, la caja dejó de ser una lista y se convirtió en un recuerdo completo.",
    "Desde entonces, cuando repasaban la caja, recordaban la escena como si la hubieran vivido.",
    "Y así, sin darse cuenta, el grupo aprendió el vocabulario dentro de una historia.",
    "La profesora sonrió, porque las palabras ya no estaban sueltas: tenían contexto."
  ]);

  const storySentences = selected.map(sentenceForWord).join(" ");
  const glossary = selected.map((item) => `${item.spanish}: ${item.translation}`).join(" | ");
  const paragraphs = [
    `En ${pickRandom(places)}, ${pickRandom(characters)} abrió la caja "${box.name}" y encontró una historia escondida.`,
    storySentences,
    ending,
    glossary
  ];

  storyOutput.innerHTML = "";
  paragraphs.forEach((text, index) => {
    const paragraph = document.createElement("p");
    paragraph.textContent = text;

    if (index === paragraphs.length - 1) {
      paragraph.className = "story-glossary";
    }

    storyOutput.append(paragraph);
  });
}

boxForm.addEventListener("submit", addBox);
wordForm.addEventListener("submit", addWord);
clearBoxButton.addEventListener("click", clearBox);
generateStoryButton.addEventListener("click", generateStory);

render();
