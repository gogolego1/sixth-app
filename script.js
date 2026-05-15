const emotions = [
  { key: "joy", label: "기쁨" },
  { key: "sad", label: "슬픔" },
  { key: "hard", label: "힘듦" },
  { key: "fun", label: "즐거운" },
  { key: "fear", label: "두려움" }
];

let selectedEmotion = "joy";
let pieState = Array(100).fill("");

const pieChart = document.getElementById("pieChart");
const gradeBtn = document.getElementById("gradeBtn");
const resetBtn = document.getElementById("resetBtn");
const downloadBtn = document.getElementById("downloadBtn");
const resultBox = document.getElementById("resultBox");
const selectedEmotionText = document.getElementById("selected-emotion");
const paintedCountText = document.getElementById("painted-count");
const q1Live = document.getElementById("q1-live");

function getCountValues() {
  return {
    joy: Number(document.getElementById("count-joy").value) || 0,
    sad: Number(document.getElementById("count-sad").value) || 0,
    hard: Number(document.getElementById("count-hard").value) || 0,
    fun: Number(document.getElementById("count-fun").value) || 0,
    fear: Number(document.getElementById("count-fear").value) || 0
  };
}

function getRatioValues() {
  return {
    joy: Number(document.getElementById("ratio-joy").value) || 0,
    sad: Number(document.getElementById("ratio-sad").value) || 0,
    hard: Number(document.getElementById("ratio-hard").value) || 0,
    fun: Number(document.getElementById("ratio-fun").value) || 0,
    fear: Number(document.getElementById("ratio-fear").value) || 0
  };
}

function updateTotals() {
  const counts = getCountValues();
  const ratios = getRatioValues();

  const countTotal = Object.values(counts).reduce((a, b) => a + b, 0);
  const ratioTotal = Object.values(ratios).reduce((a, b) => a + b, 0);

  document.getElementById("count-total").value = countTotal;
  document.getElementById("ratio-total").value = ratioTotal;

  if (countTotal > 0) {
    q1Live.textContent = `전체 수는 ${countTotal}입니다. 이 전체를 기준으로 비율을 생각해 보세요.`;
  } else {
    q1Live.textContent = "수를 입력하면 합계가 자동으로 계산됩니다.";
  }
}

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (angleDeg - 90) * Math.PI / 180.0;
  return {
    x: cx + (r * Math.cos(rad)),
    y: cy + (r * Math.sin(rad))
  };
}

function createSlicePath(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    "Z"
  ].join(" ");
}

function createPieChart() {
  pieChart.innerHTML = "";

  const cx = 210;
  const cy = 210;
  const r = 170;

  for (let i = 0; i < 100; i++) {
    const startAngle = (360 / 100) * i;
    const endAngle = (360 / 100) * (i + 1);

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", createSlicePath(cx, cy, r, startAngle, endAngle));
    path.setAttribute("class", "slice");
    path.setAttribute("data-index", i);
    path.addEventListener("click", () => paintSlice(i));
    pieChart.appendChild(path);
  }

  const centerCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  centerCircle.setAttribute("cx", cx);
  centerCircle.setAttribute("cy", cy);
  centerCircle.setAttribute("r", 18);
  centerCircle.setAttribute("fill", "#ffffff");
  centerCircle.setAttribute("stroke", "#334155");
  centerCircle.setAttribute("stroke-width", "1");
  pieChart.appendChild(centerCircle);

  renderPieChart();
}

function paintSlice(index) {
  if (selectedEmotion === "erase") {
    pieState[index] = "";
  } else {
    pieState[index] = selectedEmotion;
  }
  renderPieChart();
}

function renderPieChart() {
  const slices = pieChart.querySelectorAll(".slice");
  slices.forEach((slice, index) => {
    slice.setAttribute("class", "slice");
    const emotion = pieState[index];
    if (emotion) {
      slice.classList.add(emotion);
    }
  });
  updatePaintSummary();
}

function updatePaintSummary() {
  const counts = {
    joy: 0,
    sad: 0,
    hard: 0,
    fun: 0,
    fear: 0
  };

  pieState.forEach((item) => {
    if (counts[item] !== undefined) counts[item]++;
  });

  document.getElementById("paint-joy").textContent = counts.joy;
  document.getElementById("paint-sad").textContent = counts.sad;
  document.getElementById("paint-hard").textContent = counts.hard;
  document.getElementById("paint-fun").textContent = counts.fun;
  document.getElementById("paint-fear").textContent = counts.fear;

  const painted = pieState.filter(v => v !== "").length;
  paintedCountText.textContent = `색칠한 조각: ${painted} / 100`;
}

function setupLegend() {
  const buttons = document.querySelectorAll(".legend-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedEmotion = btn.dataset.emotion;
      selectedEmotionText.textContent = `현재 선택: ${btn.textContent.trim()}`;
    });
  });
}

