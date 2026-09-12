/* Customer reviews, stored in Supabase.
   Reads approved reviews and renders them; posts new ones from the form.
   The publishable key below is designed to be public — row level security on
   the table is what restricts what it can do (read approved, insert only). */
(function () {
  'use strict';

  var API = 'https://jdbpujaiuuccwquuvtei.supabase.co/rest/v1/reviews';
  var KEY = 'sb_publishable_Pr6NwCQawSwXoRiqQKL8vw_duoY6LdF';
  var MIN_BODY = 10, MAX_BODY = 1200, MAX_NAME = 60;
  var THROTTLE_MS = 60 * 1000;

  var headers = { apikey: KEY, Authorization: 'Bearer ' + KEY };

  var list = document.querySelector('[data-reviews]');
  var form = document.querySelector('[data-review-form]');

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function render(rows) {
    list.textContent = '';
    if (!rows.length) {
      list.appendChild(el('p', 'reviews__empty', 'No reviews yet. Be the first to share your experience.'));
      return;
    }
    rows.forEach(function (r) {
      var card = el('figure', 'review');
      var quote = el('blockquote', 'review__body', r.body);
      quote.setAttribute('dir', 'auto');           // Arabic and other RTL text
      var who = el('figcaption', 'review__name', r.name);
      who.setAttribute('dir', 'auto');
      card.appendChild(quote);
      card.appendChild(who);
      list.appendChild(card);
    });
  }

  function load() {
    if (!list) return;
    fetch(API + '?select=name,body,created_at&order=created_at.desc&limit=60', { headers: headers })
      .then(function (res) { return res.ok ? res.json() : Promise.reject(res.status); })
      .then(render)
      .catch(function () {
        /* If the data source is unreachable, say nothing rather than leaving a
           broken-looking section on the page. */
        list.textContent = '';
        list.classList.add('is-unavailable');
      });
  }

  function status(msg, state) {
    var s = form.querySelector('.form__status');
    if (!s) return;
    s.textContent = msg;
    s.classList.remove('is-error', 'is-success', 'is-busy');
    if (state) s.classList.add('is-' + state);
  }

  function recentlyPosted() {
    try {
      var last = Number(localStorage.getItem('khosla.review.last') || 0);
      return Date.now() - last < THROTTLE_MS;
    } catch (e) { return false; }
  }

  function markPosted() {
    try { localStorage.setItem('khosla.review.last', String(Date.now())); } catch (e) { /* ignore */ }
  }

  /* Live character counters. Shows the minimum until it's met, then counts up
     to the limit, so people know how much room they have before they hit it. */
  function wireCounters(root) {
    var hints = root.querySelectorAll('[data-count-for]');
    Array.prototype.forEach.call(hints, function (hint) {
      var field = root.querySelector('#' + hint.getAttribute('data-count-for'));
      if (!field) return;
      var max = Number(hint.getAttribute('data-max'));
      var min = Number(hint.getAttribute('data-min'));

      function update() {
        var n = field.value.trim().length;
        hint.classList.remove('is-warn', 'is-short');
        if (min > 1 && n > 0 && n < min) {
          hint.textContent = n + ' / ' + max + ', at least ' + min + ' characters';
          hint.classList.add('is-short');
        } else if (n === 0) {
          hint.textContent = min > 1 ? 'Up to ' + max + ' characters, minimum ' + min : 'Up to ' + max + ' characters';
        } else {
          hint.textContent = n + ' / ' + max;
          if (n >= max * 0.9) hint.classList.add('is-warn');
        }
      }

      field.addEventListener('input', update);
      form.addEventListener('reset', function () { setTimeout(update, 0); });
      update();
    });
  }

  if (form) {
    wireCounters(form);

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var honey = form.querySelector('input[name=botcheck]');
      if (honey && honey.checked) return;

      var name = form.querySelector('[name=name]').value.trim();
      var body = form.querySelector('[name=body]').value.trim();

      if (name.length < 1 || name.length > MAX_NAME) {
        return status('Please enter your name (60 characters or fewer).', 'error');
      }
      if (body.length < MIN_BODY || body.length > MAX_BODY) {
        return status('Please write between ' + MIN_BODY + ' and ' + MAX_BODY + ' characters.', 'error');
      }
      if (recentlyPosted()) {
        return status('You have just submitted a review. Please wait a minute before sending another.', 'error');
      }

      var button = form.querySelector('button[type=submit]');
      var original = button ? button.textContent : '';
      if (button) { button.disabled = true; button.textContent = 'Sending…'; }
      status('Sending…', 'busy');

      fetch(API, {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }, headers),
        body: JSON.stringify({ name: name, body: body })
      })
        .then(function (res) {
          if (!res.ok) return Promise.reject(res.status);
          markPosted();
          form.reset();
          status('Thank you. Your review has been posted.', 'success');
          load();
        })
        .catch(function () {
          status('Could not post your review. Please try again in a moment.', 'error');
        })
        .then(function () {
          if (button) { button.disabled = false; button.textContent = original; }
        });
    });
  }

  load();
})();
