import { cn, colorFromString, getInitials } from '@/lib/utils'
import { imageUrl } from '@/components/shared/getImageUrl'

interface AvatarProps {
  name: string
  src?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-12 w-12 text-base' }

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const fullSrc = imageUrl(src)
  if (fullSrc) {
    return (
      <img
        src={fullSrc}
        alt={name}
        className={cn('rounded-full object-cover', sizes[size], className)}
      />
    )
  }
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white',
        sizes[size],
        className,
      )}
      style={{ backgroundColor: colorFromString(name) }}
    >
      {getInitials(name)}
    </span>
  )
}
