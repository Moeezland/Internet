const address = document.getElementById("address");
const form = document.getElementById("address-form");
const backButton = document.getElementById("back");
const forwardButton = document.getElementById("forward");
const reloadButton = document.getElementById("reload");
const status = document.getElementById("status");

function destination(input) {
  const value = input.trim();
  if (!value) return null;

  // Explicit schemes are accepted only when they resolve to HTTP or HTTPS.
  if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(value)) {
    try {
      const parsed = new URL(value);
      return ["http:", "https:"].includes(parsed.protocol) &&
        !parsed.username && !parsed.password ? parsed.href : null;
    } catch {
      return null;
    }
  }

  const looksLikeUrl =
    /^(localhost|(\d{1,3}\.){3}\d{1,3})(:\d+)?(\/.*)?$/i.test(value) ||
    /^([^\s.]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/.test(value);

  if (looksLikeUrl) return `https://${value}`;
  return `https://www.google.com/search?q=${encodeURIComponent(value)}`;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const url = destination(address.value);
  if (!url) {
    status.textContent = "Only HTTP and HTTPS addresses are supported.";
    return;
  }
  status.textContent = "Loading…";
  await window.moeezland.navigate(url);
});

backButton.addEventListener("click", () => window.moeezland.back());
forwardButton.addEventListener("click", () => window.moeezland.forward());
reloadButton.addEventListener("click", () => window.moeezland.reload());
document.getElementById("home").addEventListener("click", () => window.moeezland.home());

window.addEventListener("moeezland:navigation", (event) => {
  address.value = event.detail.url;
});
window.addEventListener("moeezland:state", (event) => {
  backButton.disabled = !event.detail.canGoBack;
  forwardButton.disabled = !event.detail.canGoForward;
  if (!event.detail.isLoading) status.textContent = "Ready";
});
window.addEventListener("moeezland:title", (event) => {
  document.title = `${event.detail} — Moeezland Internet`;
});
window.addEventListener("moeezland:error", (event) => {
  status.textContent = event.detail;
});
