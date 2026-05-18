export function formatDate(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(parsed);
}

export function formatShortDate(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
  }).format(parsed);
}

export function formatMonthLabel(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
  }).format(parsed);
}

export function formatRelativeHours(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  const diff = Date.now() - parsed.getTime();
  const hours = Math.max(1, Math.round(diff / (1000 * 60 * 60)));

  if (hours < 24) {
    return `${hours} 小时前`;
  }

  const days = Math.round(hours / 24);
  return `${days} 天前`;
}

export function labelSavedType(type: string) {
  switch (type) {
    case "interview":
      return "面试谈资";
    case "case":
      return "商赛素材";
    case "content":
      return "内容选题";
    case "research":
      return "行业研究";
    default:
      return type;
  }
}
