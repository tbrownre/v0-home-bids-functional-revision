import { redirect } from 'next/navigation'

export default function UpgradePage() {
  redirect('/subscribe?type=contractor')
}
