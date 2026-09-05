/* ============================================================
   Contact form
   ------------------------------------------------------------
   The form posts natively (method="POST") to the FormSubmit.co
   endpoint set in index.html — this file only gates that submit
   behind client-side validation, so a broken submission never
   leaves the page.

   SETUP
     1. In index.html, set the hidden _redirect field to your
        deployed URL so visitors come back here after sending,
        e.g. https://your-domain.com/?sent=1
     2. Submit the form once from the live site. FormSubmit.co
        emails you a one-time confirmation link — click it and
        the form is active. No account or API key needed.

   The ?sent=1 that _redirect appends is what shows the success
   banner below.
   ============================================================ */
(function () {
  var form = document.getElementById("contactForm");
  if (!form) return;

  var alertBox = document.getElementById("cfAlert");
  var submitBtn = document.getElementById("cfSubmit");
  var spinner = submitBtn.querySelector(".cf-spinner");
  var submitLabel = submitBtn.querySelector(".cf-submit-label");

  var fields = [
    { input: document.getElementById("cfName"), err: document.getElementById("cfNameErr"),
      validate: function (v) { return v.trim() ? "" : "Please enter your name."; } },
    { input: document.getElementById("cfEmail"), err: document.getElementById("cfEmailErr"),
      validate: function (v) {
        if (!v.trim()) return "Please enter your email address.";
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "" : "That doesn't look like a valid email address.";
      } },
    { input: document.getElementById("cfMessage"), err: document.getElementById("cfMessageErr"),
      validate: function (v) { return v.trim().length >= 10 ? "" : "Please write a little more (at least 10 characters)."; } }
  ];

  function showError(field, message) {
    field.err.textContent = message;
    field.err.hidden = !message;
    field.input.setAttribute("aria-invalid", message ? "true" : "false");
  }

  function setAlert(message, kind) {
    alertBox.textContent = message || "";
    alertBox.className = "cf-alert" + (kind ? " is-" + kind : "");
    alertBox.hidden = !message;
  }

  // validate on blur; once a field has errored, re-check as they fix it
  fields.forEach(function (field) {
    field.input.addEventListener("blur", function () {
      showError(field, field.validate(field.input.value));
    });
    field.input.addEventListener("input", function () {
      if (field.input.getAttribute("aria-invalid") === "true") {
        showError(field, field.validate(field.input.value));
      }
    });
  });

  form.addEventListener("submit", function (e) {
    var invalid = [];
    fields.forEach(function (field) {
      var message = field.validate(field.input.value);
      showError(field, message);
      if (message) invalid.push(field);
    });

    if (invalid.length) {
      e.preventDefault(); // keep them on the page to fix it
      setAlert("Please fix the highlighted field" + (invalid.length > 1 ? "s" : "") + " and try again.", "error");
      alertBox.focus();
      invalid[0].input.focus();
      return;
    }

    // valid — let the browser POST to FormSubmit
    setAlert("", null);
    submitBtn.disabled = true;
    spinner.hidden = false;
    submitLabel.textContent = "Sending…";
  });

  // after _redirect brings them back with ?sent=1
  if (/[?&]sent=1(&|$)/.test(window.location.search)) {
    setAlert("Thanks — your message has been sent. I'll get back to you soon.", "success");
    document.getElementById("contact").scrollIntoView();
  }
})();
