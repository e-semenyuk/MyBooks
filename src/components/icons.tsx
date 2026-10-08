import type { SVGProps } from 'react'

// Outline icons, 1.5px stroke, 24px grid. Decorative by default (aria-hidden);
// pass aria-label to make one meaningful.
type IconProps = SVGProps<SVGSVGElement>

function Svg({ children, className = 'h-5 w-5', ...rest }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden={rest['aria-label'] ? undefined : true}
      className={className}
      {...rest}
    >
      {children}
    </svg>
  )
}

export const SearchIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></Svg>
)
export const CartIcon = (p: IconProps) => (
  <Svg {...p}><path d="M3 4h2.2l1.6 10.2a1 1 0 0 0 1 .8h8.6a1 1 0 0 0 1-.76L19 8H6" /><circle cx="9" cy="19" r="1.2" /><circle cx="17" cy="19" r="1.2" /></Svg>
)
export const UserIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.8-3.4 3.6-5.2 7-5.2s6.2 1.8 7 5.2" /></Svg>
)
export const LockIcon = (p: IconProps) => (
  <Svg {...p}><rect x="5" y="10.5" width="14" height="9.5" rx="1.5" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></Svg>
)
export const PackageIcon = (p: IconProps) => (
  <Svg {...p}><path d="m12 3 8 4v10l-8 4-8-4V7z" /><path d="m4 7 8 4 8-4M12 11v10" /></Svg>
)
export const BookIcon = (p: IconProps) => (
  <Svg {...p}><path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z" /><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3" /></Svg>
)
export const CheckIcon = (p: IconProps) => (
  <Svg {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></Svg>
)
export const XIcon = (p: IconProps) => (
  <Svg {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>
)
export const AlertIcon = (p: IconProps) => (
  <Svg {...p}><path d="M12 4 3 19.5h18z" /><path d="M12 10v4.5M12 17.2v.1" /></Svg>
)
export const ArrowLeftIcon = (p: IconProps) => (
  <Svg {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></Svg>
)
export const ArrowRightIcon = (p: IconProps) => (
  <Svg {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Svg>
)
export const PlusIcon = (p: IconProps) => (
  <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>
)
export const MinusIcon = (p: IconProps) => (
  <Svg {...p}><path d="M5 12h14" /></Svg>
)
export const TrashIcon = (p: IconProps) => (
  <Svg {...p}><path d="M4 7h16M10 7V4.5h4V7M6.5 7l.8 12.2a1 1 0 0 0 1 .8h7.4a1 1 0 0 0 1-.8L17.5 7M10 11v5M14 11v5" /></Svg>
)
export const EditIcon = (p: IconProps) => (
  <Svg {...p}><path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17z" /><path d="m14.5 7.5 3 3" /></Svg>
)
export const LogoutIcon = (p: IconProps) => (
  <Svg {...p}><path d="M14 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 8l-4 4 4 4M6 12h10" /></Svg>
)
export const LoginIcon = (p: IconProps) => (
  <Svg {...p}><path d="M10 4H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M14 8l4 4-4 4M18 12H8" /></Svg>
)
export const SearchOffIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2M8.5 8.5l5 5M13.5 8.5l-5 5" /></Svg>
)
export const HeartIcon = ({ filled, ...p }: IconProps & { filled?: boolean }) => (
  <Svg {...p} fill={filled ? 'currentColor' : 'none'}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.600-7 10-7 10z" /></Svg>
)
export const StarIcon = ({ filled, ...p }: IconProps & { filled?: boolean }) => (
  <Svg {...p} fill={filled ? 'currentColor' : 'none'}><path d="m12 3.500 2.600 5.400 5.900.8-4.300 4.100 1 5.800L12 16.800 6.800 19.600l1-5.800L3.500 9.700l5.900-.8z" /></Svg>
)
