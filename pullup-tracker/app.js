const DAILY_GOAL = 200;
const PULLUPS_PER_MINUTE = 5;
const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbxtaqqUI6MhjsR3nw6dOYjzcn9CXaHbs_7qgB4AErx29gwHbIsF9U_j5C5dLxQc_WR4/exec";

let timer = null;
let totalSeconds = 600;
let remainingSeconds = 600;
let session = 0;

let goal = Number(localStorage.getItem("goal")) || 69168;
let bestReps = Number(localStorage.getItem("bestReps")) || 0;
let bestWeight = Number(localStorage.getItem("bestWeight")) || 0;
let log = JSON.parse(localStorage.getItem("pullupLog")) || [];

function showTab(tabId, button) {
  document.querySelectorAll(".tab-page").forEach(tab => tab.classList.remove("active"));
  document.querySelectorAll(".tab-button").forEach(btn => btn.classList.remove("active"));

  document.getElementById(tabId).classList.add("active");
  button.classList.add("active");
}

function save() {
  localStorage.setItem("goal", goal);
  localStorage.setItem("bestReps", bestReps);
  localStorage.setItem("bestWeight", bestWeight);
  localStorage.setItem("pullupLog", JSON.stringify(log));
}

function getTotalPullups() {
  return log.reduce((sum, entry) => sum + Number(entry.amount), 0);
}

function getTodayDate() {
  return new Date().toLocaleDateString();
}

function getTimeNow() {
  const now = new Date();

  return {
    id: Date.now(),
    date: now.toLocaleDateString(),
    time: now.toLocaleTimeString()
  };
}

function getDailyTotals() {
  const totals = {};

  log.forEach(entry => {
    if (!totals[entry.date]) totals[entry.date] = 0;
    totals[entry.date] += Number(entry.amount);
  });

  return totals;
}

async function sendToGoogleSheet(entry) {
  try {
    await fetch(GOOGLE_SHEET_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(entry)
    });
  } catch (error) {
    console.log("Google Sheet sync failed:", error);
  }
}

function addLog(amount, source, weight = "") {
  const now = getTimeNow();
  const totalAfterEntry = getTotalPullups() + Number(amount);

  const entry = {
    id: now.id,
    date: now.date,
    time: now.time,
    amount: Number(amount),
    source: source,
    weight: weight || "Bodyweight",
    total: totalAfterEntry
  };

  log.unshift(entry);

  save();
  renderAll();

  sendToGoogleSheet(entry);
}

function deleteLog(id) {
  log = log.filter(entry => entry.id !== id);
  save();
  renderAll();
}

function updateGoalPage() {
  const total = getTotalPullups();

  document.getElementById("totalDisplay").textContent = total;
  document.getElementById("goalDisplay").textContent = goal;
  document.getElementById("goalInput").value = goal;

  const remaining = Math.max(goal - total, 0);
  const percent = goal > 0 ? Math.min((total / goal) * 100, 100) : 0;

  document.getElementById("remainingGoalDisplay").textContent = remaining;
  document.getElementById("percentDisplay").textContent = percent.toFixed(2) + "%";
  document.getElementById("progressFill").style.width = percent + "%";

  const dailyTotals = getDailyTotals();
  const todayAmount = dailyTotals[getTodayDate()] || 0;
  const dailyRemaining = Math.max(DAILY_GOAL - todayAmount, 0);
  const dailyPercent = Math.min((todayAmount / DAILY_GOAL) * 100, 100);

  document.getElementById("todayDisplay").textContent = todayAmount;
  document.getElementById("dailyRemainingDisplay").textContent = dailyRemaining;
  document.getElementById("dailyPercentDisplay").textContent = dailyPercent.toFixed(2) + "%";
  document.getElementById("dailyProgressFill").style.width = dailyPercent + "%";

  document.getElementById("sessionDisplay").textContent = session;
  document.getElementById("bestRepsDisplay").textContent = bestReps;
  document.getElementById("bestWeightDisplay").textContent = bestWeight;
}

function renderLog() {
  const logDiv = document.getElementById("log");
  logDiv.innerHTML = "";

  if (log.length === 0) {
    logDiv.innerHTML = "<p>No pullups logged yet.</p>";
    return;
  }

  log.forEach(entry => {
    const item = document.createElement("div");
    item.className = "log-item";

    item.innerHTML = `
      <div class="log-top">
        <div>
          <strong>${entry.date}</strong> at <strong>${entry.time}</strong>
        </div>
        <button class="delete-log" onclick="deleteLog(${entry.id})">Remove</button>
      </div>

      <p>Amount: <strong>${entry.amount}</strong> pullups</p>
      <p>Weight: <strong>${entry.weight}</strong></p>
      <p>Source: <strong>${entry.source}</strong></p>
      <p class="log-total">Running Total At Entry: ${entry.total || getTotalPullups()}</p>
    `;

    logDiv.appendChild(item);
  });
}

