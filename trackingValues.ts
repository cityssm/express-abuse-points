import type { Request } from 'express'
import { isIPv6 } from 'is-ip'

const IPV4_WITH_PORT_REGEX = /^(?:[12]?\d{1,2}\.){3}[12]?\d{1,2}(?::\d{1,5})?$/

export const isIP4AddressWithPort = (ipAddress: string): boolean => {
  return IPV4_WITH_PORT_REGEX.test(ipAddress)
}

export const getIP = (request: Partial<Request>): string => {
  return request.ip ?? ''
}

export const getXForwardedFor = (request: Partial<Request>): string => {
  const ipAddresses = request.headers?.['x-forwarded-for'] ?? ''

  // Search for an IP address

  const ipAddressesSplit =
    typeof ipAddresses === 'string' ? ipAddresses.split(/[ ,[\]]/) : ipAddresses

  for (const ipPiece of ipAddressesSplit) {
    if (isIP4AddressWithPort(ipPiece)) {
      // Strip off possible port
      return ipPiece.split(':')[0]
    } else if (isIPv6(ipPiece)) {
      return ipPiece
    }
  }

  return ipAddresses.toString()
}
