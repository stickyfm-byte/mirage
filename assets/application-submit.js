(() => {
  const form = document.getElementById("applicationForm");
  if (!form) return;

  // After deploying the Cloudflare Worker, replace this placeholder with its HTTPS URL.
  const APPLICATION_ENDPOINT = "https://REPLACE-WITH-YOUR-WORKER.workers.dev";

  const status = document.createElement("p");
  status.id = "applicationSubmitStatus";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  status.style.cssText = "margin-top:12px;white-space:pre-wrap";
  form.appendChild(status);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    if (APPLICATION_ENDPOINT.includes("REPLACE-WITH-YOUR-WORKER")) {
      status.textContent = "Applications are not connected yet. Please try again later.";
      status.style.color = "#ffcc66";
      return;
    }

    const button = form.querySelector('button[type="submit"]');
    const originalText = button ? button.textContent : "Send application";
    if (button) { button.disabled = true; button.textContent = "Sending…"; }
    status.textContent = "Sending your application securely…";
    status.style.color = "";

    const payload = Object.fromEntries(new FormData(form).entries());
    try {
      const response = await fetch(APPLICATION_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.error || "Submission failed. Please try again.");
      window.location.assign("/forms/thanks/");
    } catch (error) {
      status.textContent = error.message || "We couldn't send your application. Please try again.";
      status.style.color = "#ff8b8b";
      if (button) { button.disabled = false; button.textContent = originalText; }
    }
  });
})();
