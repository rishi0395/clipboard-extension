import { deleteAllItems, fetchItems, saveItem } from "./api";
import { normalCopyBehavior, updateBadge } from "./utils/utils";

chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
  chrome.storage.sync.get("extensionEnabled", (data) => {
    updateBadge(data.extensionEnabled);
  });
});

chrome.commands.onCommand.addListener((command) => {
  chrome.storage.sync.get("extensionEnabled", (data) => {
    if (data.extensionEnabled) {
      if (command === "copy_item") {
        handleCopyCommand();
      }
    } else {
      console.log("Extension is disabled. Command ignored.");
      normalCopyBehavior(); // Custom function for copying without saving
    }
  });
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
        // Let the user copy the content regardless of server saving status
        console.log("Content copied to clipboard:", text);

        // Attempt to save the clipboard content to the server
        chrome.runtime.sendMessage(
          { type: "clipboardText", text: text },
          (response) => {
            if (!response || !response.success) {
              console.error("Failed to save clipboard content to the server.");
              notifyUserOfError("Clipboard content copied, but saving failed.");
            } else {
              console.log("Clipboard content saved to the server.");
            }
          }
        );
      })
      .catch((err) => {
        console.error("Failed to read clipboard:", err);
        notifyUserOfError("Clipboard content copied, but could not be saved.");
      });
  } else {
    console.error("Failed to trigger copy command.");
    notifyUserOfError("Copy action failed.");
  }

  if (activeElement) {
    activeElement.focus(); // Ensure the original focus is restored
  }
}

function notifyUserOfError() {
  chrome.action.setBadgeText({ text: "!" });
  chrome.action.setBadgeBackgroundColor({ color: "#FF0000" });
  setTimeout(() => {
    chrome.action.setBadgeText({ text: "" });
  }, 5000);
}

function sendMessageToTab(tabId, message) {
  chrome.tabs.sendMessage(tabId, message, (response) => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
    } else {
      console.log("Message sent successfully");
    }
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Received message:", message);
  chrome.storage.sync.get("extensionEnabled", (data) => {
    if (data.extensionEnabled !== false) {
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

        case "openChatGPT": {
          chrome.tabs.create({ url: "https://chatgpt.com/" }, (tab) => {
            chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
              if (tabId === tab.id && info.status === "complete") {
                chrome.tabs.onUpdated.removeListener(listener);

                // Wait a bit to ensure the page is fully loaded
                setTimeout(() => {
                  sendMessageToTab(tabId, {
                    type: "PASTE_TEXT",
                    text: message.text,
                  });
                }, 2000); // Wait for 2 seconds before sending the message
              }
            });
          });
          sendResponse({ success: true });
          return true;
        }

        case "useOpenChatGPT": {
          chrome.tabs.query({ url: "https://chatgpt.com/*" }, (tabs) => {
            if (tabs.length > 0) {
              // ChatGPT tab is already open
              chrome.tabs.update(tabs[0].id, { active: true }, () => {
                setTimeout(() => {
                  sendMessageToTab(tabs[0].id, {
                    type: "PASTE_TEXT",
                    text: message.text,
                  });
                }, 500); // Short delay to ensure tab is focused
              });
            } else {
              // Open a new ChatGPT tab
              chrome.tabs.create({ url: "https://chatgpt.com/" }, (tab) => {
                chrome.tabs.onUpdated.addListener(function listener(
                  tabId,
                  info
                ) {
                  if (tabId === tab.id && info.status === "complete") {
                    chrome.tabs.onUpdated.removeListener(listener);

                    setTimeout(() => {
                      sendMessageToTab(tabId, {
                        type: "PASTE_TEXT",
                        text: message.text,
                      });
                    }, 2000); // Wait for 2 seconds before sending the message
                  }
                });
              });
            }
          });
          sendResponse({ success: true });
          return true;
        }

        default: {
          console.error("Unknown message type:", message.type);
          sendResponse({ error: "Unknown message type" });
          return false;
        }
      }
    } else {
      console.log("Extension is disabled. Message ignored.");
      sendResponse({ success: false, error: "Extension is disabled" });
    }
  });
  return true; // Keeps the connection alive
});

async function saveToServer(text) {
  try {
    await saveItem({ text });
    console.log("Item saved:", text);
  } catch (error) {
    console.error("Failed to save item:", error);
  }
}
