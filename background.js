chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
});

// Listen for the user copying content with the command key
chrome.commands.onCommand.addListener((command) => {
  if (command === "copy_item") {
    // Get the active tab in the current window
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: readClipboardContent,
        });
      } else {
        console.error("No active tabs found");
      }
    });
  }
});

function readClipboardContent() {
  // This code runs in the active tab
  navigator.clipboard
    .readText()
    .then((text) => {
      chrome.runtime.sendMessage({ type: "clipboardText", text: text });
    })
    .catch((err) => {
      console.error("Failed to read clipboard: ", err);
    });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "clipboardText") {
    saveToStorage(message.text);
  }
});

function saveToStorage(text) {
  chrome.storage.local.get(["copiedItems"], (result) => {
    let items = result.copiedItems || [];
    items.push(text);

    chrome.storage.local.set({ copiedItems: items }, () => {
      console.log("Item saved: ", text);
    });
  });
}
