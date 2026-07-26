/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export -> builds to `out/` for upload to Hostinger public_html.
  output: 'export',
  images: { unoptimized: true },
  reactStrictMode: true,
  // Static hosts serve /about as /about/index.html; trailing slash keeps links tidy.
  trailingSlash: true,
};

module.exports = nextConfig;
