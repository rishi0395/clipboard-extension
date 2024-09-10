// content-script.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "PASTE_TEXT") {
    pasteText(request.text);
  }
});

function pasteText(text) {
  const maxAttempts = 10;
  let attempts = 0;

  function tryPaste() {
    const textarea = document.querySelector("#prompt-textarea");
    if (textarea) {
      textarea.value = text;
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
      console.log("Text pasted successfully");
    } else {
      attempts++;
      if (attempts < maxAttempts) {
        console.log(
          `Attempt ${attempts}: Textarea not found, trying again in 1 second...`
        );
        setTimeout(tryPaste, 1000);
      } else {
        console.log("Failed to find textarea after multiple attempts");
      }
    }
  }

  tryPaste();
}

// Listen for changes to the DOM
const observer = new MutationObserver((mutations) => {
  for (let mutation of mutations) {
    if (mutation.type === "childList") {
      const textarea = document.querySelector("#prompt-textarea");
      if (textarea) {
        observer.disconnect();
        console.log("Textarea found in DOM");
        break;
      }
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });
