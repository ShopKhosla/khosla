/* Web3Forms submission handling.
   Posts as JSON so the visitor stays on the page and gets an inline result
   instead of being bounced to the Web3Forms success screen. */
(function () {
  'use strict';

  var ENDPOINT = 'https://api.web3forms.com/submit';

  function setStatus(form, message, state) {
    var el = form.querySelector('.form__status');
    if (!el) return;
    el.textContent = message;
    el.classList.remove('is-error', 'is-success', 'is-busy');
    if (state) el.classList.add('is-' + state);
  }

  function handle(form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var button = form.querySelector('button[type=submit]');
      var original = button ? button.textContent : '';

      // Web3Forms' honeypot: a real person never checks this.
      var honey = form.querySelector('input[name=botcheck]');
      if (honey && honey.checked) return;

      var data = {};
      new FormData(form).forEach(function (value, key) { data[key] = value; });

      if (button) { button.disabled = true; button.textContent = 'Sending…'; }
      setStatus(form, 'Sending…', 'busy');

      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data)
      })
        .then(function (res) { return res.json().catch(function () { return {}; }); })
        .then(function (out) {
          if (out && out.success) {
            form.reset();
            setStatus(form, form.getAttribute('data-success') || 'Thanks. We’ll be in touch.', 'success');
          } else {
            setStatus(form, (out && out.message) || 'Something went wrong. Please try again.', 'error');
          }
        })
        .catch(function () {
          setStatus(form, 'Could not send. Check your connection and try again.', 'error');
        })
        .then(function () {
          if (button) { button.disabled = false; button.textContent = original; }
        });
    });
  }

  var forms = document.querySelectorAll('form[data-w3form]');
  for (var i = 0; i < forms.length; i++) handle(forms[i]);
})();
