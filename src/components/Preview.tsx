import { forwardRef } from "react";

interface PreviewProps {
  html: string;
}

export const Preview = forwardRef<HTMLDivElement, PreviewProps>(function Preview({ html }, ref) {
  return (
    <div
      ref={ref}
      className="preview-pane"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});