function saveGoal() {
  const val = parseInt(document.getElementById("goalInput").value);

  if (!val || val <= 0) return;

  goal = val;
  save();
  renderAll();
}

function addManual() {
  const pullupInput = document.getElementById("manualInput");
  const weightInput = document.getElementById("weightInput");

  const amount = parseInt(pullupInput.value);
  const weight = weightInput.value ? `${weightInput.value} lbs` : "Bodyweight";

  if (!amount || amount <= 0) return;

  session += amount;
  addLog(amount, "Manual", weight);

  pullupInput.value = "";
}

function savePR() {
  const repsInput = document.getElementById("maxRepsInput");
  const weightInput = document.getElementById("maxWeightInput");

  const reps = parseInt(repsInput.value);
  const weight = parseInt(weightInput.value);

  if (reps && reps > bestReps) bestReps = reps;
  if (weight && weight > bestWeight) bestWeight = weight;

  repsInput.value = "";
  weightInput.value = "";

  save();
  renderAll();
}

function setTime() {
  const minutes = parseInt(document.getElementById("minutesInput").value) || 0;
  const seconds = parseInt(document.getElementById("secondsInput").value) || 0;

  totalSeconds = minutes * 60 + seconds;
  remainingSeconds = totalSeconds;

  updateTimerDisplay();
}

