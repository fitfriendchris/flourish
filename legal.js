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
