export const slugify = (text: string) => {
    return text
        .toString()
        .toLowerCase()
        .normalize("NFD") // Split accents from characters
        .replace(/[\u0300-\u036f]/g, "") // Remove accent characters
        .trim()
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/[^\w\-]+/g, '') // Remove all non-word chars
        .replace(/\-\-+/g, '-'); // Replace multiple - with single -
};
