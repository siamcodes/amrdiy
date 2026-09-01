const Blog = require("../models/blog");
const Course = require("../models/course");
const Product = require("../models/product");
const { clientUrl, clientOrigin } = require("../config/env");

const stripHtml = (html) => String(html || "")
  .replace(/<[^>]*>/g, " ")
  .replace(/&nbsp;/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const truncate = (text, max) => (text.length > max ? `${text.slice(0, max - 1).trim()}…` : text);

const escapeHtml = (value) => String(value || "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");

const defaultImage = `${clientOrigin}/logo512.png`;

// minimal static HTML with Open Graph tags for share-link crawlers (LINE, Facebook, etc.)
// that don't execute JS; real visitors are bounced to the SPA route immediately after.
const renderSharePage = ({ title, description, image, url }) => {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(truncate(description, 200));
  const safeImage = escapeHtml(image || defaultImage);
  const safeUrl = escapeHtml(url);
  return `<!doctype html>
<html lang="th">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${safeTitle}</title>
<meta name="description" content="${safeDescription}" />
<meta property="og:type" content="article" />
<meta property="og:title" content="${safeTitle}" />
<meta property="og:description" content="${safeDescription}" />
<meta property="og:image" content="${safeImage}" />
<meta property="og:url" content="${safeUrl}" />
<meta property="og:site_name" content="AMR DIY" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${safeTitle}" />
<meta name="twitter:description" content="${safeDescription}" />
<meta name="twitter:image" content="${safeImage}" />
<meta http-equiv="refresh" content="0; url=${safeUrl}" />
<script>location.replace(${JSON.stringify(url)});</script>
</head>
<body>
<p><a href="${safeUrl}">${safeTitle}</a></p>
</body>
</html>`;
};

const notFoundPage = (message) => `<!doctype html><html lang="th"><head><meta charset="UTF-8" />
<title>ไม่พบหน้าที่ต้องการ</title></head><body><p>${escapeHtml(message)}</p>
<script>location.replace(${JSON.stringify(clientUrl)});</script></body></html>`;

exports.blogShare = async (req, res) => {
  const blog = await Blog.findOne({ slug: req.params.slug, status: "published" }).lean();
  if (!blog) return res.status(404).type("html").send(notFoundPage("ไม่พบบทความนี้"));
  res.type("html").send(renderSharePage({
    title: blog.seoTitle || blog.title,
    description: blog.seoDescription || blog.excerpt || stripHtml(blog.content),
    image: blog.heroImage?.url,
    url: `${clientUrl}/blog/${blog.slug}`,
  }));
};

exports.courseShare = async (req, res) => {
  const course = await Course.findOne({ slug: req.params.slug, status: "published" }).lean();
  if (!course) return res.status(404).type("html").send(notFoundPage("ไม่พบคอร์สนี้"));
  res.type("html").send(renderSharePage({
    title: course.title,
    description: course.subtitle || stripHtml(course.description),
    image: course.thumbnail?.url,
    url: `${clientUrl}/courses/${course.slug}`,
  }));
};

exports.productShare = async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug }).lean();
  if (!product) return res.status(404).type("html").send(notFoundPage("ไม่พบสินค้านี้"));
  res.type("html").send(renderSharePage({
    title: product.title,
    description: stripHtml(product.description),
    image: product.images?.[0]?.url,
    url: `${clientUrl}/product/${product.slug}`,
  }));
};
