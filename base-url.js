// One place the server and the emails both resolve the site's origin.
//
// They used to work it out separately, and had already drifted: the emails
// dropped the RAILWAY_PUBLIC_DOMAIN step, so on a preview deploy the "review &
// respond" button pointed at the preview host while the logo in the same email
// pointed at production.
function resolveBaseUrl(env = process.env, port = env.PORT || 3000) {
  if (env.BASE_URL) return env.BASE_URL.replace(/\/$/, '');
  if (env.CANONICAL_HOST) return `https://${env.CANONICAL_HOST}`;
  if (env.RAILWAY_PUBLIC_DOMAIN) return `https://${env.RAILWAY_PUBLIC_DOMAIN}`;
  return `http://localhost:${port}`;
}

module.exports = { resolveBaseUrl };
