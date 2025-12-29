let popupElement = null;

// 🧠 Detect when user selects text
document.addEventListener("mouseup", (event) => {
  // ✅ Prevent popup from disappearing when clicking inside it
  if (popupElement && popupElement.contains(event.target)) return;

  setTimeout(() => {
    const selectedText = window.getSelection().toString().trim();
    const wordCount = selectedText.split(/\s+/).length;

    if (wordCount >= 50) {
      showPopup(event.pageX, event.pageY, selectedText);
    } else {
      removePopup();
    }
  }, 100);
});

// 🪟 Create popup UI
function showPopup(x, y, text) {
  removePopup(); // remove existing popup if open

  popupElement = document.createElement("div");
  popupElement.className = "summarizer-popup";
  popupElement.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
      <button id="summarizeBtn">Summarize</button>
      <button id="closePopup" title="Close">×</button>
    </div>
  `;

  document.body.appendChild(popupElement);
  popupElement.style.position = "absolute";
  popupElement.style.left = `${x}px`;
  popupElement.style.top = `${y}px`;
  popupElement.style.background = "white";
  popupElement.style.border = "1px solid #ccc";
  popupElement.style.borderRadius = "10px";
  popupElement.style.padding = "10px";
  popupElement.style.zIndex = "999999";
  popupElement.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
  popupElement.style.fontFamily = "Arial, sans-serif";
  popupElement.style.minWidth = "150px";
  popupElement.style.maxWidth = "350px";

  document.getElementById("summarizeBtn").addEventListener("click", () => summarizeText(text));
  document.getElementById("closePopup").addEventListener("click", removePopup);
}

// 🧹 Remove popup
function removePopup() {
  if (popupElement) {
    popupElement.remove();
    popupElement = null;
  }
}

async function summarizeText(selectedText) {
  const popup = document.querySelector(".summarizer-popup");
  popup.innerHTML = `<div class="loading" style="font-size:14px;">Summarizing... ⏳</div>`;

  try {
    const response = await fetch("https://my-summarease-backend-url-render.onrender.com/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: selectedText })
    });

    const data = await response.json();

    // ✨ NEW: Check if the server returned an error (like 400, 500, or 503)
    if (!response.ok) {
      throw new Error(data.error || "Server error");
    }

    // ✨ NEW: Use data.summary (which matches your Flask return key)
    let summary = data.summary || "No summary received. Try again.";

    // ✨ NEW: If the summary is an error message, treat it as an error
    if (summary === "AI response error. Please try again.") {
      throw new Error("AI response error. Please try again.");
    }

    // ✨ NEW: If summary is still the fallback, treat it as an error
    if (summary === "No summary received. Try again.") {
      throw new Error("No summary received. Try again.");
    }

    popup.innerHTML = `
      <div class="summary" style="max-width:320px;max-height:200px;overflow-y:auto;font-size:14px;margin-bottom:10px;line-height:1.4;">
        ${summary}
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;">
        <button id="copySummary">Copy</button>
        <button id="closePopup">Close</button>
      </div>
    `;

    document.getElementById("copySummary").addEventListener("click", () => {
      navigator.clipboard.writeText(summary);
      alert("✅ Summary copied to clipboard!");
    });

    document.getElementById("closePopup").addEventListener("click", removePopup);

  } catch (err) {
    // ✨ NEW: This now displays the ACTUAL error message from your Flask backend
    popup.innerHTML = `
      <div class="error" style="color:red; font-size:13px; margin-bottom:10px;">
        ❌ ${err.message}
      </div>
      <button id="closePopup" style="float:right;">Close</button>
    `;
    document.getElementById("closePopup").addEventListener("click", removePopup);
    console.error("Error while summarizing:", err);
  }
}