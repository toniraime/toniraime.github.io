/* THE CONTAINER — pre-paint mode init (kept tiny; loaded blocking in <head>)
   The site always opens in NIGHT mode. A visitor's toggle choice is kept for
   the current visit only (sessionStorage), so every new visit starts at night. */
(function () {
  var mode;
  try { mode = sessionStorage.getItem("tc-mode"); } catch (e) { /* storage unavailable */ }
  if (mode !== "day" && mode !== "night") mode = "night";
  /* The Experiences page belongs to the night world — always renders night. */
  if (location.pathname.indexOf("/experiences") === 0) mode = "night";
  document.documentElement.setAttribute("data-mode", mode);

  /* loader plays once per browser session */
  var seen = false;
  try { seen = sessionStorage.getItem("tc-loaded") === "1"; } catch (e) {}
  if (seen) document.documentElement.setAttribute("data-skip-loader", "1");
})();
