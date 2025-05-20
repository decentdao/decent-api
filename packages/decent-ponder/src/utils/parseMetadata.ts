export function parseProposalMetadata(
  metadata: string,
): {
  title: string;
  description: string;
} {
  try {
    return JSON.parse(metadata);
  } catch {
    const titleMatch = metadata.match(/"title"\s*:\s*"([^"]+?)"/);
    const title = titleMatch?.[1] ?? '';

    let description = '';
    const start = metadata.indexOf('"description":"');
    if (start !== -1) {
      const end = metadata.lastIndexOf('","documentationUrl"');
      if (end !== -1) {
        description = metadata.substring(start + 14, end);
      }
    }
    return { title, description };
  }
}
