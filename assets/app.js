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

const codeForm = document.querySelector("#code-generator");

if (codeForm) {
  const $ = (selector) => codeForm.querySelector(selector);
  const modeSelect = $("#code-mode");
  const qrTypeSelect = $("#qr-type");
  const qrContent = $("#qr-content");
  const qrSizeSelect = $("#qr-size");
  const titleInput = $("#code-title");
  const descriptionInput = $("#code-description");
  const barcodeFormatSelect = $("#barcode-format");
  const barcodeContent = $("#barcode-content");
  const output = document.querySelector("#qr-output");
  const status = document.querySelector("#qr-status");
  const download = document.querySelector("#qr-download");
  const payloadTitle = document.querySelector("#code-payload-title");
  const payloadPreview = document.querySelector("#code-payload");

  const messages = {
    emptyOutput: codeForm.dataset.emptyOutput || "Your code will appear here.",
    emptyStatus: codeForm.dataset.emptyStatus || "No content entered yet.",
    successQrStatus: codeForm.dataset.successQrStatus || "QR code was created locally in your browser.",
    successBarcodeStatus: codeForm.dataset.successBarcodeStatus || "Barcode was created locally in your browser.",
    errorOutput: codeForm.dataset.errorOutput || "The content is too long or could not be created.",
    errorStatus: codeForm.dataset.errorStatus || "Please check your input.",
    barcodeErrorStatus: codeForm.dataset.barcodeErrorStatus || "The barcode content does not match the selected barcode type.",
    canvasLabel: codeForm.dataset.canvasLabel || "Generated code",
    downloadName: codeForm.dataset.downloadName || "blackstar-code.png",
    payloadEmpty: codeForm.dataset.payloadEmpty || "No code content generated yet.",
    payloadQrTitle: codeForm.dataset.payloadQrTitle || "Content inside the QR code",
    payloadBarcodeTitle: codeForm.dataset.payloadBarcodeTitle || "Content inside the barcode"
  };

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

  const enableDownload = (canvas, mode) => {
    if (!download) return;
    download.href = canvas.toDataURL("image/png");
    download.download = mode === "barcode" ? "blackstar-barcode.png" : messages.downloadName;
    download.setAttribute("aria-disabled", "false");
    download.classList.remove("disabled");
  };

  const setOutputMessage = (message) => {
    if (!output) return;
    output.textContent = "";
    const text = document.createElement("p");
    text.textContent = message;
    output.appendChild(text);
  };

  const setPayloadPreview = (payload, mode) => {
    if (payloadTitle) {
      payloadTitle.textContent = mode === "barcode" ? messages.payloadBarcodeTitle : messages.payloadQrTitle;
    }

    if (payloadPreview) {
      payloadPreview.textContent = payload || messages.payloadEmpty;
    }
  };

  const syncFields = () => {
    const mode = modeSelect?.value || "qr";
    const qrType = qrTypeSelect?.value || "text";

    codeForm.querySelectorAll("[data-mode-field]").forEach((element) => {
      element.hidden = element.dataset.modeField !== mode;
    });

    codeForm.querySelectorAll("[data-mode-panel]").forEach((element) => {
      element.hidden = element.dataset.modePanel !== mode;
    });

    codeForm.querySelectorAll("[data-qr-panel]").forEach((element) => {
      const panels = (element.dataset.qrPanel || "").split(/\s+/);
      element.hidden = mode !== "qr" || !panels.includes(qrType);
    });
  };

  const encodeWifiValue = (value) => String(value || "").replace(/([\\;,":])/g, "\\$1");

  const buildQrPayload = () => {
    const type = qrTypeSelect?.value || "text";
    const value = qrContent?.value.trim() || "";

    if (type === "text") return value;

    if (type === "url") {
      if (!value) return "";
      if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return value;
      return `https://${value}`;
    }

    if (type === "wifi") {
      const ssid = $("#wifi-ssid")?.value.trim() || "";
      if (!ssid) return "";
      const password = $("#wifi-password")?.value || "";
      const encryption = $("#wifi-encryption")?.value || "WPA";
      const hidden = $("#wifi-hidden")?.checked ? "true" : "false";
      return `WIFI:T:${encodeWifiValue(encryption)};S:${encodeWifiValue(ssid)};P:${encodeWifiValue(password)};H:${hidden};;`;
    }

    if (type === "email") {
      const address = $("#email-address")?.value.trim() || "";
      if (!address) return "";
      const params = new URLSearchParams();
      const subject = $("#email-subject")?.value.trim() || "";
      const body = $("#email-body")?.value.trim() || "";
      if (subject) params.set("subject", subject);
      if (body) params.set("body", body);
      const query = params.toString();
      return `mailto:${address}${query ? `?${query}` : ""}`;
    }

    if (type === "phone") {
      const phone = $("#phone-number")?.value.trim() || "";
      return phone ? `tel:${phone}` : "";
    }

    if (type === "sms") {
      const phone = $("#phone-number")?.value.trim() || "";
      if (!phone) return "";
      const body = $("#sms-message")?.value.trim() || "";
      return `SMSTO:${phone}:${body}`;
    }

    return value;
  };

  const calculateGtinCheckDigit = (digits) => {
    const sum = digits
      .split("")
      .reverse()
      .map(Number)
      .reduce((total, digit, index) => total + digit * (index % 2 === 0 ? 3 : 1), 0);
    return String((10 - (sum % 10)) % 10);
  };

  const barcodeRules = {
    EAN13: { baseLength: 12, fullLength: 13 },
    EAN8: { baseLength: 7, fullLength: 8 },
    UPC: { baseLength: 11, fullLength: 12 },
    ITF14: { baseLength: 13, fullLength: 14 }
  };

  const normalizeBarcodeValue = () => {
    const format = barcodeFormatSelect?.value || "CODE128";
    const value = barcodeContent?.value.trim() || "";
    if (!value) return "";

    if (barcodeRules[format]) {
      const rule = barcodeRules[format];
      const digits = value.replace(/\D/g, "");
      if (digits.length === rule.baseLength) return digits + calculateGtinCheckDigit(digits);
      if (digits.length === rule.fullLength && calculateGtinCheckDigit(digits.slice(0, rule.baseLength)) === digits[rule.baseLength]) return digits;
      throw new Error(`Invalid ${format}`);
    }

    return value;
  };

  const chooseQrLevels = (payload) => {
    const length = [...payload].length;
    if (length <= 120) return ["Q", "M", "L"];
    if (length <= 400) return ["M", "Q", "L"];
    return ["M", "L", "Q"];
  };

  const createQrCanvas = (payload, requestedSize) => {
    let qr = null;
    let lastError = null;

    for (const level of chooseQrLevels(payload)) {
      try {
        qr = qrcode(0, level);
        qr.addData(payload);
        qr.make();
        break;
      } catch (error) {
        qr = null;
        lastError = error;
      }
    }

    if (!qr) {
      throw lastError || new Error("QR render failed");
    }

    const quietZone = 4;
    const moduleCount = qr.getModuleCount();
    const cellSize = Math.max(2, Math.floor(requestedSize / (moduleCount + quietZone * 2)));
    const canvasSize = (moduleCount + quietZone * 2) * cellSize;
    const canvas = document.createElement("canvas");
    canvas.width = canvasSize;
    canvas.height = canvasSize;

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

    return canvas;
  };

  const svgToCanvas = (svg, width, height) => new Promise((resolve, reject) => {
    const svgText = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Barcode render failed"));
    };
    image.src = url;
  });

  const createBarcodeCanvas = async (payload, format, requestedSize) => {
    if (typeof JsBarcode !== "function") {
      throw new Error("Barcode library missing");
    }

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    JsBarcode(svg, payload, {
      format,
      background: "#ffffff",
      lineColor: "#000000",
      displayValue: true,
      font: "monospace",
      fontSize: Math.max(24, Math.round(requestedSize * 0.034)),
      height: Math.max(112, Math.round(requestedSize * 0.16)),
      margin: Math.max(14, Math.round(requestedSize * 0.026)),
      width: format === "EAN13" ? 3 : 2
    });

    const width = requestedSize;
    const height = Math.max(220, Math.round(requestedSize * 0.32));
    return svgToCanvas(svg, width, height);
  };

  const wrapText = (ctx, text, x, y, maxWidth, lineHeight, maxLines) => {
    if (!text) return y;
    const words = text.split(/\s+/).filter(Boolean);
    let line = "";
    let lines = 0;

    for (let index = 0; index < words.length; index += 1) {
      const word = words[index];
      const testLine = line ? `${line} ${word}` : word;
      if (ctx.measureText(testLine).width > maxWidth && line) {
        ctx.fillText(line, x, y);
        y += lineHeight;
        lines += 1;
        line = word;
        if (lines >= maxLines) return y;
      } else {
        line = testLine;
      }
    }

    if (line && lines < maxLines) {
      ctx.fillText(line, x, y);
      y += lineHeight;
    }

    return y;
  };

  const createCardCanvas = (codeCanvas, mode, requestedSize) => {
    const title = titleInput?.value.trim() || "";
    const description = descriptionInput?.value.trim() || "";
    const padding = Math.round(requestedSize * 0.07);
    const maxTextWidth = requestedSize - padding * 2;
    const titleSize = Math.max(28, Math.round(requestedSize * 0.052));
    const descriptionSize = Math.max(22, Math.round(requestedSize * 0.035));
    const textSpace = (title ? Math.round(titleSize * 2.5) : 0) + (description ? Math.round(descriptionSize * 5.2) : 0);
    const codeSize = mode === "qr"
      ? Math.min(requestedSize - padding * 2, Math.round(requestedSize * (title || description ? 0.62 : 0.78)))
      : requestedSize - padding * 2;
    const codeHeight = mode === "qr" ? codeSize : Math.round(codeCanvas.height * (codeSize / codeCanvas.width));
    const canvasHeight = padding + codeHeight + (textSpace ? Math.round(padding * 0.85) + textSpace : padding);

    const canvas = document.createElement("canvas");
    canvas.width = requestedSize;
    canvas.height = canvasHeight;
    canvas.setAttribute("aria-label", messages.canvasLabel);

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const codeX = Math.round((requestedSize - codeSize) / 2);
    ctx.drawImage(codeCanvas, codeX, padding, codeSize, codeHeight);

    let y = padding + codeHeight + Math.round(padding * 0.65);
    if (title) {
      ctx.fillStyle = "#111111";
      ctx.font = `700 ${titleSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.textAlign = "center";
      y = wrapText(ctx, title, requestedSize / 2, y, maxTextWidth, Math.round(titleSize * 1.18), 2);
    }

    if (description) {
      y += title ? Math.round(descriptionSize * 0.45) : 0;
      ctx.fillStyle = "#3b3b3b";
      ctx.font = `400 ${descriptionSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.textAlign = "center";
      wrapText(ctx, description, requestedSize / 2, y, maxTextWidth, Math.round(descriptionSize * 1.25), 4);
    }

    return canvas;
  };

  const drawCode = async () => {
    if (!output || !download) return;

    const mode = modeSelect?.value || "qr";
    output.textContent = "";
    disableDownload();
    setPayloadPreview("", mode);

    try {
      const requestedSize = Number(qrSizeSelect?.value || 768);
      let payload = "";
      let codeCanvas;

      if (mode === "barcode") {
        payload = normalizeBarcodeValue();
        if (!payload) {
          setOutputMessage(messages.emptyOutput);
          setStatus(messages.emptyStatus);
          setPayloadPreview("", mode);
          return;
        }
        codeCanvas = await createBarcodeCanvas(payload, barcodeFormatSelect?.value || "CODE128", requestedSize);
      } else {
        payload = buildQrPayload();
        if (!payload) {
          setOutputMessage(messages.emptyOutput);
          setStatus(messages.emptyStatus);
          setPayloadPreview("", mode);
          return;
        }
        codeCanvas = createQrCanvas(payload, requestedSize);
      }

      const cardCanvas = createCardCanvas(codeCanvas, mode, requestedSize);
      output.appendChild(cardCanvas);
      enableDownload(cardCanvas, mode);
      setStatus(mode === "barcode" ? messages.successBarcodeStatus : messages.successQrStatus);
      setPayloadPreview(payload, mode);
    } catch (error) {
      setOutputMessage(messages.errorOutput);
      setStatus(modeSelect?.value === "barcode" ? messages.barcodeErrorStatus : messages.errorStatus, true);
      setPayloadPreview("", modeSelect?.value || "qr");
    }
  };

  let pendingRender;
  const scheduleRender = () => {
    window.clearTimeout(pendingRender);
    pendingRender = window.setTimeout(() => {
      drawCode();
    }, 80);
  };

  codeForm.addEventListener("submit", (event) => {
    event.preventDefault();
    drawCode();
  });

  codeForm.querySelectorAll("input, textarea, select").forEach((element) => {
    element.addEventListener("input", scheduleRender);
    element.addEventListener("change", () => {
      syncFields();
      scheduleRender();
    });
  });

  syncFields();
  disableDownload();
  setPayloadPreview("", modeSelect?.value || "qr");
}
