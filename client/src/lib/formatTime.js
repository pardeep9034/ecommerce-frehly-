const timeFormat = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" });
const dayFormat = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });

// "2 min ago" / "1 h ago" / "7:24 AM" (today) / "Yesterday" / "12 Sep" / "Never"
export const formatLastLogin = (value) => {
  if (!value) return "Never";
  const date = new Date(value);
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 180) return `${Math.floor(minutes / 60)} h ago`;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  if (date >= startOfToday) return timeFormat.format(date);
  if (date >= new Date(startOfToday.getTime() - 86400000)) return "Yesterday";
  return dayFormat.format(date);
};
