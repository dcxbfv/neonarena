
"use strict";

// ==========================================
// NEON ARENA - Rock Paper Scissors
// Target Score Tournament Edition
// ==========================================


// ---------- سیستم صوتی ----------
let audioContext = null;
let soundEnabled = true;

function initAudio() {
  if (!audioContext) {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return;

    try {
      audioContext = new AudioContextClass();
    } catch (error) {
      console.warn("سیستم صوتی در دسترس نیست:", error);
      return;
    }
  }

  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }
}

function playTone(
  frequency,
  duration,
  type = "sine",
  volume = 0.06,
  delay = 0
) {
  if (!soundEnabled || !audioContext) return;

  try {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const startTime = audioContext.currentTime + delay;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.exponentialRampToValueAtTime(
      volume,
      startTime + 0.015
    );
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      startTime + duration
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.03);

    oscillator.addEventListener(
      "ended",
      () => {
        oscillator.disconnect();
        gain.disconnect();
      },
      { once: true }
    );
  } catch (error) {
    console.warn("پخش صدا ناموفق بود:", error);
  }
}

function playClickSound() {
  playTone(650, 0.07, "square", 0.025);
  playTone(950, 0.05, "sine", 0.025, 0.04);
}

function playWinSound() {
  playTone(523, 0.13, "sine", 0.06, 0);
  playTone(659, 0.13, "sine", 0.06, 0.12);
  playTone(784, 0.18, "sine", 0.07, 0.24);
  playTone(1047, 0.28, "sine", 0.07, 0.38);
}

function playLoseSound() {
  playTone(400, 0.16, "triangle", 0.06, 0);
  playTone(320, 0.19, "triangle", 0.06, 0.15);
  playTone(240, 0.28, "triangle", 0.06, 0.32);
}

function playDrawSound() {
  playTone(440, 0.12, "sine", 0.05, 0);
  playTone(440, 0.12, "sine", 0.05, 0.17);
}

function playResetSound() {
  playTone(700, 0.09, "sine", 0.05, 0);
  playTone(900, 0.12, "sine", 0.05, 0.09);
}


// ---------- عناصر HTML ----------
const playerScoreElement =
  document.getElementById("playerScore");

const computerScoreElement =
  document.getElementById("computerScore");

const roundCountElement =
  document.getElementById("roundCount");

const playerChoiceElement =
  document.getElementById("playerChoice");

const computerChoiceElement =
  document.getElementById("computerChoice");

const playerChoiceName =
  document.getElementById("playerChoiceName");

const computerChoiceName =
  document.getElementById("computerChoiceName");

const resultBox =
  document.getElementById("resultBox");

const resultTitle =
  document.getElementById("resultTitle");

const resultMessage =
  document.getElementById("resultMessage");

const choiceButtons =
  document.querySelectorAll(".choice-button");

const resetButton =
  document.getElementById("resetButton");

const soundToggle =
  document.getElementById("soundToggle");

const soundIcon =
  document.getElementById("soundIcon");

const soundText =
  document.getElementById("soundText");

const difficultySelect =
  document.getElementById("difficultySelect");

const difficultyHint =
  document.getElementById("difficultyHint");

const targetScoreInput =
  document.getElementById("targetScore");

const targetScoreHint =
  document.getElementById("targetScoreHint");


// ---------- گزینه‌های بازی ----------
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


// ---------- وضعیت بازی ----------
let playerScore = 0;
let computerScore = 0;
let roundCount = 0;

let isPlaying = false;
let gameOver = false;
let targetScore = 10;


// ---------- امتیاز هدف ----------
function readTargetScore() {
  const value = Number(targetScoreInput.value);

  if (
    !Number.isSafeInteger(value) ||
    value < 1 ||
    value > 999
  ) {
    return null;
  }

  return value;
}

function updateTargetHint(message) {
  if (targetScoreHint) {
    targetScoreHint.textContent = message;
  }
}

function handleTargetScoreChange() {
  if (roundCount > 0 || gameOver || isPlaying) {
    targetScoreInput.value = String(targetScore);

    updateTargetHint(
      `هدف این مسابقه ${targetScore} امتیاز است. برای تغییر، بازی را از نو شروع کن.`
    );

    return;
  }

  const value = readTargetScore();

  if (value === null) {
    targetScoreInput.value = String(targetScore);

    updateTargetHint(
      "عدد هدف باید یک عدد صحیح بین 1 تا 999 باشد."
    );

    return;
  }

  targetScore = value;
  targetScoreInput.value = String(targetScore);

  updateTargetHint(
    `مسابقه تا رسیدن به ${targetScore} امتیاز ادامه دارد.`
  );
}

targetScoreInput.addEventListener(
  "change",
  handleTargetScoreChange
);

targetScoreInput.addEventListener("input", () => {
  if (roundCount > 0 || gameOver || isPlaying) {
    targetScoreInput.value = String(targetScore);
    return;
  }

  const value = readTargetScore();

  if (value !== null) {
    targetScore = value;

    updateTargetHint(
      `مسابقه تا رسیدن به ${targetScore} امتیاز ادامه دارد.`
    );
  }
});


