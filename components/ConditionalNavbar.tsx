'use client'

import { usePathname } from 'next/navigation'
import Navbar from './Navbar'

// Routes where navbar should be hidden
const HIDDEN_NAVBAR_ROUTES = ['/gate', '/login']

export default function ConditionalNavbar() {
  const pathname = usePathname()
  
  // Hide navbar on specified routes
  if (HIDDEN_NAVBAR_ROUTES.some(route => pathname.startsWith(route))) {
    return null
  }
  
  return <Navbar />
}
