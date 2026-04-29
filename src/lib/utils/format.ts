export function formatDate(date: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
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