// ---------- انتخاب کامپیوتر ----------
function getComputerChoice(playerChoice) {
  const counterMoves = {
    rock: "paper",
    paper: "scissors",
    scissors: "rock"
  };

  const difficulty = difficultySelect
    ? difficultySelect.value
    : "medium";

  const counterProbability = {
    easy: 0.20,
    medium: 0.50,
    hard: 0.80
  };

  const probability =
    counterProbability[difficulty] ?? 0.50;

  // احتمال انتخاب حرکت برنده
  if (Math.random() < probability) {
    return counterMoves[playerChoice];
  }

  // انتخاب بین حرکت مساوی و حرکت بازنده
  const otherMoves = Object.keys(choices).filter(
    (move) => move !== counterMoves[playerChoice]
  );

  const randomIndex = Math.floor(
    Math.random() * otherMoves.length
  );

  return otherMoves[randomIndex];
}


// ---------- تشخیص نتیجه ----------
function getResult(player, computer) {
  if (player === computer) {
    return "draw";
  }

  const winningMoves = {
    rock: "scissors",
    paper: "rock",
    scissors: "paper"
  };

  return winningMoves[player] === computer
    ? "win"
    : "lose";
}


// ---------- کنترل دکمه‌ها ----------
function setButtonsDisabled(disabled) {
  choiceButtons.forEach((button) => {
    button.disabled = disabled;
  });
}


// ---------- نمایش انتخاب‌ها ----------
function showChoices(player, computer) {
  playerChoiceElement.textContent =
    choices[player].emoji;

  computerChoiceElement.textContent =
    choices[computer].emoji;

  playerChoiceName.textContent =
    choices[player].name;

  computerChoiceName.textContent =
    choices[computer].name;

  [
    playerChoiceElement,
    computerChoiceElement
  ].forEach((element) => {
    element.classList.remove("pop");

    // اجرای دوباره انیمیشن
    void element.offsetWidth;

    element.classList.add("pop");
  });
}


// ---------- نمایش نتیجه هر دور ----------
function showResult(result, player, computer) {
  resultBox.classList.remove("win", "lose", "draw");

  if (result === "win") {
    resultBox.classList.add("win");

    resultTitle.textContent =
      "🎉 آفرین قهرمان!";

    resultMessage.textContent =
      `${choices[player].name}، ${choices[computer].name} را شکست داد! یک امتیاز گرفتی.`;

    playWinSound();

  } else if (result === "lose") {
    resultBox.classList.add("lose");

    resultTitle.textContent =
      "🤖 این دور را باختی!";

    resultMessage.textContent =
      `${choices[computer].name}، ${choices[player].name} را شکست داد. دور بعدی جبران کن!`;

    playLoseSound();

  } else {
    resultBox.classList.add("draw");

    resultTitle.textContent =
      "🤝 مساوی شد!";

    resultMessage.textContent =
      `هر دو ${choices[player].name} آوردید. این دور امتیازی ندارد.`;

    playDrawSound();
  }
}


// ---------- به‌روزرسانی امتیازها با رقم انگلیسی ----------
function updateScoreboard() {
  playerScoreElement.textContent =
    String(playerScore);

  computerScoreElement.textContent =
    String(computerScore);

  roundCountElement.textContent =
    `دور ${String(roundCount)}`;
}


// ---------- بررسی قهرمان مسابقه ----------
function checkMatchWinner() {
  if (playerScore >= targetScore) {
    gameOver = true;

    resultBox.classList.remove("win", "lose", "draw");
    resultBox.classList.add("win");

    resultTitle.textContent =
      "🏆 قهرمان مسابقه شدی!";

    resultMessage.textContent =
      `تبریک! با ${playerScore} امتیاز برنده شدی. کامپیوتر ${computerScore} امتیاز دارد.`;

    updateTargetHint(
      `🏆 تو با ${playerScore} امتیاز قهرمان شدی!`
    );

    return true;
  }

  if (computerScore >= targetScore) {
    gameOver = true;

    resultBox.classList.remove("win", "lose", "draw");
    resultBox.classList.add("lose");

    resultTitle.textContent =
      "🤖 کامپیوتر قهرمان شد!";

    resultMessage.textContent =
      `کامپیوتر با ${computerScore} امتیاز برنده شد. امتیاز تو ${playerScore} است. دوباره تلاش کن!`;

    updateTargetHint(
      `🤖 کامپیوتر با ${computerScore} امتیاز قهرمان شد.`
    );

    return true;
  }

  return false;
}


