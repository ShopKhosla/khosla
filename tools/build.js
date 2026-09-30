const fs = require('fs'), path = require('path');
const MODEL = require(path.join(__dirname, 'model.json'));
const OUT = path.join(__dirname, '..');

// Live asset slots -> local files (same DOM order used when downloading).
const IMG = {
  'coming-soon': { banner: 'coming-soon-banner.png' },
  'home': { banner: 'home-banner.png', flow: ['home-product-tallow-cream.jpg', 'home-product-hair-oil.jpg', 'home-ingredients.jpg'] },
  'about': { flow: ['about-products.jpg'] },
  'testimonials': { banner: 'testimonials-banner.jpg', carousel: [['testimonials-carousel-1.jpg', 'testimonials-carousel-2.jpg', 'testimonials-carousel-3.jpg']] },
  'contact': { banner: 'contact-banner.jpg' },
  'faq': { banner: 'faq-banner.jpg' },
  'tallow-cream': { carousel: [['tallow-cream-1.jpg', 'tallow-cream-2.jpg']] },
  'khosla-leave-in': { carousel: [['leave-in-1.jpg']] },
  'khosla-hair-oil': { carousel: [['hair-oil-1.jpg', 'hair-oil-2.jpg']] },
  'terms-of-policy': { banner: 'terms-banner.jpg' },
  'refund-policy': { banner: 'refund-banner.jpg' },
  'privacy-policy': { banner: 'privacy-banner.jpg' },
  'shipping-policy': { banner: 'shipping-banner.jpg' },
};

/* Copy replacements applied to the extracted content, keyed by the original
   text. Keeps edits in the build so a re-extract can't quietly revert them. */
const EMAIL = 'khoslanatural@gmail.com';
const EMAIL_LINK = '<a href="mailto:' + EMAIL + '">' + EMAIL + '</a>';

const COPY = {
  'Blah Blah Blah': 'Khosla is a haircare brand built on natural ingredients that nourish and deeply moisturize for healthier-looking hair.',
  /* Offer both routes wherever the policies point people at us, rather
     than only the email address. */
  '[Your Email Address]': EMAIL_LINK
    + ', or send us a message through our <a href="contact.html">contact form</a>.',
  'Please visit our Refund Policy page for information about returns and refunds.':
    'Get in touch and we will sort it out with you.',
  'Please send us a message using the contact form below:':
    'Use the form below to place an order or ask us a question.',
  /* The site takes no payments and uses no payment processor, so the policy
     should not claim otherwise. */
  'We may use trusted third-party services to help operate our website, process payments, or provide services.':
    'We may use trusted third-party services to help operate our website, such as handling messages sent through our contact form and storing customer reviews.',
};

/* Regex edits applied to an element's inner HTML, for surgery the plain text
   replacements above can't do (removing one item from a list). */
const HTML_FIXES = [
  // No payment information is collected: nothing on the site takes payment.
  [/<li>(?:(?!<\/li>).)*Payment information(?:(?!<\/li>).)*<\/li>/g, ''],
];

/* Content dropped from the original export, matched on a distinctive phrase.
   Processing Time carried an unfilled [X–X business days] placeholder. */
const REMOVE = {
  'shipping-policy': ['Processing Time', 'Orders are processed within'],
  /* The "Our Ingredient" section described ingredients in the abstract and
     promised a list that didn't exist. Replaced by a direct invitation to ask. */
  'about': [
    'Our Ingredient',
    'At Khosla, we believe healthy hair starts with intentional ingredients',
    'Natural Nourishment',
    'Our formulas focus on ingredients chosen',
    'Ingredient Transparency',
    'We believe you deserve to know what goes into',
    'Our Approach',
    'Khosla combines timeless haircare practices',
    'For detailed ingredient information',
  ],
};

/* Replacement for the removed About section: says what the ingredients are
   rather than talking around them, then points people at us for specifics. */
function ingredientsBlock() {
  const body = 'Every Khosla product is built on natural, vitamin-rich ingredients chosen to '
    + 'deeply moisturize and nourish. Want the full list for a particular product? '
    + '<a href="contact.html">Message us</a> and we’ll send it over.';
  return [
    '          <h1 class="t ta-l t--section" id="ingredients" style="margin:32px 0px 8px 0px"><span style="color:#493b31">Ingredients</span></h1>',
    '          <p class="t ta-l" style="line-height:22.08px;margin:16px 0px 16px 0px">'
      + '<span style="color:#493b31;font-family:\'Roboto Serif\', Arial;font-weight:400;line-height:22.08px">'
      + body + '</span></p>',
  ].join('\n');
}

/* The original footer row came from a Google Docs paste: underlined tabs and
   empty underlined spans that render as stray dashes, plus a mix of tabs,
   non-breaking spaces and plain spaces as separators. Rebuilt cleanly. */
const FOOTER_LINKS = [
  ['About Khosla', 'about.html'],
  ['Terms of Policy', 'terms-of-policy.html'],
  ['Privacy Policy', 'privacy-policy.html'],
  ['Contact Information', 'contact.html'],
  ['FAQ', 'faq.html'],
  ['Shipping Policy', 'shipping-policy.html'],
  ['Facebook', 'https://www.facebook.com/profile.php?id=61594273318935&amp;sk=directory_contact_info'],
  ['Instagram', 'https://www.instagram.com/shopkhosla/'],
];

