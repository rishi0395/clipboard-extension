chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "copy_item") {
    handleCopyCommand();
  }
});

async function handleCopyCommand() {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    chrome.scripting
      .executeScript({
        target: { tabId: tab.id },
        func: readClipboardContent,
      })
      .catch((error) => {
        console.error("Failed to execute script:", error);
        notifyUserOfError();
      });
  } else {
    console.log("No active tabs found.");
    notifyUserOfError();
  }
}

function readClipboardContent() {
  const activeElement = document.activeElement;

  if (document.execCommand("copy")) {
    navigator.clipboard
      .readText()
      .then((text) => {
        chrome.runtime.sendMessage({ type: "clipboardText", text: text });
      })
      .catch((err) => {
        console.error("Failed to read clipboard: ", err);
        chrome.runtime.sendMessage({
          type: "error",
          message: "Failed to read clipboard",
        });
      });
  } else {
    chrome.runtime.sendMessage({
      type: "error",
      message: "Failed to trigger copy command",
    });
  }

  if (activeElement) {
    activeElement.focus();
  }
}

function notifyUserOfError() {
  chrome.action.setBadgeText({ text: "!" });
  chrome.action.setBadgeBackgroundColor({ color: "#FF0000" });
  setTimeout(() => {
    chrome.action.setBadgeText({ text: "" });
  }, 5000);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "clipboardText") {
    saveToStorage(message.text);
  } else if (message.type === "error") {
    console.error(message.message);
    notifyUserOfError();
  } else if (message.type === "deleteItem") {
    deleteItem(message.timestamp);
  }
});

function saveToStorage(text) {
  chrome.storage.local.get(["list"], (result) => {
    let items = result.list || [];
    items.push({
      text: text,
      timestamp: Date.now(),
    });

    chrome.storage.local.set({ list: items }, () => {
      console.log("Item saved: ", text);
    });
  });
}

function deleteItem(timestamp) {
  chrome.storage.local.get(["list"], (result) => {
    let items = result.list || [];
    items = items.filter((item) => item.timestamp !== timestamp);

    chrome.storage.local.set({ list: items }, () => {
      console.log("Item deleted with timestamp: ", timestamp);
    });
  });
}

// Add this function to get all items (useful for popup.js)
function getAllItems(callback) {
  chrome.storage.local.get(["list"], (result) => {
    callback(result.list || []);
  });
}

// Expose the getAllItems function to be callable from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getAllItems") {
    getAllItems(sendResponse);
    return true; // Will respond asynchronously
  }
});
