type Props = {
  as?: keyof HTMLElementTagNameMap;
  html: string;
  className?: string;
};

export function HtmlText({ as = "span", html, className }: Props) {
  const Tag = as as "span";
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
