interface PreviewProps {
  html: string;
}

export function Preview({ html }: PreviewProps) {
  return (
    <div
      className="preview-pane"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
