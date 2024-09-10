export function generateRandomTextArray(numObjects) {
  const generateRandomText = () => {
    const length = Math.floor(Math.random() * 100) + 20; // Random text length between 20 and 120
    return Array.from({ length }, () =>
      String.fromCharCode(Math.floor(Math.random() * 26) + 97)
    ).join("");
  };

  const textArray = Array.from({ length: numObjects }, (_, index) => ({
    text: generateRandomText(),
    timestamp: index + 1,
  }));

  return textArray;
}

export function updateBadge(isEnabled) {
  if (isEnabled) {
    // Set the badge text and green background
    chrome.action.setBadgeText({ text: "ON" });
    chrome.action.setBadgeBackgroundColor({ color: "#00FF00" }); // Green color
  } else {
    // Clear the badge
    chrome.action.setBadgeText({ text: "OFF" });
    chrome.action.setBadgeBackgroundColor({ color: "red" }); // red color
  }
}

export function normalCopyBehavior() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      const tabId = tabs[0].id;
      const currentTabUrl = tabs[0].url;

      chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => {
          // Check if there is selected text on the page
          const selectedText = window.getSelection().toString();
          if (selectedText) {
            // Let the default copy action handle the selected text
            document.execCommand("copy");
            console.log("Selected text copied: ", selectedText);
          } else {
            // No text selected, copy the URL of the active tab
            navigator.clipboard
              .writeText(document.location.href)
              .then(() => {
                console.log("URL copied: ", document.location.href);
              })
              .catch((err) => {
                console.error("Failed to copy URL: ", err);
              });
          }
        },
      });
    } else {
      console.log("No active tabs found.");
    }
  });
}
