export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .normalize("NFD") // Descompone caracteres con tildes
    .replace(/[\u0300-\u036f]/g, "") // Remueve tildes
    .replace(/[^\w\s-]/g, "") // Remueve caracteres especiales
    .trim()
    .replace(/\s+/g, "-") // Reemplaza espacios con guiones
    .replace(/-+/g, "-"); // Remueve guiones duplicados
};