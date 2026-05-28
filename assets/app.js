const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");

if (toggle && nav) {
  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    nav.classList.toggle("open", !expanded);
  });
}

document.querySelectorAll(".site-nav a").forEach((link) => {
  link.addEventListener("click", () => {
    if (!toggle || !nav) return;
    toggle.setAttribute("aria-expanded", "false");
    nav.classList.remove("open");
  });
});

const year = document.querySelector("#year");
if (year) {
  year.textContent = new Date().getFullYear();
}

const qrForm = document.querySelector("#qr-generator");
if (qrForm) {
  const input = document.querySelector("#qr-content");
  const sizeSelect = document.querySelector("#qr-size");
  const levelSelect = document.querySelector("#qr-level");
  const output = document.querySelector("#qr-output");
  const status = document.querySelector("#qr-status");
  const download = document.querySelector("#qr-download");

  const setStatus = (message, isError = false) => {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle("error", isError);
  };

  const disableDownload = () => {
    if (!download) return;
    download.removeAttribute("download");
    download.href = "#";
    download.setAttribute("aria-disabled", "true");
    download.classList.add("disabled");
  };

  const drawQrCode = () => {
    if (!input || !output || !download || typeof qrcode !== "function") return;

    const value = input.value.trim();
    output.textContent = "";
    disableDownload();

    if (!value) {
      output.innerHTML = "<p>Dein QR-Code erscheint hier.</p>";
      setStatus("Noch kein Inhalt eingegeben.");
      return;
    }

    try {
      const qr = qrcode(0, levelSelect?.value || "M");
      qr.addData(value);
      qr.make();

      const requestedSize = Number(sizeSelect?.value || 768);
      const quietZone = 4;
      const moduleCount = qr.getModuleCount();
      const cellSize = Math.max(2, Math.floor(requestedSize / (moduleCount + quietZone * 2)));
      const canvasSize = (moduleCount + quietZone * 2) * cellSize;

      const canvas = document.createElement("canvas");
      canvas.width = canvasSize;
      canvas.height = canvasSize;
      canvas.setAttribute("aria-label", "Erzeugter QR-Code");

      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvasSize, canvasSize);
      ctx.fillStyle = "#000000";

      for (let row = 0; row < moduleCount; row += 1) {
        for (let col = 0; col < moduleCount; col += 1) {
          if (qr.isDark(row, col)) {
            ctx.fillRect((col + quietZone) * cellSize, (row + quietZone) * cellSize, cellSize, cellSize);
          }
        }
      }

      output.appendChild(canvas);
      download.href = canvas.toDataURL("image/png");
      download.download = "blackstar-qr-code.png";
      download.setAttribute("aria-disabled", "false");
      download.classList.remove("disabled");
      setStatus("QR-Code wurde lokal im Browser erstellt.");
    } catch (error) {
      output.innerHTML = "<p>Der Inhalt ist zu lang oder konnte nicht als QR-Code erstellt werden.</p>";
      setStatus("Bitte kürze den Inhalt oder versuche eine niedrigere Fehlerkorrektur.", true);
    }
  };

  qrForm.addEventListener("submit", (event) => {
    event.preventDefault();
    drawQrCode();
  });

  input?.addEventListener("input", drawQrCode);
  sizeSelect?.addEventListener("change", drawQrCode);
  levelSelect?.addEventListener("change", drawQrCode);
  disableDownload();
}