function quickLinks() {
  const items = FOOTER_LINKS.map(function (l) {
    const external = /^https?:/.test(l[1]);
    const rel = external ? ' target="_blank" rel="noopener"' : '';
    return '            <li><a href="' + l[1] + '"' + rel + '>' + l[0] + '</a></li>';
  }).join('\n');
  return '          <ul class="quick-links">\n' + items + '\n          </ul>';
}

function reviewForm() {
  return [
    '          <form class="form form--review" data-review-form>',
    botcheck(),
    '            <div class="form__field">',
    '              <label class="form__label" for="review-name">Your name</label>',
    '              <input class="form__input" id="review-name" type="text" name="name" maxlength="60" autocomplete="name" required>',
    '              <p class="form__hint" data-count-for="review-name" data-max="60" data-min="1"></p>',
    '            </div>',
    '            <div class="form__field">',
    '              <label class="form__label" for="review-body">Your review</label>',
    '              <textarea class="form__textarea" id="review-body" name="body" rows="6" minlength="10" maxlength="1200" required></textarea>',
    '              <p class="form__hint" data-count-for="review-body" data-max="1200" data-min="10"></p>',
    '            </div>',
    '            <button class="button" type="submit">Post review</button>',
    '            <p class="form__status" role="status" aria-live="polite"></p>',
    '          </form>',
  ].join('\n');
}

/* Typos carried over from the original footer, on every page. */
const TYPOS = [
  ['Privicay Policy', 'Privacy Policy'],
  ['About Khusla', 'About Khosla'],
];

const ORDER_STEPS = 'Message us with the products, sizes and quantities you’d like and where to ship them. '
  + 'We’ll reply with your total and payment details, and your order ships as soon as payment is received.';

function orderIntro() {
  return '          <p class="order-intro">' + ORDER_STEPS + '</p>';
}

/* About page: horizontal nav jumping to each section of the page. */
function sectionNav(sections) {
  const items = sections.map(function (sec) {
    return '            <li><a href="#' + sec.id + '">' + sec.label + '</a></li>';
  }).join('\n');
  return makeSection({
    cols: [{
      width: 100,
      pad: '14px 8px',
      html: '          <ul class="page-nav">\n' + items + '\n          </ul>',
    }],
  });
}

/* Contact page: how to order, shown above the form. */
function howToOrderSection() {
  return makeSection({
    cols: [
      { width: 25 },
      {
        width: 50,
        html: [
          '          <h2 class="t ta-c">How to Place an Order</h2>',
          '          <p class="order-intro" style="margin-bottom:0">' + ORDER_STEPS + '</p>',
        ].join('\n'),
      },
      { width: 25 },
    ],
  });
}

/* Contact page: email address, shown below the form as the alternative. */
function emailSection() {
  return makeSection({
    cols: [{
      width: 100,
      html: [
        '          <h3 class="t ta-c">Prefer email?</h3>',
        '          <p class="t ta-c" style="margin:8px 0 0">Write to us at ' + EMAIL_LINK + ' and we’ll reply as soon as we can.</p>',
      ].join('\n'),
    }],
  });
}

/* Home page ordering section, placed after the product tiles, so the process
   is visible without having to open a product first. */
function orderSection() {
  return makeSection({
    cols: [
      { width: 25 },
      {
        width: 50,
        html: [
          '          <h1 class="t ta-c">Place an Order</h1>',
          '          <p class="order-intro">' + ORDER_STEPS + '</p>',
          '          <p class="ta-c" style="margin:0"><a class="button" href="contact.html">Place an order</a></p>',
        ].join('\n'),
      },
      { width: 25 },
    ],
  });
}

/* ---------------------------------------------------------------- Extras
   Content added beyond the original Google Sites export: prices, the order
   prompt, and the two Web3Forms forms. Kept here so rebuilds preserve them. */

/* Banners that are artwork rather than a backdrop: the whole image carries
   meaning (logo, wordmark, badges), so it must never be cropped. Dimensions
   drive an aspect-ratio so narrow screens show all of it without letterboxing.
   Photo banners behind a title are fine to crop and are not listed here. */
const ARTWORK_BANNERS = {
  'home': { w: 1983, h: 793 },
};

const W3F_KEY = 'c82a5ca3-6755-4863-adb9-48fd931a3176';

const PRICES = {
  'tallow-cream': {
    name: 'Khosla Tallow Cream',
    sizes: [['250 g', '250 EGP'], ['500 g', '550 EGP'], ['1000 g', '1,100 EGP']],
  },
  'khosla-leave-in': {
    name: 'Khosla Leave In',
    sizes: [['250 g', '300 EGP'], ['500 g', '600 EGP'], ['1000 g', '1,150 EGP']],
  },
  'khosla-hair-oil': {
    name: 'Khosla Hair Oil',
    sizes: [['100 ml', '500 EGP']],
  },
};

/* Price span for the Home tiles: cheapest to dearest, so the range is honest
   at a glance rather than anchoring on the smallest size. En dash, being a
   range. A single-size product just shows its price. */
function fromPrice(slug) {
  const sizes = PRICES[slug].sizes;
  if (sizes.length < 2) return sizes[0][1];
  const low = sizes[0][1].replace(/\s*EGP$/, '');
  return low + ' – ' + sizes[sizes.length - 1][1];
}