function calculateExpectedRatios(counts) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const expectedRatios = {
    joy: 0,
    sad: 0,
    hard: 0,
    fun: 0,
    fear: 0
  };

  if (total === 0) return { total, expectedRatios };

  emotions.forEach(({ key }) => {
    expectedRatios[key] = Math.round((counts[key] / total) * 100);
  });

  return { total, expectedRatios };
}

function gradeQuestion1() {
  const counts = getCountValues();
  const ratios = getRatioValues();
  const messages = [];
  const details = [];
  let score = 0;

  const { total, expectedRatios } = calculateExpectedRatios(counts);

  if (total > 0) {
    score += 10;
    details.push({ text: `전체 수를 입력했습니다. (총 ${total})`, wrong: false });
  } else {
    messages.push("먼저 각 감정의 수를 차분히 기록해 보세요.");
    details.push({ text: "전체 수가 0이어서 비율을 판단하기 어렵습니다.", wrong: true });
  }

  let filledCount = 0;
  emotions.forEach(({ key, label }) => {
    const countValue = document.getElementById(`count-${key}`).value;
    const ratioValue = document.getElementById(`ratio-${key}`).value;
    if (countValue !== "" && ratioValue !== "") {
      filledCount++;
    } else {
      details.push({ text: `${label} 항목에 빈칸이 있습니다.`, wrong: true });
    }
  });

  if (filledCount === 5) {
    score += 10;
    details.push({ text: "표를 빠짐없이 완성했습니다.", wrong: false });
  } else {
    messages.push("표의 빈칸이 없도록 끝까지 완성하는 습관을 길러 보세요.");
  }

  let correctRatioCount = 0;
  emotions.forEach(({ key, label }) => {
    if (ratios[key] === expectedRatios[key]) {
      correctRatioCount++;
      details.push({ text: `${label}의 비율을 알맞게 나타냈습니다.`, wrong: false });
    } else {
      details.push({ text: `${label}의 비율이 알맞지 않습니다. 전체와 부분의 관계를 다시 살펴보세요.`, wrong: true });
    }
  });
  score += correctRatioCount * 6;

  const ratioTotal = Object.values(ratios).reduce((a, b) => a + b, 0);
  if (ratioTotal >= 99 && ratioTotal <= 101) {
    score += 10;
    details.push({ text: `비율의 합이 전체에 가깝습니다. (${ratioTotal}%)`, wrong: false });
  } else {
    messages.push("비율의 합이 전체와 어떻게 연결되는지 다시 생각해 보세요.");
    details.push({ text: `비율의 합이 ${ratioTotal}%로 나타났습니다.`, wrong: true });
  }

  return {
    score: Math.min(score, 50),
    messages,
    details,
    expectedRatios,
    total
  };
}

function gradeQuestion2(expectedRatios) {
  const paintedCounts = {
    joy: 0,
    sad: 0,
    hard: 0,
    fun: 0,
    fear: 0
  };

  pieState.forEach((item) => {
    if (paintedCounts[item] !== undefined) paintedCounts[item]++;
  });

  const messages = [];
  const details = [];
  let score = 0;

  const totalPainted = Object.values(paintedCounts).reduce((a, b) => a + b, 0);

  if (totalPainted === 100) {
    score += 10;
    details.push({ text: "원그래프를 100조각 모두 사용해 완성했습니다.", wrong: false });
  } else {
    messages.push("원그래프는 전체를 100으로 보고 끝까지 채우는 연습이 필요합니다.");
    details.push({ text: `원그래프를 ${totalPainted}조각 색칠했습니다.`, wrong: true });
  }

  let correctCount = 0;
  emotions.forEach(({ key, label }) => {
    const diff = paintedCounts[key] - expectedRatios[key];

    if (paintedCounts[key] === expectedRatios[key]) {
      correctCount++;
      details.push({ text: `${label} 조각 수를 알맞게 표현했습니다.`, wrong: false });
    } else if (diff > 0) {
      details.push({ text: `${label} 조각 수가 ${Math.abs(diff)}조각 더 많습니다.`, wrong: true });
    } else {
      details.push({ text: `${label} 조각 수가 ${Math.abs(diff)}조각 더 적습니다.`, wrong: true });
    }
  });

  score += correctCount * 8;

  if (correctCount >= 4) {
    score += 8;
    details.push({ text: "표의 비율을 그래프에 거의 정확하게 옮겼습니다.", wrong: false });
  } else {
    messages.push("표의 비율을 그래프의 조각 수로 옮기는 연습을 더 해 보세요.");
  }

  if (totalPainted > 0) {
    score += 4;
  }

  return {
    score: Math.min(score, 50),
    messages,
    details
  };
}

function getLevel(totalScore) {
  if (totalScore >= 85) return "잘함";
  if (totalScore >= 60) return "보통";
  return "노력바람";
}

