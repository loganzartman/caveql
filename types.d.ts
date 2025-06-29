declare module "url:*" {
  const url: string;
  export default url;
}

declare module "jsx:*" {
  import type { SVGProps } from "react";
  const jsx: React.FC<SVGProps<SVGSVGElement>>;
  export default jsx;
}
