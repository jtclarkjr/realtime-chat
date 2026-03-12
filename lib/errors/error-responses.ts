import { NextResponse } from 'next/server'
import { ERROR_DEFINITIONS, ErrorCode } from './error-definitions'

/**
 * Error response structure
 */
export interface ErrorResponse {
  error: string
  code: string
  details?: unknown
}

/**
 * Creates a standardized error response
 *
 * @param errorCode - The error code from ERROR_DEFINITIONS
 * @param details - Optional additional error details
 * @returns NextResponse with standardized error structure
 */
export function errorResponse(
  errorCode: ErrorCode,
  details?: unknown
): NextResponse<ErrorResponse> {
  const errorDef = ERROR_DEFINITIONS[errorCode]

  const body: ErrorResponse = {
    error: errorDef.message,
    code: errorDef.code
  }

  if (details !== undefined) {
    body.details = details
  }

  return NextResponse.json(body, { status: errorDef.statusCode })
}

/**
 * Creates a standardized error response as a plain Response object
 * Useful for streaming endpoints that need direct Response objects
 *
 * @param errorCode - The error code from ERROR_DEFINITIONS
 * @param details - Optional additional error details
 * @returns Response with standardized error structure
 */
export function plainErrorResponse(
  errorCode: ErrorCode,
  details?: unknown
): Response {
  const errorDef = ERROR_DEFINITIONS[errorCode]

  const body: ErrorResponse = {
    error: errorDef.message,
    code: errorDef.code
  }

  if (details !== undefined) {
    body.details = details
  }

  return new Response(JSON.stringify(body), {
    status: errorDef.statusCode,
    headers: { 'Content-Type': 'application/json' }
  })
}

/**
 * Creates a custom error response with a specific message
 * Use this for dynamic error messages that aren't predefined
 *
 * @param message - Custom error message
 * @param statusCode - HTTP status code
 * @param code - Optional error code
 * @param details - Optional additional error details
 * @returns NextResponse with error structure
 */
export function customErrorResponse(
  message: string,
  statusCode: number,
  code?: string,
  details?: unknown
): NextResponse<ErrorResponse> {
  const body: ErrorResponse = {
    error: message,
    code: code || 'CUSTOM_ERROR'
  }

  if (details !== undefined) {
    body.details = details
  }

  return NextResponse.json(body, { status: statusCode })
}

/**
 * Formats an SSE (Server-Sent Events) error message
 * Used in streaming endpoints
 *
 * @param errorCode - The error code from ERROR_DEFINITIONS
 * @returns Formatted SSE error string
 */
export function formatSSEError(errorCode: ErrorCode): string {
  const errorDef = ERROR_DEFINITIONS[errorCode]
  const errorData = {
    type: 'error',
    error: errorDef.message,
    code: errorDef.code
  }
  return `data: ${JSON.stringify(errorData)}\n\n`
}
