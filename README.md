# NY-LA Scoring & Sound Design Co — static site for GitHub Pages

This folder contains the full website as plain static files. It needs no build step, server or database.
Links and asset URLs in `index.html` and `accessibility.html` are relative, so they work at a domain root
(`https://scoringandsounddesign.com/`) and under a project path (`https://<user>.github.io/<repo>/`).
`404.html` uses root-absolute paths (`/assets/...`) because GitHub Pages serves it at whatever address was
requested, so it displays correctly only at a domain root.

| File | Purpose |
| --- | --- |
| `index.html` | Home page, prerendered so it shows before any JavaScript runs |
| `accessibility.html` | Accessibility statement |
| `404.html` | Shown by GitHub Pages for unknown addresses |
| `assets/` | Fingerprinted scripts, fonts and images |
| `og-image.jpg` | 1200×630 preview image shown when the site is shared on social media or in messaging apps |
| `cloudflare/contact-worker.js` | Cloudflare Worker that forwards contact form messages to Slack (see **Contact form**) |
| `.nojekyll` | Tells GitHub Pages to serve the files as-is (keep this file) |
| `robots.txt`, `sitemap.xml` | Search engine files for `https://scoringandsounddesign.com` |
| `_headers` | Security headers for Cloudflare Pages or Netlify (GitHub Pages ignores it) |

## Publish on GitHub Pages

1. Create a GitHub repository and upload **everything in this folder** to the repository root, including the
   hidden `.nojekyll` file. On macOS, press `Cmd + Shift + .` in Finder to show hidden files before dragging.
2. In the repository, open **Settings → Pages**. Under **Build and deployment**, choose **Deploy from a branch**,
   select `main` and `/ (root)`, then click **Save**. The site goes live a minute or two later.
3. To use your own domain, enter `scoringandsounddesign.com` under **Custom domain**, then add these DNS records at
   your domain registrar. When the certificate is ready, turn on **Enforce HTTPS**.

| Type | Name | Value |
| --- | --- | --- |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| AAAA | `@` | `2606:50c0:8000::153` |
| AAAA | `@` | `2606:50c0:8001::153` |
| AAAA | `@` | `2606:50c0:8002::153` |
| AAAA | `@` | `2606:50c0:8003::153` |
| CNAME | `www` | `<your-github-username>.github.io` |

## Contact form

The **Send message** button posts the form to `/api/contact` on the site's own domain. GitHub Pages cannot run
server code, so a Cloudflare Worker answers that address and forwards each message to Slack through an incoming
webhook. The Worker's code is in `cloudflare/contact-worker.js`. It holds no secrets, so it is safe for it to be
published with the site.

Set up the Worker in Cloudflare **before** publishing a site that posts to `/api/contact`:

1. Open **Workers & Pages**, create a Worker from the **Hello World** template (for example named `contact-form`)
   and deploy it.
2. Select **Edit code**, replace all of the code with the contents of `cloudflare/contact-worker.js`, then deploy.
3. In the Worker's **Settings → Variables and Secrets**, add a variable of type **Secret** named
   `SLACK_WEBHOOK_URL` whose value is the Slack incoming webhook URL. Keep the webhook URL out of every file.
4. In **Settings → Domains & Routes**, add a **Route**: zone `scoringandsounddesign.com`, route
   `scoringandsounddesign.com/api/contact`.

The Worker runs on the same domain as the site, so the page's security policy (`connect-src 'self'`) already allows
it. It accepts posts only from `https://scoringandsounddesign.com` (and `www.`), and it re-checks every field with
the same limits as the form. It escapes the text so a visitor cannot post links or `@channel` pings into Slack.
If the Worker or Slack is unavailable, the form keeps what the visitor typed and shows the email address and phone
number instead.

To use a different form service, put its address in this line in each HTML file and add the address to
`connect-src` in the `Content-Security-Policy` (the meta tag and the Cloudflare header rule). Leave the value empty
to fall back to opening the visitor's email app.

```html
<meta name="form-endpoint" content="/api/contact" />
```

## Security headers

GitHub Pages does not let a site set its own HTTP response headers. This build applies everything that works from
inside a page: a strict Content Security Policy with hash-allowed inline scripts and a referrer policy, both as
`<meta>` tags. Headers that only work as real HTTP headers (HSTS, `X-Content-Type-Options`, frame protection and
cross-origin policies) cannot be added on GitHub Pages, so a Mozilla HTTP Observatory scan of a plain GitHub Pages
site will score below A+.

For an A+ result, either:

- serve the GitHub Pages site through **Cloudflare** and add the headers listed in `_headers` with a
  Response Header Transform Rule, or
- deploy this same folder to **Cloudflare Pages** or **Netlify**, which apply `_headers` automatically.

## Performance

- **Fonts.** Instrument Serif (normal and italic) and Geist Mono are served as trimmed `*-core-*.woff2` files. These
  cover basic Latin plus the punctuation the site uses (© · – — ‘ ’ “ ” …) and keep every OpenType feature.
  The original files stay in each `@font-face` list with the remaining `unicode-range`, so a browser downloads them
  only if a page ever shows another character. Geist (the body font, also used in the form fields) is not trimmed.
  If you change the site's text to include other characters, it still renders correctly; it just loads the full
  font.
- **Preloads.** The fonts that appear above the fold are preloaded in each page's `<head>`, and the favicon is
  inlined as a `data:` URI to save a request.

For the fastest responses through Cloudflare, add two **Cache Rules** (Caching → Cache Rules). Paste each expression
with **Edit expression**:

| Rule | Expression | Cache eligibility | Edge TTL | Browser TTL |
| --- | --- | --- | --- | --- |
| Assets | `(http.host eq "scoringandsounddesign.com" and starts_with(http.request.uri.path, "/assets/"))` | Eligible for cache | Ignore cache-control header: 1 year | Override origin: 1 year |
| Pages | `(http.host eq "scoringandsounddesign.com" and not starts_with(http.request.uri.path, "/assets/") and not starts_with(http.request.uri.path, "/api/"))` | Eligible for cache | Ignore cache-control header: 1 day | Override origin: 10 minutes |

Files in `assets/` have a fingerprint in their name, so caching them for a year is safe. Pages keep a short browser
TTL so visitors see updates. Cloudflare's edge keeps them for a day, so **after every upload to GitHub, purge the
cache** (Caching → Configuration → Purge Everything). Also turn on **Tiered Cache** with the **Smart** topology
(Caching → Tiered Cache). It is free.

## Hosting at a different address

`robots.txt`, `sitemap.xml` and these tags in the HTML files point to `https://scoringandsounddesign.com`:
the `canonical` link and `og:url` in `index.html` and `accessibility.html`, and `og:image` / `twitter:image` in all
three HTML files. If the site lives elsewhere, replace that address in each of them. Social previews need an absolute
image URL, so the share image shows only once the domain serves this site.