/* Size and price list shown on a product page. */
function priceList(slug) {
  const rows = PRICES[slug].sizes.map(function (sz) {
    return '            <li><span class="size">' + sz[0] + '</span>'
         + '<span class="amount">' + sz[1] + '</span></li>';
  }).join('\n');
  return '          <ul class="prices">\n' + rows + '\n          </ul>';
}

function hidden(name, value) {
  return '            <input type="hidden" name="' + name + '" value="' + value + '">';
}

function botcheck() {
  return '            <input type="checkbox" name="botcheck" class="form__botcheck" tabindex="-1" autocomplete="off" aria-hidden="true">';
}

function subscribeForm() {
  return [
    '          <form class="form form--subscribe" data-w3form data-success="Thanks for subscribing. Check your inbox.">',
    hidden('access_key', W3F_KEY),
    hidden('subject', 'New subscriber, 10% off first order'),
    hidden('from_name', 'First Order - 10% discount for subscriber.'),
    botcheck(),
    '            <label class="form__label" for="subscribe-email">Email address</label>',
    '            <div class="form__row">',
    '              <input class="form__input" id="subscribe-email" type="email" name="email" autocomplete="email" placeholder="you@example.com" required>',
    '              <button class="button" type="submit">Subscribe</button>',
    '            </div>',
    '            <p class="form__status" role="status" aria-live="polite"></p>',
    '          </form>',
  ].join('\n');
}

function contactForm() {
  return [
    '          <form class="form form--contact" data-w3form data-success="Thanks for your message. We’ll reply by email.">',
    hidden('access_key', W3F_KEY),
    hidden('subject', 'New message from the Khosla website'),
    hidden('from_name', 'Contact'),
    botcheck(),
    '            <div class="form__field">',
    '              <label class="form__label" for="contact-name">Name</label>',
    '              <input class="form__input" id="contact-name" type="text" name="name" autocomplete="name" required>',
    '            </div>',
    '            <div class="form__field">',
    '              <label class="form__label" for="contact-email">Email address</label>',
    '              <input class="form__input" id="contact-email" type="email" name="email" autocomplete="email" required>',
    '            </div>',
    '            <div class="form__field">',
    '              <label class="form__label" for="contact-message">Message</label>',
    '              <textarea class="form__textarea" id="contact-message" name="message" rows="6" required></textarea>',
    '            </div>',
    '            <button class="button" type="submit">Send message</button>',
    '            <p class="form__status" role="status" aria-live="polite"></p>',
    '          </form>',
  ].join('\n');
}

/* Build a section that matches the markup the extractor produces, so added
   content sits in the same grid as everything else. */
function makeSection(opts) {
  const cols = opts.cols.map(function (c) {
    const body = c.html ? '        <div class="block" style="padding:' + (c.pad || '14px 8px') + '">\n' + c.html + '\n        </div>' : '';
    return '      <div class="col' + (body ? '' : ' col--empty') + '" style="width:' + c.width + '%">\n' + body + '\n      </div>';
  }).join('\n');
  return '    <section class="section"' + (opts.style ? ' style="' + opts.style + '"' : '') + '>\n'
    + '      <div class="section__body">\n        <div class="grid">\n' + cols + '\n        </div>\n      </div>\n'
    + '    </section>';
}

function ruleSection() {
  return makeSection({
    style: 'padding:0;background:var(--band)',
    cols: [{ width: 100, pad: '0 0 7.5px', html: '          <hr class="rule">' }],
  });
}

/* The Leave In page did not exist in the original site, so it borrows the
   Tallow Cream page's structure: same banner, same image block, same footer. */
(function addLeaveIn() {
  const base = MODEL['tallow-cream'];
  if (!base || MODEL['khosla-leave-in']) return;
  const clone = JSON.parse(JSON.stringify(base));
  clone.title = 'Khosla - Leave In';
  clone.sections.forEach(function (sec) {
    sec.columns.forEach(function (c) {
      c.blocks.forEach(function (bl) {
        bl.items.forEach(function (it) {
          if (it.kind === 'text' && (it.text || '').indexOf('Khosla Tallow Cream') >= 0) {
            it.text = 'Khosla Leave In';
            it.html = it.html.replace('Khosla Tallow Cream', 'Khosla Leave In');
          }
        });
      });
    });
  });
  MODEL['khosla-leave-in'] = clone;
})();

const ALT = {
  'home-product-tallow-cream.jpg': 'Khosla Tallow Cream jar',
  'home-product-hair-oil.jpg': 'Khosla Hair Oil bottle',
  'home-ingredients.jpg': 'Khosla natural ingredients',
  'about-products.jpg': 'Khosla hair oil and tallow cream',
};

/* The Coming Soon page is retired: Home is now the site root (index.html),
   so both the old root and /home resolve there. */
const DROPPED = ['coming-soon', 'refund-policy'];
const ROOT_PAGE = 'home';

function pageFile(slug) {
  return slug === ROOT_PAGE ? 'index.html' : slug + '.html';
}

