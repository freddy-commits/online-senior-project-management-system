import LandingContent from '@/components/layout/LandingContent'
import { redirect } from 'next/navigation'

export default async function LandingPage(props: any) {
  // Support both Next.js 14 and Next.js 15 searchParams resolution
  const resolvedParams = await (props.searchParams instanceof Promise ? props.searchParams : Promise.resolve(props.searchParams))
  const code = resolvedParams?.code as string | undefined

  if (code) {
    redirect(`/api/auth/callback?code=${code}`)
  }

  return <LandingContent />
}
