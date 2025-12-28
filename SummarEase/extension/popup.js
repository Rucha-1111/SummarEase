document.addEventListener('DOMContentLoaded', async () => {
    const summaryDiv = document.getElementById('summary');
    const btn = document.getElementById('summarizeBtn');

    // 1. Get the selected text from the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.getSelection().toString(),
    }, async (results) => {
        const text = results[0].result;

        if (!text || text.length < 50) {
            summaryDiv.innerText = "Please select at least 50 characters of text on the page first.";
            return;
        }

        // 2. Automatically start summarizing
        summaryDiv.innerText = "Summarizing... ⏳";

        try {
            const response = await fetch("https://http://127.0.0.1:5000.render.com/summarize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: text })
            });

            const data = await response.json();
            if (data.summary) {
                summaryDiv.innerText = data.summary;
            } else {
                summaryDiv.innerText = data.error || "Error occurred.";
            }
        } catch (err) {
            summaryDiv.innerText = "Error: Backend unreachable. Check if server is awake.";
        }
    });
});