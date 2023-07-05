import type { Request } from 'express'

const IPV4_WITH_PORT_REGEX = /^([12]?\d{1,2}\.){3}[12]?\d{1,2}(:\d{1,5})?$/

export const isIP4AddressWithPort = (ipAddress: string): boolean => {
  return IPV4_WITH_PORT_REGEX.test(ipAddress)
}

const IPV6 = /^([\d:a-f]+:+)+[\da-f]+$/

export const isIP6Address = (ipAddress: string): boolean => {
  return ipAddress.length <= 39 && IPV6.test(ipAddress)
}

export const getIP = (request: Partial<Request>): string => {
  return request.ip ?? ''
}

export const getXForwardedFor = (request: Partial<Request>): string => {
  const ipAddresses = request.headers?.['x-forwarded-for'] ?? ''

  // Search for an IP address

  const ipAddressesSplit =
    typeof ipAddresses === 'string'
      ? ipAddresses.split(/[ ,[\]]/g)
      : ipAddresses

  for (const ipPiece of ipAddressesSplit) {
    if (isIP4AddressWithPort(ipPiece)) {
      // Strip off possible port
      return ipPiece.split(':')[0]
    } else if (isIP6Address(ipPiece)) {
      return ipPiece
    }
  }

  return ipAddresses.toString()
}
