document.addEventListener("DOMContentLoaded", function () {
  chrome.storage.local.get(["copiedItems"], (result) => {
    let items = result.copiedItems || [];
    const ul = document.getElementById("items");

    items.forEach((item) => {
      let li = document.createElement("li");
      li.textContent = item;
      ul.appendChild(li);
    });
  });
});
