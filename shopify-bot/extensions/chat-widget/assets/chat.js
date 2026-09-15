/**
 * Storefront chat widget.
 *
 * Vanilla JS, no framework, no dependencies. This loads on every page of a
 * merchant's store, so bundle size is their Core Web Vitals and ultimately
 * their opinion of your app.
 *
 * Talks to the backend through Shopify's App Proxy (a same-origin path on the
 * shop's own domain), so there is no CORS, no API key in the page, and the
 * backend can verify the request genuinely came from this shop.
 */
(function () {
  "use strict";

  var root = document.getElementById("sana-chat-root");
  if (!root) return;

  var PROXY_URL = root.dataset.proxyUrl || "/apps/chat";
  var ACCENT = root.dataset.accent || "#1f6feb";
  var POSITION = root.dataset.position === "left" ? "left" : "right";
  var GREETING = root.dataset.greeting || "";
  var TITLE = root.dataset.title || "Chat";

  /* Anonymous, per-browser. Never a customer id or email — that keeps the app
     clear of Shopify's protected customer data rules entirely. */
  var VISITOR_KEY = "sana_chat_visitor";
  var visitorId;
  try {
    visitorId = localStorage.getItem(VISITOR_KEY);
    if (!visitorId) {
      visitorId =
        "v_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
      localStorage.setItem(VISITOR_KEY, visitorId);
    }
  } catch (e) {
    /* Private browsing blocks storage — fall back to a per-page id. */
    visitorId = "v_" + Math.random().toString(36).slice(2, 12);
  }

  root.style.setProperty("--sana-accent", ACCENT);
  root.setAttribute("data-pos", POSITION);

  root.innerHTML = [
    '<button class="sana-bubble" type="button" aria-label="Open chat">',
    '  <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">',
    '    <path fill="currentColor" d="M12 3C7 3 3 6.6 3 11c0 2.2 1 4.2 2.7 5.6L5 21l4.3-2.1c.9.2 1.8.3 2.7.3 5 0 9-3.6 9-8s-4-8-9-8z"/>',
    "  </svg>",
    "</button>",
    '<section class="sana-panel" hidden aria-label="Chat">',
    '  <header class="sana-header">',
    '    <span class="sana-title"></span>',
    '    <button class="sana-close" type="button" aria-label="Close chat">&times;</button>',
    "  </header>",
    '  <div class="sana-log" role="log" aria-live="polite"></div>',
    '  <form class="sana-form">',
    '    <input class="sana-input" type="text" autocomplete="off" placeholder="Type a message…" maxlength="2000" />',
    '    <button class="sana-send" type="submit" aria-label="Send">→</button>',
    "  </form>",
    "</section>",
  ].join("");

  var bubble = root.querySelector(".sana-bubble");
  var panel = root.querySelector(".sana-panel");
  var log = root.querySelector(".sana-log");
  var form = root.querySelector(".sana-form");
  var input = root.querySelector(".sana-input");
  var sendButton = root.querySelector(".sana-send");
  root.querySelector(".sana-title").textContent = TITLE;

  var busy = false;
  var opened = false;

  function scrollToEnd() {
    log.scrollTop = log.scrollHeight;
  }

  function addMessage(who, text) {
    var wrap = document.createElement("div");
    wrap.className = "sana-msg sana-" + who;
    wrap.textContent = text || "";
    log.appendChild(wrap);
    scrollToEnd();
    return wrap;
  }

  /* Cart links and product URLs should be clickable, but the reply is model
     output — so build the anchors from parsed text, never with innerHTML. */
  function linkify(node, text) {
    node.textContent = "";
    var pattern = /https?:\/\/[^\s]+/g;
    var lastIndex = 0;
    var match;

    while ((match = pattern.exec(text)) !== null) {
      if (match.index > lastIndex) {
        node.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      }
      var a = document.createElement("a");
      a.href = match[0];
      a.textContent = match[0];
      a.rel = "noopener";
      node.appendChild(a);
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      node.appendChild(document.createTextNode(text.slice(lastIndex)));
    }
  }

  function setBusy(state) {
    busy = state;
    input.disabled = state;
    sendButton.disabled = state;
  }

  function openPanel() {
    panel.hidden = false;
    root.classList.add("sana-open");
    if (!opened) {
      opened = true;
      if (GREETING) addMessage("bot", GREETING);
    }
    input.focus();
  }

  function closePanel() {
    panel.hidden = true;
    root.classList.remove("sana-open");
  }

  bubble.addEventListener("click", function () {
    if (panel.hidden) openPanel();
    else closePanel();
  });
  root.querySelector(".sana-close").addEventListener("click", closePanel);

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !panel.hidden) closePanel();
  });

  /**
   * Read the SSE stream by hand rather than using EventSource: EventSource is
   * GET-only, and the message has to go up in a POST body.
   */
  async function send(message) {
    setBusy(true);
    addMessage("user", message);

    var typing = addMessage("bot sana-typing", "…");
    var streamed = "";

    try {
      var response = await fetch(PROXY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message, visitor_id: visitorId }),
      });

      if (!response.ok || !response.body) {
        throw new Error("HTTP " + response.status);
      }

      var reader = response.body.getReader();
      var decoder = new TextDecoder();
      var buffer = "";

      for (;;) {
        var chunk = await reader.read();
        if (chunk.done) break;
        buffer += decoder.decode(chunk.value, { stream: true });

        /* SSE frames are separated by a blank line; a frame may split across
           network chunks, so keep the trailing partial in the buffer. */
        var frames = buffer.split("\n\n");
        buffer = frames.pop() || "";

        for (var i = 0; i < frames.length; i++) {
          var lines = frames[i].split("\n");
          var event = "message";
          var data = "";

          for (var j = 0; j < lines.length; j++) {
            if (lines[j].indexOf("event: ") === 0) event = lines[j].slice(7).trim();
            else if (lines[j].indexOf("data: ") === 0) data += lines[j].slice(6);
          }

          if (!data) continue;
          var payload;
          try {
            payload = JSON.parse(data);
          } catch (e) {
            continue;
          }

          if (event === "delta" && payload.text) {
            typing.classList.remove("sana-typing");
            streamed += payload.text;
            typing.textContent = streamed;
            scrollToEnd();
          } else if (event === "done") {
            typing.classList.remove("sana-typing");
            linkify(typing, payload.reply || streamed);
            scrollToEnd();
          } else if (event === "error") {
            typing.classList.remove("sana-typing");
            typing.textContent = payload.message || "Something went wrong.";
          }
        }
      }

      if (!streamed && !typing.textContent) {
        typing.textContent = "Sorry — no reply came back. Please try again.";
      }
    } catch (error) {
      typing.classList.remove("sana-typing");
      typing.textContent = "Connection problem. Please try again.";
    } finally {
      setBusy(false);
      input.focus();
    }
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (busy) return;
    var message = input.value.trim();
    if (!message) return;
    input.value = "";
    send(message);
  });
})();
