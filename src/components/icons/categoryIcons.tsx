import type { ComponentType } from "react";
import { IconBase, type IconProps } from "./IconBase";
import type { ToolCategory } from "../../types/tool";

export function Grid3x3Icon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="3" width="5.5" height="5.5" rx="1" />
      <rect x="9.25" y="3" width="5.5" height="5.5" rx="1" />
      <rect x="15.5" y="3" width="5.5" height="5.5" rx="1" />
      <rect x="3" y="9.25" width="5.5" height="5.5" rx="1" />
      <rect x="9.25" y="9.25" width="5.5" height="5.5" rx="1" />
      <rect x="15.5" y="9.25" width="5.5" height="5.5" rx="1" />
      <rect x="3" y="15.5" width="5.5" height="5.5" rx="1" />
      <rect x="9.25" y="15.5" width="5.5" height="5.5" rx="1" />
      <rect x="15.5" y="15.5" width="5.5" height="5.5" rx="1" />
    </IconBase>
  );
}

export function ImageCategoryIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" fill="currentColor" stroke="none" />
      <path d="M21 16l-5.5-5.5-4 4-2.5-2.5L3 18" />
    </IconBase>
  );
}

export function VideoCategoryIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M10.5 9l5 3-5 3z" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function DesignCategoryIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
    </IconBase>
  );
}

export function SocialCategoryIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="6" cy="12" r="2.3" />
      <circle cx="17" cy="6" r="2.3" />
      <circle cx="17" cy="18" r="2.3" />
      <path d="M8.1 10.8L14.9 7.2M8.1 13.2L14.9 16.8" />
    </IconBase>
  );
}

export function BrandCategoryIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 3h12v18l-6-4-6 4V3z" />
    </IconBase>
  );
}

export function QaCategoryIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </IconBase>
  );
}

export function AssetsCategoryIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </IconBase>
  );
}

export function ProductionCategoryIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M21 8l-9-5-9 5 9 5 9-5z" />
      <path d="M3 8v9l9 5 9-5V8" />
      <path d="M12 13v9" />
    </IconBase>
  );
}

export function ReviewCategoryIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </IconBase>
  );
}

export const CATEGORY_ICONS: Record<ToolCategory, ComponentType<IconProps>> = {
  image: ImageCategoryIcon,
  video: VideoCategoryIcon,
  design: DesignCategoryIcon,
  social: SocialCategoryIcon,
  brand: BrandCategoryIcon,
  qa: QaCategoryIcon,
  assets: AssetsCategoryIcon,
  production: ProductionCategoryIcon,
  review: ReviewCategoryIcon,
};
