import { SignUp } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cyber-dark via-black to-cyber-dark">
      <SignUp />
    </div>
  )
}
