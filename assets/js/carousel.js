/* Image carousel — matches the Google Sites image slideshow: dots select a
   slide and arrow keys step through. It deliberately does NOT auto-advance,
   because the original doesn't; it rests on the first slide until clicked. */
(function () {
  'use strict';

  function init(root) {
    var slides = root.querySelectorAll('.carousel__slide');
    var dots = root.querySelectorAll('.carousel__dot');
    if (slides.length < 2) return;

    var index = 0;

    function show(next) {
      index = (next + slides.length) % slides.length;
      for (var i = 0; i < slides.length; i++) {
        slides[i].classList.toggle('is-active', i === index);
        if (dots[i]) {
          dots[i].classList.toggle('is-active', i === index);
          dots[i].setAttribute('aria-current', i === index ? 'true' : 'false');
        }
      }
    }

    for (var i = 0; i < dots.length; i++) {
      (function (target) {
        dots[target].addEventListener('click', function () { show(target); });
      })(i);
    }

    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(index - 1);
      if (e.key === 'ArrowRight') show(index + 1);
    });
  }

  var roots = document.querySelectorAll('[data-carousel]');
  for (var i = 0; i < roots.length; i++) init(roots[i]);
})();
