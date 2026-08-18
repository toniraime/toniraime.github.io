(function () {
  "use strict";
  var W = "https://the-container-leads.tonyraimy.workers.dev/";
  var out = document.getElementById("out");
  out.innerHTML = "";
  function line(label, text, good) {
    var d = document.createElement("div");
    d.className = "line " + (good ? "ok" : "bad");
    d.textContent = label + " " + text;
    out.appendChild(d);
  }
  var stamp = new Date().toISOString().slice(11, 16).replace(":", "");
  var payload = {
    type: "newsletter",
    name: "Engine Test",
    email: "engine-test-" + stamp + "@thecontainerlive.com",
    phone: "",
    message: "",
    extra: ""
  };
  fetch(W)
    .then(function (r) { return r.text(); })
    .then(function (t) { line("1. HEALTH:", t, t.indexOf('"ok":true') !== -1); })
    .catch(function (e) { line("1. HEALTH:", "FAILED — " + e, false); })
    .then(function () {
      return fetch(W, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (r) {
          return r.text().then(function (t) {
            line("2. TEST SIGNUP (" + payload.email + "): HTTP " + r.status + " —", t,
              r.status === 200 && t.indexOf('"ok":true') !== -1);
          });
        })
        .catch(function (e) { line("2. TEST SIGNUP:", "FAILED — " + e, false); });
    })
    .then(function () {
      line("3. DONE.", "Tell Claude what lines 1 and 2 say (or screenshot).", true);
    });
})();