function getCoachingFeedback(level, q1, q2) {
  const commonHints = [];

  if (q1.total > 0) {
    commonHints.push("전체 수를 먼저 보고, 각 감정이 전체에서 어느 정도를 차지하는지 비교해 보세요.");
  }

  if (q1.messages.length > 0) commonHints.push(...q1.messages);
  if (q2.messages.length > 0) commonHints.push(...q2.messages);

  if (level === "잘함") {
    return {
      title: "잘함",
      className: "level-good",
      intro: "자료를 표와 그래프로 연결해 생각하는 힘이 잘 길러져 있습니다.",
      tips: [
        "비율을 구할 때 전체와 부분의 관계를 스스로 설명하는 연습을 해 보세요.",
        "같은 자료를 다른 형태의 그래프로 바꾸어 보는 활동도 도움이 됩니다.",
        "비율이 비슷한 항목끼리 비교하며 해석하는 연습을 더 하면 좋습니다."
      ]
    };
  }

  if (level === "보통") {
    return {
      title: "보통",
      className: "level-normal",
      intro: "기본적인 흐름은 이해하고 있으니, 계산과 표현을 한 번 더 점검하는 힘을 기르면 더 좋아집니다.",
      tips: [
        "표의 수를 비율로 바꿀 때 전체를 기준으로 생각하는 연습이 더 필요합니다.",
        "원그래프의 조각 수가 표의 비율과 어떻게 이어지는지 차근차근 연결해 보세요.",
        ...commonHints.slice(0, 3)
      ]
    };
  }

  return {
    title: "노력바람",
    className: "level-effort",
    intro: "전체와 부분의 관계를 천천히 살펴보며 비율을 이해하는 연습이 더 필요합니다.",
    tips: [
      "먼저 각 감정의 수를 정확히 세고, 전체가 얼마인지부터 확인해 보세요.",
      "각 감정이 전체에서 얼마나 되는지 말로 설명한 뒤 백분율로 바꿔 보세요.",
      "표에서 찾은 비율을 원그래프의 조각 수로 바꾸는 연습을 반복해 보세요.",
      ...commonHints.slice(0, 2)
    ]
  };
}

function renderResult(q1, q2, totalScore, level) {
  const feedback = getCoachingFeedback(level, q1, q2);

  resultBox.innerHTML = `
    <div class="${feedback.className}">
      <h3>수준: ${feedback.title}</h3>
      <p>
        <span class="score-chip">1번 ${q1.score} / 50</span>
        <span class="score-chip">2번 ${q2.score} / 50</span>
        <span class="score-chip">총점 ${totalScore} / 100</span>
      </p>

      <p class="coaching-text"><strong>지도 조언:</strong> ${feedback.intro}</p>
      <ul class="feedback-list coaching-text">
        ${feedback.tips.map(tip => `<li>${tip}</li>`).join("")}
      </ul>

      <div class="detail-section">
        <h4>1번 문제 채점 근거</h4>
        <ul class="detail-list">
          ${q1.details.map(item => `<li class="${item.wrong ? 'wrong-text' : 'correct-text'}">${item.text}</li>`).join("")}
        </ul>
      </div>

      <div class="detail-section">
        <h4>2번 문제 채점 근거</h4>
        <ul class="detail-list">
          ${q2.details.map(item => `<li class="${item.wrong ? 'wrong-text' : 'correct-text'}">${item.text}</li>`).join("")}
        </ul>
      </div>

      <p class="download-note">채점 후 활동지 이미지를 다운로드할 수 있습니다.</p>
    </div>
  `;
}

function gradeAll() {
  const q1 = gradeQuestion1();
  const q2 = gradeQuestion2(q1.expectedRatios);
  const totalScore = q1.score + q2.score;
  const level = getLevel(totalScore);
  renderResult(q1, q2, totalScore, level);
}

function resetAll() {
  document.getElementById("title-q1").value = "";
  document.getElementById("title-q2").value = "";

  emotions.forEach(({ key }) => {
    document.getElementById(`count-${key}`).value = "";
    document.getElementById(`ratio-${key}`).value = "";
  });

  document.getElementById("count-total").value = "";
  document.getElementById("ratio-total").value = "";

  pieState = Array(100).fill("");
  renderPieChart();

  resultBox.innerHTML = `<p>아직 채점하지 않았습니다.</p>`;
  q1Live.textContent = "수를 입력하면 합계가 자동으로 계산됩니다.";
}

async function downloadWorksheetImage() {
  const target = document.getElementById("worksheet");

  try {
    const canvas = await html2canvas(target, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      scrollX: 0,
      scrollY: -window.scrollY
    });

    const link = document.createElement("a");
    link.download = "비율그래프_활동지.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  } catch (error) {
    console.error(error);
    alert("이미지 다운로드에 실패했습니다. 인터넷이 연결된 크롬 브라우저에서 다시 시도해 주세요.");
  }
}

emotions.forEach(({ key }) => {
  document.getElementById(`count-${key}`).addEventListener("input", updateTotals);
  document.getElementById(`ratio-${key}`).addEventListener("input", updateTotals);
});

gradeBtn.addEventListener("click", gradeAll);
resetBtn.addEventListener("click", resetAll);
downloadBtn.addEventListener("click", downloadWorksheetImage);

setupLegend();
createPieChart();
updateTotals();
