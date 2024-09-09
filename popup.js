document.addEventListener("DOMContentLoaded", function () {
  chrome.runtime.sendMessage({ action: "getAllItems" }, function (items) {
    const itemsList = document.getElementById("itemsList");
    items.forEach((item) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <div class="buttons">
          <span class="copy-btn" data-text="${encodeURIComponent(
            item.text
          )}">📋</span>
          <span class="delete-btn" data-timestamp="${item.timestamp}">❌</span>
        </div>
        <div>${item.text}</div>
        <span class="timestamp">${new Date(
          item.timestamp
        ).toLocaleString()}</span>
      `;
      itemsList.appendChild(li);
    });

    // Add event listeners for delete buttons
    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const timestamp = parseInt(this.getAttribute("data-timestamp"));
        chrome.runtime.sendMessage({
          type: "deleteItem",
          timestamp: timestamp,
        });
        this.closest("li").remove();
      });
    });

    // Add event listeners for copy buttons
    document.querySelectorAll(".copy-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const text = decodeURIComponent(this.getAttribute("data-text"));
        navigator.clipboard
          .writeText(text)
          .then(() => {
            // Visual feedback that the item was copied
            this.textContent = "✅";
            setTimeout(() => {
              this.textContent = "📋";
            }, 1000);
          })
          .catch((err) => {
            console.error("Failed to copy text: ", err);
          });
      });
    });
  });
});