function updateTimerDisplay() {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  document.getElementById("display").textContent =
    `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function ding() {
  const audio = new (window.AudioContext || window.webkitAudioContext)();
  const osc = audio.createOscillator();
  const gain = audio.createGain();

  osc.frequency.value = 900;
  gain.gain.value = 0.4;

  osc.connect(gain);
  gain.connect(audio.destination);

  osc.start();
  osc.stop(audio.currentTime + 0.3);
}

function addMinutePullups() {
  session += PULLUPS_PER_MINUTE;
  addLog(PULLUPS_PER_MINUTE, "Timer", "Bodyweight");
}

function startTimer() {
  if (timer) return;

  if (remainingSeconds <= 0) {
    setTime();
  }

  ding();

  timer = setInterval(() => {
    remainingSeconds--;

    // NORMAL minute ticks
    if (remainingSeconds > 0 && remainingSeconds % 60 === 0) {
      ding();
      addMinutePullups();
    }

    // TIMER END
    if (remainingSeconds <= 0) {
      remainingSeconds = 0;
      updateTimerDisplay();

      // 👇 THIS FIXES YOUR PROBLEM
      // Add final minute if total time was >= 60 seconds
      if (totalSeconds >= 60) {
        addMinutePullups();
      }

      ding();
      clearInterval(timer);
      timer = null;
      return;
    }

    updateTimerDisplay();
  }, 1000);
}

function pauseTimer() {
  clearInterval(timer);
  timer = null;
}

function resetTimer() {
  clearInterval(timer);
  timer = null;
  session = 0;
  setTime();
  renderAll();
}

function clearLog() {
  const confirmed = confirm("Are you sure you want to clear the entire log?");
  if (!confirmed) return;

  log = [];
  save();
  renderAll();
}

function downloadLog() {
  let text = "Pullup Log\n\n";

  log.forEach(entry => {
    text += `${entry.date} ${entry.time} | ${entry.amount} pullups | ${entry.weight} | ${entry.source} | Total: ${entry.total}\n`;
  });

  const blob = new Blob([text], { type: "text/plain" });
  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = "pullup_log.txt";
  link.click();
}

/* STATS PAGE */

function getSortedDailyData() {
  const totals = getDailyTotals();

  return Object.keys(totals)
    .map(date => ({
      date,
      amount: totals[date]
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

function getLastSevenDaysData() {
  const totals = getDailyTotals();
  const days = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);

    const date = d.toLocaleDateString();

    days.push({
      date,
      amount: totals[date] || 0
    });
  }

  return days;
}

function calculateStreak() {
  const totals = getDailyTotals();
  let streak = 0;

  for (let i = 0; i < 365; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);

    const date = d.toLocaleDateString();
    const amount = totals[date] || 0;

    if (amount >= DAILY_GOAL) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function updateStatsBoxes() {
  const dailyData = getSortedDailyData();

  const avgDisplay = document.getElementById("avgPerDayDisplay");
  const bestDisplay = document.getElementById("bestDayDisplay");
  const goalDaysDisplay = document.getElementById("goalDaysDisplay");
  const streakDisplay = document.getElementById("streakDisplay");

  if (!avgDisplay || !bestDisplay || !goalDaysDisplay || !streakDisplay) return;

  if (dailyData.length === 0) {
    avgDisplay.textContent = "0";
    bestDisplay.textContent = "0";
    goalDaysDisplay.textContent = "0";
    streakDisplay.textContent = "0";
    return;
  }

  const totalAmount = dailyData.reduce((sum, day) => sum + day.amount, 0);
  const avg = totalAmount / dailyData.length;
  const best = Math.max(...dailyData.map(day => day.amount));
  const goalDays = dailyData.filter(day => day.amount >= DAILY_GOAL).length;
  const streak = calculateStreak();

  avgDisplay.textContent = avg.toFixed(1);
  bestDisplay.textContent = best;
  goalDaysDisplay.textContent = goalDays;
  streakDisplay.textContent = streak;
}

function drawDailyChart() {
  const canvas = document.getElementById("dailyChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const data = getLastSevenDaysData();

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const padding = 45;
  const chartWidth = canvas.width - padding * 2;
  const chartHeight = canvas.height - padding * 2;
  const maxValue = Math.max(...data.map(d => d.amount), DAILY_GOAL, 1);

  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  ctx.fillText("Last 7 Days Compared to Daily Goal", padding, 25);

  ctx.strokeStyle = "#666";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, canvas.height - padding);
  ctx.lineTo(canvas.width - padding, canvas.height - padding);
  ctx.stroke();

  const goalY = canvas.height - padding - (DAILY_GOAL / maxValue) * chartHeight;

  ctx.strokeStyle = "#facc15";
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(padding, goalY);
  ctx.lineTo(canvas.width - padding, goalY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#facc15";
  ctx.font = "12px Arial";
  ctx.fillText("200 goal", canvas.width - padding - 60, goalY - 6);

  const barGap = 12;
  const barWidth = chartWidth / data.length - barGap;

  data.forEach((day, i) => {
    const x = padding + i * (chartWidth / data.length) + barGap / 2;
    const barHeight = (day.amount / maxValue) * chartHeight;
    const y = canvas.height - padding - barHeight;

    ctx.fillStyle = day.amount >= DAILY_GOAL ? "#4ade80" : "#60a5fa";
    ctx.fillRect(x, y, barWidth, barHeight);

    ctx.fillStyle = "white";
    ctx.font = "12px Arial";
    ctx.fillText(day.amount, x + barWidth / 2 - 10, y - 6);

    const shortDate = day.date.split("/").slice(0, 2).join("/");
    ctx.fillText(shortDate, x + 5, canvas.height - 18);
  });
}

function drawCumulativeChart() {
  const canvas = document.getElementById("cumulativeChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const data = getSortedDailyData();

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const padding = 45;
  const chartWidth = canvas.width - padding * 2;
  const chartHeight = canvas.height - padding * 2;

  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  ctx.fillText("Cumulative Pullups Over Time", padding, 25);

  if (data.length === 0) {
    ctx.font = "14px Arial";
    ctx.fillText("No data yet", padding, 60);
    return;
  }

  let running = 0;
  const cumulative = data.map(day => {
    running += day.amount;
    return {
      date: day.date,
      total: running
    };
  });

  const maxValue = Math.max(goal, running, 1);

  ctx.strokeStyle = "#666";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, canvas.height - padding);
  ctx.lineTo(canvas.width - padding, canvas.height - padding);
  ctx.stroke();

  ctx.strokeStyle = "#4ade80";
  ctx.lineWidth = 3;
  ctx.beginPath();

  cumulative.forEach((point, i) => {
    const x = padding + (cumulative.length === 1 ? chartWidth / 2 : (i / (cumulative.length - 1)) * chartWidth);
    const y = canvas.height - padding - (point.total / maxValue) * chartHeight;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();

  cumulative.forEach((point, i) => {
    const x = padding + (cumulative.length === 1 ? chartWidth / 2 : (i / (cumulative.length - 1)) * chartWidth);
    const y = canvas.height - padding - (point.total / maxValue) * chartHeight;

    ctx.fillStyle = "#4ade80";
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  const goalY = canvas.height - padding - (goal / maxValue) * chartHeight;

  ctx.strokeStyle = "#facc15";
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(padding, goalY);
  ctx.lineTo(canvas.width - padding, goalY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#facc15";
  ctx.font = "12px Arial";
  ctx.fillText("Final Goal", canvas.width - padding - 70, goalY - 6);
}

function renderLastSevenDays() {
  const box = document.getElementById("lastSevenDays");
  if (!box) return;

  const data = getLastSevenDaysData();
  box.innerHTML = "";

  data.reverse().forEach(day => {
    const percent = Math.min((day.amount / DAILY_GOAL) * 100, 100);
    const remaining = Math.max(DAILY_GOAL - day.amount, 0);

    box.innerHTML += `
      <div class="day-row">
        <strong>${day.date}</strong><br>
        ${day.amount} / ${DAILY_GOAL} pullups — ${percent.toFixed(1)}% complete<br>
        Remaining: ${remaining}
      </div>
    `;
  });
}

function renderStats() {
  updateStatsBoxes();
  drawDailyChart();
  drawCumulativeChart();
  renderLastSevenDays();
}

function renderAll() {
  updateGoalPage();
  renderLog();
  renderStats();
}

document.getElementById("minutesInput").addEventListener("input", setTime);
document.getElementById("secondsInput").addEventListener("input", setTime);

setTime();
renderAll();
