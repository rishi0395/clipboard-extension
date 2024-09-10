import { deleteAllItems, fetchItems, saveItem } from "./api";

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
    case "fetch": {
      fetchItems()
        .then((data) => {
          sendResponse({ items: data || [] });
        })
        .catch((error) => {
          console.log("Fetch error:", error);
          sendResponse({ items: [] });
        });

      return true; // Keeps the connection alive until `sendResponse` is called
    }

    case "deleteAll": {
      deleteAllItems()
        .then((data) => {
          sendResponse({ success: true });
        })
        .catch((error) => {
          console.error("Delete all error:", error);
          sendResponse({ success: false });
        });

      return true; // Keeps the connection alive until `sendResponse` is called
    }

    case "clipboardText": {
      saveToServer(message.text);
      sendResponse({ success: true });
      return true; // Keeps the connection alive
    }

    case "getAllItems": {
      fetchItems()
        .then((data) => {
          sendResponse({ items: data || [] });
        })
        .catch((error) => {
          console.error("Get all items error:", error);
          sendResponse({ items: [] });
        });

      return true; // Keeps the connection alive until `sendResponse` is called
    }

    default: {
      console.error("Unknown message type:", message.type);
      sendResponse({ error: "Unknown message type" });
      return false;
    }
  }
});

async function saveToServer(text) {
  try {
    await saveItem({ text });
    console.log("Item saved:", text);
  } catch (error) {
    console.error("Failed to save item:", error);
  }
}
