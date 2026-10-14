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

GitHub Pages cannot run server code, so by default the **Send message** button opens the visitor's email app with
their message already addressed to `info@scoringandsounddesign.com`.

To get submissions without an email app, create a free form at [Formspree](https://formspree.io), copy its endpoint
(for example `https://formspree.io/f/abcdwxyz`) and paste it into this line in `index.html`:

```html
<meta name="form-endpoint" content="" />
```

The page's security policy already allows Formspree. If you use another form service, also add its address to
`connect-src` in the `Content-Security-Policy` meta tag at the top of `index.html`.

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

## Hosting at a different address

`robots.txt`, `sitemap.xml` and these tags in the HTML files point to `https://scoringandsounddesign.com`:
the `canonical` link and `og:url` in `index.html` and `accessibility.html`, and `og:image` / `twitter:image` in all
three HTML files. If the site lives elsewhere, replace that address in each of them. Social previews need an absolute
image URL, so the share image shows only once the domain serves this site.
