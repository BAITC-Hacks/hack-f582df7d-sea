export const CATEGORY_COLORS: Record<string, string> = {
  Еда: "#e07b39",
  Транспорт: "#3d7bd9",
  Жилье: "#7c5cd6",
  Развлечения: "#d64f8a",
  Образование: "#2aa876",
  Здоровье: "#d94848",
  Одежда: "#c9a227",
  Другое: "#8a8f98",
};

export const colorOf = (cat: string) => CATEGORY_COLORS[cat] ?? "#8a8f98";
