(function () {
    const url = window.location.hostname + window.location.pathname;
    const defaultColor = "#fffac8"; 

    const historyTab = document.createElement("div");
    historyTab.className = "memory-trail-history";
    document.body.appendChild(historyTab);

    const historyHeader = document.createElement("div");
    historyHeader.className = "memory-trail-history-header";
    historyHeader.innerText = "History";
    historyTab.appendChild(historyHeader);

    const button = document.createElement("button");
    button.innerText = "+ Note";
    button.className = "memory-trail-button";
    document.body.appendChild(button);

    const historyButton = document.createElement("button");
    historyButton.innerText = "History";
    historyButton.className = "memory-trail-history-button";
    document.body.appendChild(historyButton);

    historyButton.addEventListener("click", () => {
        historyTab.classList.toggle("show");
    });

    function createNote(text = "", pos = { top: 100, left: 100 }, color = defaultColor, hidden = false) {
        const note = document.createElement("div");
        note.className = "memory-trail-note";
        styleNote(note, color);
        note.style.position = "absolute";
        note.style.top = pos.top + "px";
        note.style.left = pos.left + "px";
        note.style.transition = "height 0.25s ease, opacity 0.25s ease";

        const header = document.createElement("div");
        header.className = "memory-trail-header";
        header.style.background = hexToRgba(color, 0.1);

        const hideBtn = document.createElement("span");
        hideBtn.innerHTML = "×";
        hideBtn.title = "Hide Note";
        hideBtn.style.color = "black";
        hideBtn.style.cursor = "pointer";
        hideBtn.style.fontSize = "16px";
        hideBtn.style.fontWeight = "bold";
        hideBtn.style.marginRight = "8px";
        hideBtn.onmouseenter = () => hideBtn.style.color = "gray";
        hideBtn.onmouseleave = () => hideBtn.style.color = "black";
        hideBtn.onclick = () => {
            note.style.display = "none";
            saveNotes();
            updateHistory();
        };

        const delBtn = document.createElement("span");
        delBtn.innerHTML = "␡";
        delBtn.className = "memory-trail-delete";
        delBtn.style.color = "black";
        delBtn.style.cursor = "pointer";
        delBtn.style.fontSize = "14px";
        delBtn.style.fontWeight = "bold";
        delBtn.onmouseenter = () => delBtn.style.color = "red";
        delBtn.onmouseleave = () => delBtn.style.color = "black";
        delBtn.onclick = () => {
            note.style.animation = "fadeOut 0.25s ease-out forwards";
            setTimeout(() => {
                note.remove();
                saveNotes();
                updateHistory();
            }, 250);
        };

        const colorPicker = document.createElement("input");
        colorPicker.type = "color";
        colorPicker.className = "memory-trail-color";
        colorPicker.value = color;
        colorPicker.style.outline = "none";
        colorPicker.style.border = "none";
        colorPicker.style.background = "transparent";
        colorPicker.oninput = () => {
            const chosen = colorPicker.value;
            styleNote(note, chosen);
            header.style.background = hexToRgba(chosen, 0.1);
            saveNotes();
        };

        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.width = "100%";
        textarea.style.height = "100%";
        textarea.style.outline = "none";
        textarea.style.border = "none";
        textarea.style.background = "transparent";
        textarea.style.color = "black";
        textarea.style.fontFamily = "inherit";
        textarea.style.fontSize = "14px";
        textarea.addEventListener("input", () => {
            saveNotes();
            updateHistory();
        });

        header.appendChild(hideBtn);
        header.appendChild(delBtn);
        header.appendChild(colorPicker);
        note.appendChild(header);
        note.appendChild(textarea);
        document.body.appendChild(note);

        if (hidden) {
            note.style.display = "none";
        }

        let isDragging = false, offsetX, offsetY;
        let targetX = pos.left, targetY = pos.top;
        let currentX = pos.left, currentY = pos.top;

        function animateDrag() {
            if (isDragging) {
                currentX += (targetX - currentX) * 0.15;
                currentY += (targetY - currentY) * 0.15;
                note.style.left = currentX + "px";
                note.style.top = currentY + "px";
            }
            requestAnimationFrame(animateDrag);
        }
        requestAnimationFrame(animateDrag);

        header.addEventListener("mousedown", (e) => {
            isDragging = true;
            note.style.zIndex = 1000000;
            offsetX = e.clientX - note.getBoundingClientRect().left;
            offsetY = e.clientY - note.getBoundingClientRect().top;
        });

        document.addEventListener("mousemove", (e) => {
            if (isDragging) {
                targetX = e.clientX - offsetX;
                targetY = e.clientY - offsetY;
            }
        });

        document.addEventListener("mouseup", () => {
            if (isDragging) {
                isDragging = false;
                note.style.left = targetX + "px";
                note.style.top = targetY + "px";
                saveNotes();
                updateHistory();
            }
        });

        return note;
    }

    function saveNotes() {
        const notes = Array.from(document.querySelectorAll(".memory-trail-note")).map(note => {
            const textarea = note.querySelector("textarea");
            const colorPicker = note.querySelector(".memory-trail-color");
            const hidden = note.style.display === "none";
            return {
                text: textarea.value,
                top: parseInt(note.style.top),
                left: parseInt(note.style.left),
                color: colorPicker.value,
                hidden
            };
        });
        chrome.storage.local.set({ [url]: notes });
    }

    function updateHistory() {
        const items = historyTab.querySelectorAll(".memory-trail-history-item");
        items.forEach(item => item.remove());

        const notes = Array.from(document.querySelectorAll(".memory-trail-note"));
        notes.forEach(note => {
            const text = note.querySelector("textarea").value || "(Empty Note)";
            const hidden = note.style.display === "none";

            const historyItem = document.createElement("div");
            historyItem.className = "memory-trail-history-item";
            historyItem.innerText = text.length > 30 ? text.slice(0, 30) + "..." : text;

            if (hidden) {
                historyItem.style.opacity = "0.5";
            }

            historyItem.onclick = () => {
                note.style.display = "block";
                note.scrollIntoView({ behavior: "smooth", block: "center" });
                note.style.transition = "box-shadow 0.3s ease";
                note.style.boxShadow = "0 0 15px rgba(255, 215, 0, 0.8)";
                setTimeout(() => {
                    styleNote(note, note.querySelector(".memory-trail-color").value);
                }, 800);
                saveNotes();
                updateHistory();
            };

            historyTab.appendChild(historyItem);
        });
    }

    chrome.storage.local.get([url], (result) => {
        if (result[url] && result[url].length > 0) {
            result[url].forEach(n => {
                createNote(n.text, { top: n.top, left: n.left }, n.color, n.hidden);
            });
            setTimeout(updateHistory, 300);
        }
    });

    button.addEventListener("click", () => {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const scrollY = window.scrollY;
        const scrollX = window.scrollX;

        const centerX = scrollX + (viewportWidth / 2) - 110;
        const centerY = scrollY + (viewportHeight / 2) - 60;

        createNote("", { top: centerY, left: centerX });
        saveNotes();
        updateHistory();
    });

    function styleNote(note, color) {
        note.style.background = hexToRgba(color, 0.15);
        note.style.border = `1px solid ${hexToRgba(color, 0.3)}`;
        note.style.boxShadow = `0 8px 20px ${hexToRgba(color, 0.25)}`;
    }

    function hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
})();
