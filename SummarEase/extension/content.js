let popupElement = null;

// 🧠 Detect text selection
document.addEventListener("mouseup", (event) => {
  if (popupElement && popupElement.contains(event.target)) return;

  setTimeout(() => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    // ✅ MATCH BACKEND (character-based)
    if (selectedText.length >= 200) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      showPopup(
        rect.right + window.scrollX,
        rect.bottom + window.scrollY,
        selectedText
      );
    } else {
      removePopup();
    }
  }, 50);
});

// 🪟 Create popup
function showPopup(x, y, text) {
  removePopup();

  popupElement = document.createElement("div");
  popupElement.className = "summarizer-popup";

  popupElement.innerHTML = `
    <div style="display:flex;gap:8px;justify-content:space-between;">
      <button id="summarizeBtn">Summarize</button>
      <button id="closePopup">×</button>
    </div>
  `;

  Object.assign(popupElement.style, {
    position: "absolute",
    left: `${x}px`,
    top: `${y}px`,
    background: "#fff",
    border: "1px solid #ccc",
    borderRadius: "10px",
    padding: "10px",
    zIndex: "999999",
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
    fontFamily: "Arial, sans-serif"
  });

  // 🛑 Prevent popup clicks from triggering mouseup listener
  popupElement.addEventListener("mouseup", (e) => e.stopPropagation());

  document.body.appendChild(popupElement);

  document.getElementById("summarizeBtn").onclick = () => summarizeText(text);
  document.getElementById("closePopup").onclick = removePopup;
}

// 🧹 Remove popup
function removePopup() {
  popupElement?.remove();
  popupElement = null;
}

// ⚡ Summarize request
async function summarizeText(selectedText) {
  popupElement.innerHTML = `<div style="font-size:14px;">⏳ Summarizing...</div>`;

  try {
    const response = await fetch(
      "https://my-summarease-backend-url-render.onrender.com/summarize",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: selectedText })
      }
    );

    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    popupElement.innerHTML = `
      <div style="max-height:200px;overflow:auto;font-size:14px;margin-bottom:8px;">
        ${data.summary}
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;">
        <button id="copySummary">Copy</button>
        <button id="closePopup">Close</button>
      </div>
    `;

    document.getElementById("copySummary").onclick = () =>
      navigator.clipboard.writeText(data.summary);

    document.getElementById("closePopup").onclick = removePopup;

  } catch (err) {
    popupElement.innerHTML = `
      <div style="color:red;font-size:13px;">❌ ${err.message}</div>
      <button id="closePopup" style="float:right;">Close</button>
    `;
    document.getElementById("closePopup").onclick = removePopup;
  }
}
