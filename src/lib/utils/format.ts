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

export function labelSavedType(type: string) {
  switch (type) {
    case "interview":
      return "面试谈资";
    case "case":
      return "商赛素材";
    case "content":
      return "文章选题";
    case "research":
      return "行业研究";
    default:
      return type;
  }
}
