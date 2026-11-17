/* Fills in the support address on the legal pages from the API's public
   config (SUPPORT_EMAIL), so it is set in one place. Without it the link
   points into the app, never at a mailbox that does not exist. */
(function () {
  var api = (window.FLOURISH_CONFIG && window.FLOURISH_CONFIG.apiUrl) || "";
  if (!api || !window.fetch) return;
  fetch(api.replace(/\/+$/, "") + "/api/public-config").then(function (r) { return r.ok ? r.json() : null; }).then(function (c) {
    var e = c && c.support_email;
    if (!e || !/^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/i.test(e)) return;
    var links = document.querySelectorAll("a.support-email");
    for (var i = 0; i < links.length; i++) { links[i].href = "mailto:" + e; links[i].textContent = e; }
  }).catch(function () {});
})();

/* support.html: the Support URL App Store Connect lists. A signed-out message
   goes to POST /api/support as a ticket; the owner answers it from the app
   (Me -> Help & support) and the reply goes to the email given here. */
(function () {
  var form = document.getElementById("support-form");
  if (!form) return;
  var status = document.getElementById("support-status");
  var api = ((window.FLOURISH_CONFIG && window.FLOURISH_CONFIG.apiUrl) || "").replace(/\/+$/, "");
  function say(t, bad) { status.textContent = t; status.style.color = bad ? "#e5735f" : ""; }
  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var email = form.email.value.trim(), message = form.message.value.trim();
    if (!/^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/i.test(email)) return say("Add your email so we can reply.", true);
    if (message.length < 2) return say("Write a short message first.", true);
    if (!api || !window.fetch) return say("We couldn't reach Flourish just now. Please try again in a moment.", true);
    var btn = form.querySelector("button");
    btn.disabled = true; say("Sending\u2026");
    fetch(api + "/api/support", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, topic: form.topic.value, message: message })
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) throw new Error((j && j.detail) || "That didn't send. Please try again in a moment.");
      });
    }).then(function () {
      form.reset(); say("Thanks, your message is in. We'll reply to " + email + ".");
    }).catch(function (e) {
      say((e && e.message) || "That didn't send. Please try again in a moment.", true);
    }).then(function () { btn.disabled = false; });
  });
})();