function rewrite(h) {
  if (!h) return h;
  if (h.charAt(0) === '#') return h;
  const m = h.match(/^\/view\/khoslademo\/?(.*)$/);
  if (!m) return h;
  if (m[1] === '') return 'index.html';
  const hashAt = m[1].indexOf('#');
  const slug = hashAt >= 0 ? m[1].slice(0, hashAt) : m[1];
  const hash = hashAt >= 0 ? m[1].slice(hashAt) : '';
  if (DROPPED.indexOf(slug) >= 0) return 'index.html' + hash;
  return pageFile(slug) + hash;
}

function fixLinks(html) {
  return html.replace(/href="([^"]*)"/g, function (_, h) { return 'href="' + rewrite(h) + '"'; });
}

function round(v) { const n = parseFloat(v); return Number.isFinite(n) ? Math.round(n * 1000) / 1000 : v; }

const DEF = { h1: { fs: 45.333, lh: 62.56 }, h2: { fs: 24, lh: 36 }, h3: { fs: 18.667, lh: 28 }, p: { fs: 16, lh: 24 }, ul: { fs: 16, lh: null }, ol: { fs: 16, lh: null } };
const ALIGN = { center: 'ta-c', left: 'ta-l', right: 'ta-r', start: 'ta-l', end: 'ta-r', justify: 'ta-j' };

