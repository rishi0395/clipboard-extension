// popup.js
document.addEventListener("DOMContentLoaded", function () {
  const itemsList = document.getElementById("itemsList");
  const fetchButton = document.getElementById("fetch");
  const deleteAllButton = document.getElementById("deleteAll");
  const loadingText = document.getElementById("loadingText");

  function displayLoading(isLoading) {
    loadingText.style.display = isLoading ? "block" : "none";
  }

  function fetchItems() {
    displayLoading(true);
    chrome.runtime.sendMessage({ type: "fetch" }, function (response) {
      displayLoading(false);

      if (response && response.items && Array.isArray(response.items)) {
        itemsList.innerHTML = ""; // Clear existing items

        // Sort items by timestamp, latest first
        const sortedItems = response.items.sort(
          (a, b) => b.timestamp - a.timestamp
        );

        sortedItems.forEach((item) => {
          const li = document.createElement("li");
          li.className = "item";
          li.innerHTML = `
            <div class="item-content">
              <div class="item-text">${item.text}</div>
              <div class="item-timestamp">${new Date(
                item.timestamp
              ).toLocaleString()}</div>
            </div>
            <div class="item-actions">
              <button class="copy-btn" data-text="${encodeURIComponent(
                item.text
              )}">Copy</button>
              <button class="delete-btn" data-timestamp="${
                item.timestamp
              }">Delete</button>
              <button class="chatgpt-btn" data-text="${encodeURIComponent(
                item.text
              )}">Open in ChatGPT</button>
            </div>
          `;
          itemsList.appendChild(li);
        });

        // Add event listeners for new delete buttons
        document.querySelectorAll(".delete-btn").forEach((btn) => {
          btn.addEventListener("click", function () {
            const timestamp = parseInt(this.getAttribute("data-timestamp"));
            chrome.runtime.sendMessage(
              { type: "deleteItem", timestamp: timestamp },
              (response) => {
                if (response && response.success) {
                  console.log(`Item with timestamp ${timestamp} deleted.`);
                  this.closest(".item").remove();
                } else {
                  console.error(
                    `Failed to delete item with timestamp ${timestamp}.`
                  );
                }
              }
            );
          });
        });

        // Add event listeners for new copy buttons
        document.querySelectorAll(".copy-btn").forEach((btn) => {
          btn.addEventListener("click", function () {
            const text = decodeURIComponent(this.getAttribute("data-text"));
            navigator.clipboard
              .writeText(text)
              .then(() => {
                // Visual feedback that the item was copied
                this.textContent = "Copied!";
                this.classList.add("copied");
                setTimeout(() => {
                  this.textContent = "Copy";
                  this.classList.remove("copied");
                }, 1000);
              })
              .catch((err) => {
                console.error("Failed to copy text: ", err);
              });
          });
        });

        // Add event listeners for new ChatGPT buttons
        document.querySelectorAll(".chatgpt-btn").forEach((btn) => {
          btn.addEventListener("click", function () {
            const text = decodeURIComponent(this.getAttribute("data-text"));
            chrome.runtime.sendMessage({
              type: "openChatGPT",
              text: text,
            });
          });
        });
      } else {
        console.error(
          "Failed to fetch items or items format is incorrect.",
          response
        );
      }
    });
  }

  // Fetch all items when the popup is loaded
  fetchItems();

  // Add event listener for the 'fetch' button
  fetchButton.addEventListener("click", fetchItems);

  // Add event listener for the 'deleteAll' button
  deleteAllButton.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "deleteAll" }, (response) => {
      if (response && response.success) {
        console.log("All items deleted.");
        itemsList.innerHTML = "";
      } else {
        console.error("Failed to delete all items.", response);
      }
    });
  });
});
