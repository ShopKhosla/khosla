# Khosla

Static website for Khosla, a natural haircare brand. Plain HTML, CSS and a
little vanilla JavaScript — no framework, no build step required to view it.

Originally a Google Sites site, rebuilt to match it visually while dropping the
tracking scripts and generated markup it came wrapped in.

## Running it locally

Any static file server works:

```bash
python -m http.server 8080
```

Then open <http://localhost:8080/>. Opening `index.html` straight off disk works
too, since every path is relative.

## Layout

```
index.html              Home (site root)
about.html              About
testimonials.html       Testimonials, with customer reviews
contact.html            How to order, contact form, email
tallow-cream.html       Product: Khosla Tallow Cream
khosla-hair-oil.html    Product: Khosla Hair Oil
faq.html                FAQ
terms-of-policy.html    }
refund-policy.html      }  Policies
privacy-policy.html     }
shipping-policy.html    }

assets/css/site.css     All styling
assets/js/carousel.js   Product image slideshows
assets/js/forms.js      Contact and subscribe forms
assets/js/reviews.js    Customer reviews
assets/img/             Photography and banners

tools/build.js          Page generator (see below)
tools/model.json        Page content, extracted from the original site
```

## Editing content

The HTML pages are **generated**. Editing them by hand works, but the next
rebuild overwrites your changes — so for anything you want to keep, edit
`tools/build.js` and regenerate:

```bash
cd tools
node build.js
```

No dependencies; any recent Node will do.

Things worth knowing are kept near the top of `build.js`:

| What | Where |
|---|---|
| Prices | `PRICES` |
| Ordering instructions | `ORDER_STEPS` |
| Contact email | `EMAIL` |
| Footer links | `FOOTER_LINKS` |
| Copy replacements | `COPY` |
| Removed content | `REMOVE` |

Prices are defined once and appear on both the Home tiles and the product
pages, so they can't drift apart.

Purely visual changes usually belong in `assets/css/site.css` instead, and take
effect without a rebuild.

## Third-party services

**Web3Forms** handles the contact and subscribe forms. Submissions arrive by
email, distinguished by their subject line (`New message from the Khosla
website` / `New newsletter subscriber`).

**Supabase** stores customer reviews. Reviews publish immediately; moderation is
deleting a row in the Supabase table editor. Row level security allows the
public to read approved reviews and add new ones, and nothing else — the site's
key cannot edit or delete.

Both keys in the source are publishable client-side keys, meant to be visible in
page source. Neither grants administrative access.

## Browser support

Current versions of Chrome, Firefox, Safari and Edge. The layout uses flexbox,
CSS grid, custom properties and `aspect-ratio`.
