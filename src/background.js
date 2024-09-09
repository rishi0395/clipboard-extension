import { generateRandomTextArray } from "./utils";

const API_BASE_URL = "https://note-server-fbej.onrender.com/extension/v1";

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
        console.error("Failed to read clipboard:", err);
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
  console.log("Received message:", message);

  switch (message.type) {
    case "fetch":
      fetch(`${API_BASE_URL}/fetch`)
        .then((response) => response.json())
        .then((data) => {
          sendResponse({ items: data || [] });
        })
        .catch((error) => {
          console.error("Failed to fetch items:", error);
          sendResponse({
            items: [],
          }); // Send an empty array in case of error
        });
      return true; // Indicates that response will be sent asynchronously

    case "deleteAll":
      fetch(`${API_BASE_URL}/deleteAll`, {
        method: "DELETE",
      })
        .then(() => {
          console.log("All items deleted.");
          sendResponse({ success: true });
        })
        .catch((error) => {
          console.error("Failed to delete all items:", error);
          sendResponse({ success: false });
        });
      return true; // Indicates that response will be sent asynchronously

    case "clipboardText":
      saveToServer(message.text);
      break;

    // Other cases if needed...
  }
});

function saveToServer(text) {
  fetch(`${API_BASE_URL}/saveItem`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: text }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Item saved:", text);
    })
    .catch((error) => {
      console.error("Failed to save item:", error);
    });
}

// Expose the getAllItems function to be callable from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getAllItems") {
    fetch(`${API_BASE_URL}/fetch`)
      .then((response) => response.json())
      .then((data) => {
        sendResponse({ items: data.items || [] });
      })
      .catch((error) => {
        console.error("Failed to fetch items:", error);
        sendResponse({ items: [] }); // Send an empty array in case of error
      });
    return true; // Will respond asynchronously
  }
});
