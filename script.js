
"use strict";

"use strict";

// ==============================
// سیستم صوتی Neon Arena
// ==============================

let audioContext = null;

function initAudio() {
  if (!audioContext) {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (AudioContextClass) {
      audioContext = new AudioContextClass();
    }
  }

  if (audioContext && audioContext.state === "suspended") {
    audioContext.resume();
  }
}

// ساخت صدای الکترونیکی
function playTone(frequency, duration, type = "sine", volume = 0.08, delay = 0) {
  if (!audioContext) return;

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const startTime = audioContext.currentTime + delay;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);

  gain.gain.setValueAtTime(0.001, startTime);
  gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.02);
}

// صدای کلیک دکمه
function playClickSound() {
  playTone(650, 0.07, "square", 0.035);
  playTone(950, 0.05, "sine", 0.025, 0.04);
}

// صدای برد
function playWinSound() {
  playTone(523, 0.13, "sine", 0.07, 0);
  playTone(659, 0.13, "sine", 0.07, 0.12);
  playTone(784, 0.18, "sine", 0.08, 0.24);
  playTone(1047, 0.28, "sine", 0.08, 0.38);
}

// صدای باخت
function playLoseSound() {
  playTone(400, 0.16, "triangle", 0.07, 0);
  playTone(320, 0.19, "triangle", 0.07, 0.15);
  playTone(240, 0.28, "triangle", 0.07, 0.32);
}

// صدای مساوی
function playDrawSound() {
  playTone(440, 0.12, "sine", 0.06, 0);
  playTone(440, 0.12, "sine", 0.06, 0.17);
}

// صدای شروع مجدد
function playResetSound() {
  playTone(700, 0.09, "sine", 0.06, 0);
  playTone(900, 0.12, "sine", 0.06, 0.09);
}

// عناصر صفحه
const playerScoreElement = document.getElementById("playerScore");
const computerScoreElement = document.getElementById("computerScore");
const roundCountElement = document.getElementById("roundCount");

const playerChoiceElement = document.getElementById("playerChoice");
const computerChoiceElement = document.getElementById("computerChoice");

const playerChoiceName = document.getElementById("playerChoiceName");
const computerChoiceName = document.getElementById("computerChoiceName");

const resultBox = document.getElementById("resultBox");
const resultTitle = document.getElementById("resultTitle");
const resultMessage = document.getElementById("resultMessage");

const choiceButtons = document.querySelectorAll(".choice-button");
const resetButton = document.getElementById("resetButton");

// گزینه‌های بازی
const choices = {
  rock: {
    emoji: "🪨",
    name: "سنگ"
  },
  paper: {
    emoji: "📄",
    name: "کاغذ"
  },
  scissors: {
    emoji: "✂️",
    name: "قیچی"
  }
};

// وضعیت بازی
let playerScore = 0;
let computerScore = 0;
let roundCount = 0;
let isPlaying = false;

// انتخاب تصادفی کامپیوتر
function getComputerChoice() {
  const options = Object.keys(choices);
  const randomIndex = Math.floor(Math.random() * options.length);

  return options[randomIndex];
}

// تشخیص نتیجه
function getResult(player, computer) {
  if (player === computer) {
    return "draw";
  }

  const winningMoves = {
    rock: "scissors",
    paper: "rock",
    scissors: "paper"
  };

  return winningMoves[player] === computer ? "win" : "lose";
}

// فعال یا غیرفعال کردن دکمه‌ها
function setButtonsDisabled(disabled) {
  choiceButtons.forEach((button) => {
    button.disabled = disabled;
  });
}

// نمایش انتخاب‌ها
function showChoices(player, computer) {
  playerChoiceElement.textContent = choices[player].emoji;
  computerChoiceElement.textContent = choices[computer].emoji;

  playerChoiceName.textContent = choices[player].name;
  computerChoiceName.textContent = choices[computer].name;

  [playerChoiceElement, computerChoiceElement].forEach((element) => {
    element.classList.remove("pop");

    // راه‌اندازی دوباره انیمیشن
    void element.offsetWidth;

    element.classList.add("pop");
  });
}

// نمایش نتیجه
function showResult(result, player, computer) {
  resultBox.classList.remove("win", "lose", "draw");

  if (result === "win") {
    resultBox.classList.add("win");
    resultTitle.textContent = "🎉 آفرین قهرمان!";
    resultMessage.textContent =
      `${choices[player].name}، ${choices[computer].name} را شکست داد! یک امتیاز گرفتی.`;
  } else if (result === "lose") {
    resultBox.classList.add("lose");
    resultTitle.textContent = "🤖 این دور را باختی!";
    resultMessage.textContent =
      `${choices[computer].name}، ${choices[player].name} را شکست داد. دور بعدی جبران کن!`;
  } else {
    resultBox.classList.add("draw");
    resultTitle.textContent = "🤝 مساوی شد!";
    resultMessage.textContent =
      `هر دو ${choices[player].name} آوردید. این دور امتیازی ندارد.`;
  }
}

// به‌روزرسانی امتیازها
function updateScoreboard() {
  playerScoreElement.textContent = playerScore;
  computerScoreElement.textContent = computerScore;
  roundCountElement.textContent = `دور ${roundCount}`;
}

// اجرای یک دور بازی
function playRound(playerChoice) {
  if (isPlaying || !Object.hasOwn(choices, playerChoice)) {
    return;
  }

  isPlaying = true;
  setButtonsDisabled(true);

  const computerChoice = getComputerChoice();

  // ثبت انتخاب‌ها
  showChoices(playerChoice, computerChoice);

  // تعیین برنده
  const result = getResult(playerChoice, computerChoice);

  // به‌روزرسانی امتیاز
  roundCount++;

  if (result === "win") {
    playerScore++;
  } else if (result === "lose") {
    computerScore++;
  }

  updateScoreboard();
  showResult(result, playerChoice, computerChoice);

if (result === "win") {
  playWinSound();
} else if (result === "lose") {
  playLoseSound();
} else {
  playDrawSound();
}

  // پایان پردازش این دور
  isPlaying = false;
  setButtonsDisabled(false);
}

// اتصال دکمه‌ها به بازی

choiceButtons.forEach((button) => {
  button.addEventListener("click", () => {
    initAudio();
    playClickSound();

    const playerChoice = button.dataset.choice;
    playRound(playerChoice);
  });
});


// شروع مجدد

resetButton.addEventListener("click", () => {
  if (isPlaying) {
    return;
  }

  initAudio();
  playResetSound();


  playerScore = 0;
  computerScore = 0;
  roundCount = 0;

  playerChoiceElement.textContent = "❔";
  computerChoiceElement.textContent = "❔";

  playerChoiceName.textContent = "منتظر انتخاب...";
  computerChoiceName.textContent = "منتظر شروع...";

  resultBox.classList.remove("win", "lose", "draw");

  resultTitle.textContent = "بازی از نو شروع شد!";
  resultMessage.textContent = "یکی از گزینه‌های زیر را انتخاب کن.";

  updateScoreboard();
});

// نمایش وضعیت اولیه
updateScoreboard();
