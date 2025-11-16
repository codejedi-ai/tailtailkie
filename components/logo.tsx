import Image from 'next/image'

interface LogoProps {
  className?: string
  size?: number
}

export function Logo({ className, size = 40 }: LogoProps) {
  return (
    <div className={`${className} pixel-art-logo`} style={{ width: size, height: size }}>
      <Image
        src="/favicon.png"
        alt="TensorStore Logo"
        width={size}
        height={size}
        className="pixelated"
        style={{
          imageRendering: 'pixelated',
          imageRendering: 'crisp-edges',
        }}
        priority
      />
    </div>
  )
}
