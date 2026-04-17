function isImageData2(content: string): boolean {
  const imagePattern = /\[\[ binary data (\d+) (KiB|MiB) (\w+) (\d+)x(\d+) \]\]/;
  return Boolean(content.match(imagePattern))
}

function isImageData(content: string): boolean {
  // Check for cliphist's binary data placeholder format
  // Format: [[ binary data <size> <type> <dimensions> ]]
  if (content.startsWith("[[") && content.includes("binary data")) {
    return true;
  }

  // Check for common image magic bytes (first few characters)
  // PNG: starts with �PNG
  // JPEG: starts with ���� or ����
  // GIF: starts with GIF87a or GIF89a
  // BMP: starts with BM

  // Check if content looks like binary data (has non-printable characters)
  const hasBinaryData = /[\x00-\x08\x0E-\x1F\x80-\xFF]/.test(
    content.substring(0, 100),
  );

  // Check for PNG signature
  if (content.startsWith("\x89PNG") || content.includes("PNG\r\n"))
    return true;

  // Check for JPEG signature
  if (content.startsWith("\xFF\xD8\xFF")) return true;

  // Check for GIF signature
  if (content.startsWith("GIF8")) return true;

  // Check for BMP signature
  if (content.startsWith("BM")) return true;

  // If it has binary data and is reasonably large, assume it's an image
  return hasBinaryData && content.length > 100;
}