// ---------- اجرای یک دور ----------
function playRound(playerChoice) {
  if (
    isPlaying ||
    gameOver ||
    !Object.prototype.hasOwnProperty.call(
      choices,
      playerChoice
    )
  ) {
    return;
  }

  isPlaying = true;
  setButtonsDisabled(true);

  try {
    const computerChoice =
      getComputerChoice(playerChoice);

    showChoices(playerChoice, computerChoice);

    const result =
      getResult(playerChoice, computerChoice);

    roundCount++;

    if (result === "win") {
      playerScore++;
    } else if (result === "lose") {
      computerScore++;
    }

    updateScoreboard();

    showResult(
      result,
      playerChoice,
      computerChoice
    );

    // قفل هدف پس از شروع مسابقه
    targetScoreInput.disabled = true;

    // بررسی اینکه آیا مسابقه تمام شده است
    checkMatchWinner();

    if (!gameOver) {
      updateTargetHint(
        `هدف: ${targetScore} | تو: ${playerScore} | کامپیوتر: ${computerScore}`
      );
    }

  } catch (error) {
    console.error("خطا در اجرای بازی:", error);

    resultTitle.textContent =
      "خطایی رخ داد!";

    resultMessage.textContent =
      "صفحه را رفرش کن و دوباره امتحان کن.";

  } finally {
    isPlaying = false;

    // بعد از پایان مسابقه، انتخاب‌ها غیرفعال می‌مانند
    setButtonsDisabled(gameOver);
  }
}


// ---------- دکمه‌های سنگ، کاغذ و قیچی ----------
choiceButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (isPlaying || gameOver) return;

    initAudio();
    playClickSound();

    const playerChoice = button.dataset.choice;

    playRound(playerChoice);
  });
});


// ---------- شروع مجدد مسابقه ----------
resetButton.addEventListener("click", () => {
  if (isPlaying) return;

  initAudio();

  // خواندن هدف معتبر واردشده
  const enteredValue = readTargetScore();

  if (enteredValue !== null) {
    targetScore = enteredValue;
  }

  // صفر کردن امتیازها و دورها
  playerScore = 0;
  computerScore = 0;
  roundCount = 0;

  gameOver = false;

  // بازگرداندن انتخاب‌ها
  playerChoiceElement.textContent = "❔";
  computerChoiceElement.textContent = "❔";

  playerChoiceName.textContent =
    "منتظر انتخاب...";

  computerChoiceName.textContent =
    "منتظر شروع...";

  // بازگرداندن ظاهر نتیجه
  resultBox.classList.remove("win", "lose", "draw");

  resultTitle.textContent =
    "بازی از نو شروع شد!";

  resultMessage.textContent =
    "یکی از گزینه‌های زیر را انتخاب کن.";

  // باز کردن کادر هدف برای مسابقه جدید
  targetScoreInput.disabled = false;
  targetScoreInput.value = String(targetScore);

  updateTargetHint(
    `مسابقه تا رسیدن به ${targetScore} امتیاز ادامه دارد.`
  );

  setButtonsDisabled(false);
  updateScoreboard();

  playResetSound();
});


// ---------- روشن و خاموش کردن صدا ----------
function updateSoundButton() {
  if (!soundToggle || !soundIcon || !soundText) {
    return;
  }

  soundToggle.classList.toggle(
    "muted",
    !soundEnabled
  );

  soundIcon.textContent =
    soundEnabled ? "🔊" : "🔇";

  soundText.textContent =
    soundEnabled ? "صدا روشن" : "صدا خاموش";

  soundToggle.setAttribute(
    "aria-pressed",
    String(soundEnabled)
  );

  soundToggle.setAttribute(
    "aria-label",
    soundEnabled
      ? "خاموش کردن صدا"
      : "روشن کردن صدا"
  );
}

if (soundToggle) {
  soundToggle.addEventListener("click", () => {
    soundEnabled = !soundEnabled;

    if (soundEnabled) {
      initAudio();
    }

    updateSoundButton();

    if (soundEnabled) {
      playResetSound();
    }
  });
}


// ---------- درجه سختی ----------
if (difficultySelect && difficultyHint) {
  function updateDifficultyHint() {
    const hints = {
      easy:
        "🟢 کامپیوتر 20٪ مواقع حرکت برنده را انتخاب می‌کند.",

      medium:
        "🟣 کامپیوتر 50٪ مواقع حرکت برنده را انتخاب می‌کند.",

      hard:
        "🔴 کامپیوتر 80٪ مواقع حرکت برنده را انتخاب می‌کند!"
    };

    difficultyHint.textContent =
      hints[difficultySelect.value] || hints.medium;
  }

  difficultySelect.addEventListener(
    "change",
    updateDifficultyHint
  );

  updateDifficultyHint();
}


// ---------- آماده‌سازی اولیه ----------
const initialTarget = readTargetScore();

if (initialTarget !== null) {
  targetScore = initialTarget;
} else {
  targetScore = 10;
  targetScoreInput.value = "10";
}

targetScoreInput.disabled = false;

updateTargetHint(
  `مسابقه تا رسیدن به ${targetScore} امتیاز ادامه دارد.`
);

updateScoreboard();
updateSoundButton();
setButtonsDisabled(false);
