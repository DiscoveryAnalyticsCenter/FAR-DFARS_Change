import re, html

def strip_html_tags(text: str):
  # Return Empty String if given text is less than 8 words or None Type
  if text is None or len(re.findall(r'\b\w+\b', text)) <= 8:
    return ""
  text = re.sub(r'<br\s*/?>', ' ', text, flags=re.IGNORECASE)  # Replace <br> tags with spaces
  clean_text = re.sub(r'<.*?>', '', text)
  clean_text = html.unescape(clean_text)
  return f"{clean_text}\n"