function renderText(it, onMedia) {
  const tag = /^h[1-6]$/.test(it.tag) ? it.tag : (it.tag === 'ul' || it.tag === 'ol' ? it.tag : 'p');
  const d = DEF[tag] || DEF.p;
  const cls = ['t', ALIGN[it.align] || 'ta-l'];
  if (onMedia) cls.push('t--on-media');
  if (it.sectionHeading) cls.push('t--section');
  const idAttr = it.anchorId ? ' id="' + it.anchorId + '"' : '';
  const st = [];
  const fs = round(parseFloat(it.fontSize));
  const lh = it.lineHeight === 'normal' ? null : round(parseFloat(it.lineHeight));
  const isHeading = /^h[1-6]$/.test(tag);
  if (Math.abs(fs - d.fs) > 0.01) st.push('font-size:' + fs + 'px');
  if (lh === null && d.lh !== null) st.push('line-height:normal');
  else if (lh !== null && d.lh !== null && Math.abs(lh - d.lh) > 0.01) {
    /* Headings get a unitless ratio so the leading scales with the responsive
       font size; an absolute px leading would keep a 63px line box around 28px
       text on a phone. Body copy keeps px, since its size doesn't change. */
    st.push(isHeading ? 'line-height:' + round(lh / fs) : 'line-height:' + lh + 'px');
  }
  let m = it.margin.split(/\s+/).map(function (v) { return round(parseFloat(v)); });
  if (m.length === 1) m = [m[0], m[0], m[0], m[0]];
  else if (m.length === 2) m = [m[0], m[1], m[0], m[1]];
  else if (m.length === 3) m = [m[0], m[1], m[2], m[1]];
  if (m.some(function (v) { return v !== 0; })) st.push('margin:' + m.map(function (v) { return v + 'px'; }).join(' '));
  const style = st.length ? ' style="' + st.join(';') + '"' : '';
  let inner = fixLinks(it.html).replace(/\t/g, '<span class="tab">&#9;</span>');
  const replacement = COPY[(it.text || '').trim()];
  if (replacement) inner = inner.replace((it.text || '').trim(), replacement);
  TYPOS.forEach(function (fix) { inner = inner.split(fix[0]).join(fix[1]); });
  HTML_FIXES.forEach(function (fix) { inner = inner.replace(fix[0], fix[1]); });
  /* Headings carry absolute px line-heights on their inner spans. Those pin the
     line box to the desktop size, so strip them and let the element's own
     (unitless) leading govern — which keeps the strut behaviour correct while
     letting everything scale on smaller screens. */
  if (isHeading) inner = inner.replace(/line-height:[^;"]*;?/g, '');
  return '<' + tag + ' class="' + cls.join(' ') + '"' + idAttr + style + '>' + inner + '</' + tag + '>';
}

/* Google Sites puts the inset on the block wrapper, not on the text element,
   and varies it per block (0px / 8px / 14px 8px). Take the padding straight
   from the original, then add whatever extra height the outer block carried
   (dividers sit in an 18px-tall block around a 2px rule). */
function edgeMargins(it) {
  if (!it || !it.margin) return { t: 0, b: 0 };
  let m = it.margin.split(/\s+/).map(function (v) { return parseFloat(v) || 0; });
  if (m.length === 1) m = [m[0], m[0], m[0], m[0]];
  else if (m.length === 2) m = [m[0], m[1], m[0], m[1]];
  else if (m.length === 3) m = [m[0], m[1], m[2], m[1]];
  return { t: m[0], b: m[2] };
}

function blockPadding(bl) {
  let m = String(bl.tyPad || '0px').split(/\s+/).map(function (v) { return parseFloat(v) || 0; });
  if (m.length === 1) m = [m[0], m[0], m[0], m[0]];
  else if (m.length === 2) m = [m[0], m[1], m[0], m[1]];
  else if (m.length === 3) m = [m[0], m[1], m[2], m[1]];

  const items = bl.items.filter(function (i) { return i.rect; });
  const first = items[0], last = items[items.length - 1];

  /* The outer block can be taller than its inner box, which then sits centred
     inside it (product-page banners do this). Fold that slack into padding.
     Where the inner box has no padding of its own, the first/last item's own
     margin escapes through it, so don't count that twice. */
  let slackTop = bl.tyRect.y - bl.rect.y;
  let slackBottom = (bl.rect.y + bl.rect.h) - (bl.tyRect.y + bl.tyRect.h);
  if (m[0] === 0) slackTop -= edgeMargins(first).t;
  if (m[2] === 0) slackBottom -= edgeMargins(last).b;

  const q = function (n) { return Math.abs(n) < 0.2 ? 0 : Math.round(n * 100) / 100; };
  return { t: q(m[0] + slackTop), r: q(m[1]), b: q(m[2] + slackBottom), l: q(m[3]) };
}

function build(pg) {
  const d = MODEL[pg];
  const slots = IMG[pg] || {};
  let flowIdx = 0, carIdx = 0;

  const nav = d.nav.filter(function (n) {
    const slug = (n.href || '').replace(/^\/view\/khoslademo\/?/, '').split('#')[0];
    return DROPPED.indexOf(slug) < 0;
  }).map(function (n) {
    const href = rewrite(n.href);
    return '        <li class="nav__item"><a class="nav__link' + (n.active ? ' is-current' : '') + '" href="' + href + '"' + (n.active ? ' aria-current="page"' : '') + '>' + n.text + '</a></li>';
  }).join('\n');

  function renderSection(s) {
    const isFooter = s.where === 'footer';
    const banner = s.isBanner && s.hasBgImg;
    const cls = ['section'];
    if (isFooter) cls.push('section--footer');
    if (s.isBanner) cls.push('section--banner');
    if (/WxWicb/.test(s.cls)) cls.push('section--rule');

    const pad = s.padding.replace(/\s+/g, ' ');
    const st = [];
    if (pad === '56px 0px') st.push('padding:56px 0');
    else if (pad === '0px') st.push('padding:0');
    if (s.isBanner) st.push('--banner-h:' + round(s.rect.h) + 'px');
    const art = s.isBanner && s.hasBgImg ? ARTWORK_BANNERS[pg] : null;
    if (art) {
      cls.push('section--artwork');
      st.push('--banner-ratio:' + art.w + ' / ' + art.h);
    }
    /* Take the band colour from the measured section rather than inferring it
       from a class: plain banners use the content band, image banners the
       lighter one, and only the original knows which is which. */
    const bandVar = { 'rgb(197, 177, 162)': 'var(--band)', 'rgb(206, 195, 186)': 'var(--band-alt)' };
    if (s.secBeforeBg) st.push('background:' + (bandVar[s.secBeforeBg] || s.secBeforeBg));

    let media = '';
    if (banner) {
      const ov = parseFloat(s.bgOverlayOpacity) || 0;
      media = '      <div class="section__media" style="background-image:url(assets/img/' + slots.banner + ')">'
        + (ov > 0 ? '<span class="section__scrim" style="opacity:' + ov + '"></span>' : '')
        + '</div>\n';
    }

    // Append an extra block to the widest column that already has content.
    let appendTo = -1;
    if (s.appendBlock) {
      let widest = -1;
      s.columns.forEach(function (c, i) {
        if (c.blocks.length && c.rect.w > widest) { widest = c.rect.w; appendTo = i; }
      });
    }
    const byCol = s.appendByCol || {};

    const cols = s.columns.map(function (c, colIndex) {
      const wPct = round(c.rect.w / 1094 * 100);
      const blocks = c.blocks.map(function (bl) {
        const drop = REMOVE[pg] || [];
        let kept = bl.items.filter(function (it) {
          if (!it.text) return true;
          return !drop.some(function (phrase) { return it.text.indexOf(phrase) >= 0; });
        });

        /* Standalone <br> spacers are Google Docs paste artefacts. They read as
           modest padding beside a tall image on desktop but become large dead
           gaps once columns stack, so trim them from the edges of each block
           and drop any block that is nothing but spacers. */
        while (kept.length && kept[0].kind === 'br') kept.shift();
        while (kept.length && kept[kept.length - 1].kind === 'br') kept.pop();
        if (!kept.some(function (it) { return it.kind !== 'br'; })) kept = [];

        const items = kept.map(function (it) {
          // Swap the messy pasted footer row for a clean list of links.
          if (it.kind === 'text' && isFooter && /Instagram/.test(it.text || '') && /About Kh/.test(it.text || '')) {
            return quickLinks();
          }
          if (it.kind === 'text') {
            const onMedia = s.isBanner && /249, 249, 249/.test(it.color || '');
            return '          ' + renderText(it, onMedia);
          }
          if (it.kind === 'br') return '          <br>';
          if (it.kind === 'divider') return '          <hr class="rule">';
          if (it.kind === 'image' || it.kind === 'imagelink') {
            const file = (slots.flow || [])[flowIdx++];
            const img = '<img class="media" src="assets/img/' + file + '" alt="' + (ALT[file] || '') + '" width="' + Math.round(it.imgRect.w) + '" height="' + Math.round(it.imgRect.h) + '">';
            return '          ' + (it.kind === 'imagelink' ? '<a class="media-link" href="' + rewrite(it.href) + '">' + img + '</a>' : img);
          }
          if (it.kind === 'carousel') {
            const files = (slots.carousel || [])[carIdx++] || [];
            if (files.length === 1) {
              // One image is a photograph, not a slideshow.
              return '          <img class="media" src="assets/img/' + files[0] + '" alt="">';
            }
            const ratio = round(it.slides[0].rect.w) + ' / ' + round(it.slides[0].rect.h);
            const slides = files.map(function (f, i) {
              return '              <div class="carousel__slide' + (i === 0 ? ' is-active' : '') + '" style="background-image:url(assets/img/' + f + ')" role="group" aria-label="Slide ' + (i + 1) + ' of ' + files.length + '"></div>';
            }).join('\n');
            const dots = files.map(function (f, i) {
              return '              <button class="carousel__dot' + (i === 0 ? ' is-active' : '') + '" type="button" aria-label="Show slide ' + (i + 1) + '"></button>';
            }).join('\n');
            return '          <div class="carousel" data-carousel>\n'
              + '            <div class="carousel__viewport" style="aspect-ratio:' + ratio + '">\n' + slides + '\n            </div>\n'
              + '            <div class="carousel__dots">\n' + dots + '\n            </div>\n'
              + '          </div>';
          }
          return '';
        }).filter(Boolean).join('\n');
        if (!items) return '';
        const pad = blockPadding(bl);
        const ps = pad && (pad.t || pad.r || pad.b || pad.l)
          ? ' style="padding:' + [pad.t, pad.r, pad.b, pad.l].map(function (v) { return v + 'px'; }).join(' ') + '"'
          : '';
        return '        <div class="block"' + ps + '>\n' + items + '\n        </div>';
      }).filter(Boolean).join('\n');
      const addition = (colIndex === appendTo) ? s.appendBlock : byCol[colIndex];
      const extra = addition
        ? '\n        <div class="block" style="padding:' + (s.appendPad || '0 8px 14px') + '">\n' + addition + '\n        </div>'
        : '';
      const empty = (!blocks.trim() && !extra.trim()) ? ' col--empty' : '';
      return '      <div class="col' + empty + '" style="width:' + wPct + '%">\n' + blocks + extra + '\n      </div>';
    }).join('\n');

    return '    <section class="' + cls.join(' ') + '"' + (st.length ? ' style="' + st.join(';') + '"' : '') + '>\n'
      + media
      + '      <div class="section__body">\n        <div class="grid">\n' + cols + '\n        </div>\n      </div>\n'
      + '    </section>';
  }

  /* Drop banner sections that have neither a background image nor any content.
     The original used one as a spacer at the top of About: harmless at desktop
     width, a large empty band above the fold on a phone. */
  const mainList = d.sections.filter(function (s) {
    if (s.where !== 'main') return false;
    if (!s.isBanner || s.hasBgImg) return true;
    const hasContent = s.columns.some(function (c) {
      return c.blocks.some(function (bl) { return bl.items.length; });
    });
    return hasContent;
  });
  let sectionsToRender = mainList;
  let aboutSections = [];

  /* Find a section by a phrase in its text, so injections stay anchored to
     content rather than to a fragile index. */
  function indexOfText(needle) {
    for (let i = 0; i < mainList.length; i++) {
      let hit = false;
      mainList[i].columns.forEach(function (c) {
        c.blocks.forEach(function (bl) {
          bl.items.forEach(function (it) {
            if (it.text && it.text.indexOf(needle) >= 0) hit = true;
          });
        });
      });
      if (hit) return i;
    }
    return -1;
  }

  /* Forms go inside the section whose copy introduces them, so they sit
     tight against that text instead of floating in a section of their own. */
  if (pg === ROOT_PAGE) {
    const at = indexOfText('Get product updates');
    if (at >= 0) mainList[at].appendBlock = subscribeForm();
  }
  if (pg === 'contact') {
    // Form serves both orders and general questions.
    const at = indexOfText('contact form below');
    if (at >= 0) mainList[at].appendBlock = contactForm();
  }

  /* About: replace the stacked table of contents with a horizontal section
     nav. Same idea as the original, but as one row rather than stray links
     above the photo, and with working anchor targets this time. */
  if (pg === 'about') {
    const tocDrop = [];
    mainList.forEach(function (s, i) {
      /* The old contents links come through as bare <div> text items, while
         real content is p / h1 / h2 / ul. A section made only of those divs
         is the table of contents. */
      let onlyToc = s.columns.some(function (c) { return c.blocks.length; });
      s.columns.forEach(function (c) {
        c.blocks.forEach(function (bl) {
          bl.items.forEach(function (it) {
            if (it.kind !== 'text' || it.tag !== 'div') onlyToc = false;
          });
        });
      });
      if (onlyToc) {
        tocDrop.push(i);
        const next = mainList[i + 1];
        if (next && /WxWicb/.test(next.cls)) tocDrop.push(i + 1);
      }
    });
    if (tocDrop.length) {
      sectionsToRender = sectionsToRender.filter(function (s) {
        return tocDrop.indexOf(mainList.indexOf(s)) < 0;
      });
    }

    /* Give each section heading an anchor, and collect them for the nav. */
    aboutSections = [];
    mainList.forEach(function (s) {
      s.columns.forEach(function (c) {
        c.blocks.forEach(function (bl) {
          bl.items.forEach(function (it) {
            if (it.kind !== 'text' || it.tag !== 'h1') return;
            const label = (it.text || '').trim();
            // Skip headings that the REMOVE list drops from the page.
            const dropped = (REMOVE[pg] || []).some(function (phrase) { return label.indexOf(phrase) >= 0; });
            if (dropped) return;
            const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            it.anchorId = id;
            aboutSections.push({ id: id, label: label });
          });
        });
      });
    });
  }

  /* About: "About Khosla" is the page title; everything after it is a section
     within the page, so step those down a level. Without this all three sit at
     45px and the page has no hierarchy at all. */
  if (pg === 'about') {
    let seenFirstH1 = false;
    mainList.forEach(function (s) {
      s.columns.forEach(function (c) {
        c.blocks.forEach(function (bl) {
          bl.items.forEach(function (it) {
            if (it.kind !== 'text' || it.tag !== 'h1') return;
            if (!seenFirstH1) { seenFirstH1 = true; return; }
            it.sectionHeading = true;
          });
        });
      });
    });
  }

  /* About: the ingredients invitation goes in the text column, which is the
     narrower one — the wide column holds the photo. */
  if (pg === 'about') {
    const at = indexOfText('Getting the best results');
    if (at >= 0) {
      const byCol = {};
      mainList[at].columns.forEach(function (c, i) {
        c.blocks.forEach(function (bl) {
          bl.items.forEach(function (it) {
            if (it.text && it.text.indexOf('Getting the best results') >= 0) byCol[i] = ingredientsBlock();
          });
        });
      });
      mainList[at].appendByCol = byCol;
    }
    // The Ingredients heading is authored here, so add it to the nav by hand.
    aboutSections.push({ id: 'ingredients', label: 'Ingredients' });
  }

  /* Home product tiles: show each price under its title. Which column holds
     which product is read from the tile's own link, not hardcoded. */
  if (pg === ROOT_PAGE) {
    mainList.forEach(function (s) {
      const byCol = {};
      s.columns.forEach(function (c, i) {
        c.blocks.forEach(function (bl) {
          bl.items.forEach(function (it) {
            if (it.kind !== 'imagelink' || !it.href) return;
            const slug = it.href.replace(/^\/view\/khoslademo\/?/, '').split('#')[0];
            if (PRICES[slug]) byCol[i] = '          <p class="price price--tile ta-c">' + fromPrice(slug) + '</p>';
          });
        });
      });
      if (Object.keys(byCol).length) {
        /* The original row was two products either side of a spacer. With a
           third product the spacer becomes a tile, built to match its
           neighbours: photograph, name, then price. */
        let empty = -1;
        s.columns.forEach(function (c, i) {
          if (empty < 0 && !c.blocks.length && byCol[i] === undefined) empty = i;
        });
        if (empty >= 0 && !MODEL.__leaveInTilePlaced) {
          const pg2 = 'khosla-leave-in';
          byCol[empty] = [
            '          <a class="media-link" href="' + pageFile(pg2) + '">',
            '            <img class="media" src="assets/img/leave-in-1.jpg" alt="Khosla Leave In jar" width="337" height="337">',
            '          </a>',
            '          <h2 class="t ta-c" style="margin:14px 0 0"><a href="' + pageFile(pg2) + '">'
              + '<span style="text-decoration:underline">Leave In</span></a></h2>',
            /* 14px matches the gap the other tiles get from sitting in
               separate blocks; this tile is a single block. */
            '          <p class="price price--tile ta-c" style="margin-top:14px">' + fromPrice(pg2) + '</p>',
          ].join('\n');
          MODEL.__leaveInTilePlaced = true;
          s.appendPad = '0 0 14px';
        }
        s.appendByCol = byCol;
      }
    });
  }

  /* Testimonials: the export carries the same three placeholder quotes twice,
     above and below the carousel. Keep the first block's position for the live
     reviews, drop the duplicate, and put the submit form under the invitation. */
  if (pg === 'testimonials') {
    const quoteMarker = "I've been coming here for years";
    const quoteAt = [];
    mainList.forEach(function (s, i) {
      s.columns.forEach(function (c) {
        c.blocks.forEach(function (bl) {
          bl.items.forEach(function (it) {
            if (it.text && it.text.indexOf(quoteMarker) >= 0 && quoteAt.indexOf(i) < 0) quoteAt.push(i);
          });
        });
      });
    });
    // Second occurrence is the duplicate: drop it and the rule that follows.
    const drop = [];
    if (quoteAt.length > 1) {
      drop.push(quoteAt[1]);
      const next = mainList[quoteAt[1] + 1];
      if (next && /WxWicb/.test(next.cls)) drop.push(quoteAt[1] + 1);
    }
    sectionsToRender = mainList.filter(function (s, i) { return drop.indexOf(i) < 0; });

    const invite = indexOfText('Leave a testimonial below');
    if (invite >= 0) mainList[invite].appendBlock = reviewForm();
  }

  const rendered = sectionsToRender.map(function (s) {
    // The first placeholder-quote section becomes the live reviews list.
    if (pg === 'testimonials') {
      let isQuotes = false;
      s.columns.forEach(function (c) {
        c.blocks.forEach(function (bl) {
          bl.items.forEach(function (it) {
            if (it.text && it.text.indexOf("I've been coming here for years") >= 0) isQuotes = true;
          });
        });
      });
      if (isQuotes) {
        return makeSection({
          cols: [{ width: 100, pad: '14px 0', html: '          <div class="reviews" data-reviews></div>' }],
        });
      }
    }
    return renderSection(s);
  });

  /* Contact: how-to-order on top, form in the middle, email underneath.
     The original page had the email above the form; it reads better as the
     fallback after the primary route. */
  if (pg === 'contact') {
    let emailAt = -1, formAt = -1;
    sectionsToRender.forEach(function (s, i) {
      s.columns.forEach(function (c) {
        c.blocks.forEach(function (bl) {
          bl.items.forEach(function (it) {
            if (!it.text) return;
            if (it.text.indexOf('contact us by email') >= 0 && emailAt < 0) emailAt = i;
            if (it.text.indexOf('contact form below') >= 0 && formAt < 0) formAt = i;
          });
        });
      });
    });
    if (emailAt >= 0) rendered[emailAt] = howToOrderSection();
    if (formAt >= 0) {
      const next = sectionsToRender[formAt + 1];
      const at = (next && /WxWicb/.test(next.cls)) ? formAt + 2 : formAt + 1;
      rendered.splice(at, 0, emailSection(), ruleSection());
    }
  }

  /* About: section nav goes above the content, after the (empty) banner. */
  if (pg === 'about' && aboutSections.length) {
    let bannerAt = -1;
    sectionsToRender.forEach(function (s, i) { if (s.isBanner && bannerAt < 0) bannerAt = i; });
    rendered.splice(bannerAt + 1, 0, sectionNav(aboutSections), ruleSection());
  }

  /* Home: ordering section straight after the product tiles, so visitors see
     how to buy without opening a product page first. */
  if (pg === ROOT_PAGE) {
    let tilesAt = -1;
    sectionsToRender.forEach(function (s, i) {
      s.columns.forEach(function (c) {
        c.blocks.forEach(function (bl) {
          bl.items.forEach(function (it) {
            if (it.kind === 'imagelink' && tilesAt < 0) tilesAt = i;
          });
        });
      });
    });
    if (tilesAt >= 0) {
      // Sit after the divider that already follows the tiles, if there is one.
      const next = sectionsToRender[tilesAt + 1];
      const at = (next && /WxWicb/.test(next.cls)) ? tilesAt + 2 : tilesAt + 1;
      rendered.splice(at, 0, orderSection(), ruleSection());
    }
  }

  // Product pages: price, then the prompt to order via the contact form.
  if (PRICES[pg]) {
    const p = PRICES[pg];
    rendered.push(ruleSection());
    rendered.push(makeSection({
      cols: [
        { width: 25 },
        {
          width: 50,
          html: [
            priceList(pg),
            '          <p class="order-note ta-c">Message us with the size and quantity you’d like and where to ship it. We’ll reply with your total and payment details.</p>',
            '          <p class="ta-c" style="margin:0"><a class="button" href="contact.html">Place an order</a></p>',
          ].join('\n'),
        },
        { width: 25 },
      ],
    }));
  }

  const mainSecs = rendered.join('\n');
  const footSecs = d.sections.filter(function (s) { return s.where === 'footer'; }).map(renderSection).join('\n');
  const hasCarousel = /data-carousel/.test(mainSecs);
  const hasForm = /data-w3form/.test(mainSecs);
  const hasReviews = /data-reviews|data-review-form/.test(mainSecs);

  return '<!DOCTYPE html>\n'
    + '<html lang="en">\n'
    + '<head>\n'
    + '<meta charset="utf-8">\n'
    + '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
    + '<title>' + d.title + '</title>\n'
    + '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
    + '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
    + '<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto%3Ai%2Cbi%2C700%2C400&amp;display=swap">\n'
    + '<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto%20Serif%3Ai%2Cbi%2C700%2C400&amp;display=swap">\n'
    + '<link rel="stylesheet" href="assets/css/site.css">\n'
    + '</head>\n'
    + '<body>\n'
    + '<a class="skip-link" href="#main">Skip to main content</a>\n\n'
    + '<header class="sidebar">\n'
    + '  <nav class="nav" aria-label="Main">\n'
    + '    <a class="nav__brand" href="' + pageFile(ROOT_PAGE) + '">' + d.brand + '</a>\n'
    + '    <ul class="nav__list">\n' + nav + '\n    </ul>\n'
    + '  </nav>\n'
    + '</header>\n\n'
    + '<div class="page">\n'
    + '  <main class="main" id="main">\n' + mainSecs + '\n  </main>\n\n'
    + '  <footer class="footer">\n' + footSecs + '\n  </footer>\n'
    + '</div>\n'
    + (hasCarousel ? '\n<script src="assets/js/carousel.js"></script>\n' : '')
    + (hasForm ? '\n<script src="assets/js/forms.js"></script>\n' : '')
    + (hasReviews ? '\n<script src="assets/js/reviews.js"></script>\n' : '')
    + '</body>\n</html>\n';
}

Object.keys(MODEL).forEach(function (pg) {
  if (DROPPED.indexOf(pg) >= 0) { console.log('skipped', pg, '(retired)'); return; }
  const file = pageFile(pg);
  fs.writeFileSync(path.join(OUT, file), build(pg));
  console.log('wrote', file + (file === 'index.html' ? '  <- ' + pg : ''));
});
