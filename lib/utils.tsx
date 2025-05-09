export function stripHTML(input: string) {
  if (!input || input.length == 0) return "";

  let str = input.toString().replace(/<\/?[^>]+(>|$)/g, "");
  str = str.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
  return str;
} 

export function decodeHTMLEntities(text: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "text/html");
  return doc.documentElement.textContent;
}
