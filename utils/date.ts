export function formatDate(dateString?: string, locale = "en-US") {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function timeAgo(date?: string) {
  if (!date) return "";
  const now = new Date();
  const target = new Date(date);
  if (Number.isNaN(target.getTime())) return "";

  const diff = Math.max(0, now.getTime() - target.getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatPostDate(date?: string) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Math.max(0, new Date().getTime() - d.getTime());
  return diff <= 7 * 24 * 60 * 60 * 1000 ? timeAgo(date) : formatDate(date);
}
