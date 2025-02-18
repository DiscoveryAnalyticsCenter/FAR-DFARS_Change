export function stripHTML(input: string) {
  if (!input || input.length == 0) return "";
  let str = input.replace(/<\/?[^>]+(>|$)/g, "");
  str = str.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
  return str;
} 