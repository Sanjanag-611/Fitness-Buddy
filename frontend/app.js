const API_BASE = "http://localhost:3000";

// State
let conversationHistory = [];
let isLoading = false;

// DOM refs
const messagesEl = document.getElementById("messages");
const chatAreaEl = document.getElementById("chatArea");
const userInputEl = document.getElementById("userInput");
const sendBtnEl = document.getElementById("sendBtn");
const clearBtnEl = document.getElementById("clearBtn");
const welcomeScreenEl = document.getElementById("welcomeScreen");
const sidebarEl = document.getElementById("sidebar");
const sidebarToggleEl = document.getElementById("sidebarToggle");
const menuBtnEl = document.getElementById("menuBtn");

// ===========================
// Sidebar toggle
// ===========================
sidebarToggleEl.addEventListener("click", () => {
  sidebarEl.classList.toggle("collapsed");
});

menuBtnEl.addEventListener("click", () => {
  sidebarEl.classList.toggle("mobile-open");
});

// Close sidebar on mobile when clicking outside
document.addEventListener("click", (e) => {
  if (
    window.innerWidth <= 768 &&
    !sidebarEl.contains(e.target) &&
    !menuBtnEl.contains(e.target)
  ) {
    sidebarEl.classList.remove("mobile-open");
  }
});

// ===========================
// Quick action buttons (sidebar)
// ===========================
document.querySelectorAll(".quick-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const prompt = btn.dataset.prompt;
    if (prompt) sendMessage(prompt);
    if (window.innerWidth <= 768) sidebarEl.classList.remove("mobile-open");
  });
});

// ===========================
// Feature cards (welcome screen)
// ===========================
document.querySelectorAll(".feature-card").forEach((card) => {
  card.addEventListener("click", () => {
    const prompt = card.dataset.prompt;
    if (prompt) sendMessage(prompt);
  });
});

// ===========================
// Clear / New Chat
// ===========================
clearBtnEl.addEventListener("click", () => {
  conversationHistory = [];
  messagesEl.innerHTML = "";
  welcomeScreenEl.style.display = "";
  userInputEl.value = "";
  autoResize();
});

// ===========================
// Send on Enter (Shift+Enter = newline)
// ===========================
userInputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    triggerSend();
  }
});

userInputEl.addEventListener("input", autoResize);
sendBtnEl.addEventListener("click", triggerSend);

function triggerSend() {
  const text = userInputEl.value.trim();
  if (text && !isLoading) sendMessage(text);
}

function autoResize() {
  userInputEl.style.height = "auto";
  userInputEl.style.height = Math.min(userInputEl.scrollHeight, 160) + "px";
}

// ===========================
// Core: Send Message
// ===========================
async function sendMessage(text) {
  if (!text || isLoading) return;

  // Hide welcome screen on first message
  welcomeScreenEl.style.display = "none";

  // Add user message to UI and history
  appendMessage("user", text);
  conversationHistory.push({ role: "user", content: text });

  userInputEl.value = "";
  autoResize();

  // Show typing indicator
  const typingId = showTyping();
  setLoading(true);

  try {
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: conversationHistory }),
    });

    const data = await response.json();
    removeTyping(typingId);

    if (!response.ok) {
      throw new Error(data.error || "Network error");
    }

    const reply = data.reply;
    appendMessage("assistant", reply);
    conversationHistory.push({ role: "assistant", content: reply });
  } catch (err) {
    removeTyping(typingId);
    appendMessage("assistant", `⚠️ ${err.message || "Something went wrong. Please try again."}`, true);
  } finally {
    setLoading(false);
  }
}

// ===========================
// UI Helpers
// ===========================
function appendMessage(role, content, isError = false) {
  const msgEl = document.createElement("div");
  msgEl.classList.add("message", role);

  const avatar = document.createElement("div");
  avatar.classList.add("avatar");
  avatar.textContent = role === "user" ? "🧑" : "🏋️";

  const bubble = document.createElement("div");
  bubble.classList.add("bubble");
  if (isError) bubble.classList.add("error-bubble");
  bubble.innerHTML = formatMessage(content);

  msgEl.appendChild(avatar);
  msgEl.appendChild(bubble);
  messagesEl.appendChild(msgEl);

  scrollToBottom();
}

function showTyping() {
  const id = "typing-" + Date.now();
  const msgEl = document.createElement("div");
  msgEl.classList.add("message", "assistant");
  msgEl.id = id;

  const avatar = document.createElement("div");
  avatar.classList.add("avatar");
  avatar.textContent = "🏋️";

  const bubble = document.createElement("div");
  bubble.classList.add("bubble");
  bubble.innerHTML = `<div class="typing-indicator">
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>
  </div>`;

  msgEl.appendChild(avatar);
  msgEl.appendChild(bubble);
  messagesEl.appendChild(msgEl);
  scrollToBottom();
  return id;
}

function removeTyping(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function setLoading(state) {
  isLoading = state;
  sendBtnEl.disabled = state;
  userInputEl.disabled = state;
}

function scrollToBottom() {
  chatAreaEl.scrollTop = chatAreaEl.scrollHeight;
}

// ===========================
// Markdown-lite formatter
// ===========================
function formatMessage(text) {
  // Escape HTML
  let safe = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Bold: **text**
  safe = safe.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // Italic: *text*
  safe = safe.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Inline code: `code`
  safe = safe.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Headers: ### ## #
  safe = safe.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  safe = safe.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  safe = safe.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  // Unordered lists: - or *
  safe = safe.replace(/^[-*] (.+)$/gm, "<li>$1</li>");
  safe = safe.replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>");
  // Fix nested ul duplicates
  safe = safe.replace(/<\/ul>\s*<ul>/g, "");

  // Numbered lists: 1. item
  safe = safe.replace(/^\d+\. (.+)$/gm, "<li>$1</li>");

  // Line breaks → paragraphs
  const lines = safe.split(/\n\n+/);
  safe = lines
    .map((block) => {
      if (/^<(ul|ol|li|h[1-3])/.test(block.trim())) return block;
      return `<p>${block.replace(/\n/g, "<br>")}</p>`;
    })
    .join("");

  return safe;
}
