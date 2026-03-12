import { z } from 'zod'
import { byteLength } from './helpers'

// UUID validation
const uuidSchema = z.uuid('Invalid UUID format')

// Common validations
const nonEmptyString = z.string().min(1, 'Cannot be empty')

// For strings that need validation before transformation
const validatedTrimmedString = (min: number, max: number, label: string) =>
  z
    .string()
    .transform((val) => val.trim().normalize('NFC'))
    .pipe(
      z
        .string()
        .min(min, `${label} must be at least ${min} characters`)
        .max(max, `${label} must be ${max} characters or less`)
    )

// Byte length validation helper

/**
 * Message Schemas
 *
 * Note: Limits are based on character count after Unicode normalization (NFC).
 * Byte limits are enforced separately at middleware level.
 */

export const sendMessageSchema = z
  .object({
    roomId: uuidSchema,
    userId: uuidSchema,
    username: validatedTrimmedString(1, 50, 'Username'),
    // Content is trimmed and normalized before validation
    // 5000 characters = ~20KB in bytes (accounting for multi-byte unicode)
    content: validatedTrimmedString(1, 5000, 'Message').refine(
      (val) => byteLength(val) <= 20480,
      {
        message: 'Message exceeds maximum size of 20KB'
      }
    ),
    isPrivate: z.boolean().optional(),
    requesterId: uuidSchema.optional(),
    optimisticId: uuidSchema.optional()
  })
  .strict() // Reject unknown fields

export const unsendMessageSchema = z
  .object({
    messageId: nonEmptyString,
    userId: uuidSchema,
    roomId: uuidSchema
  })
  .strict()

export const markReceivedSchema = z
  .object({
    userId: uuidSchema,
    roomId: uuidSchema,
    messageId: nonEmptyString
  })
  .strict()

/**
 * Room Schemas
 *
 * Names and descriptions are trimmed and normalized before validation.
 */

export const createRoomSchema = z
  .object({
    name: validatedTrimmedString(1, 100, 'Room name').refine(
      (val) => byteLength(val) <= 400,
      {
        message: 'Room name exceeds maximum size of 400 bytes'
      }
    ),
    description: validatedTrimmedString(0, 500, 'Description')
      .refine((val) => byteLength(val) <= 2048, {
        message: 'Description exceeds maximum size of 2KB'
      })
      .optional()
      .nullable()
  })
  .strict()

const visibilitySchema = z.enum(['public', 'private'])
const baseStyleToneSchema = z.enum([
  'default',
  'professional',
  'friendly',
  'candid',
  'quirky',
  'efficient',
  'nerdy',
  'cynical'
])
const responseDetailModeSchema = z.enum([
  'default',
  'short',
  'detailed',
  'structured'
])
const traitLevelSchema = z.enum(['default', 'subtle', 'strong'])

export const createGroupSchema = z
  .object({
    name: validatedTrimmedString(2, 80, 'Group name').refine(
      (val) => byteLength(val) <= 320,
      {
        message: 'Group name exceeds maximum size of 320 bytes'
      }
    ),
    description: validatedTrimmedString(0, 500, 'Description')
      .refine((val) => byteLength(val) <= 2048, {
        message: 'Description exceeds maximum size of 2KB'
      })
      .optional()
      .nullable(),
    visibility: visibilitySchema.default('public'),
    memberUserIds: z.array(uuidSchema).max(100).optional()
  })
  .strict()

export const createChannelSchema = z
  .object({
    name: validatedTrimmedString(2, 80, 'Channel name').refine(
      (val) => byteLength(val) <= 320,
      {
        message: 'Channel name exceeds maximum size of 320 bytes'
      }
    ),
    description: validatedTrimmedString(0, 500, 'Description')
      .refine((val) => byteLength(val) <= 2048, {
        message: 'Description exceeds maximum size of 2KB'
      })
      .optional()
      .nullable(),
    visibility: visibilitySchema.default('public')
  })
  .strict()

export const listUsersQuerySchema = z
  .object({
    q: z.string().trim().max(100).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional()
  })
  .strict()

export const memberUserIdsSchema = z
  .object({
    userIds: z.array(uuidSchema).min(1).max(100)
  })
  .strict()

export const updateGroupMemberSchema = z
  .object({
    canRead: z.boolean(),
    canWrite: z.boolean(),
    canAdmin: z.boolean()
  })
  .strict()

export const personalChatsQuerySchema = z
  .object({
    q: z.string().trim().max(100).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    offset: z.coerce.number().int().min(0).optional()
  })
  .strict()

export const startPersonalChatSchema = z
  .object({
    userId: uuidSchema,
    username: validatedTrimmedString(1, 50, 'Username'),
    avatarUrl: z.string().trim().url().optional(),
    content: validatedTrimmedString(1, 5000, 'Message').refine(
      (val) => byteLength(val) <= 20480,
      {
        message: 'Message exceeds maximum size of 20KB'
      }
    ),
    aiEnabled: z.boolean().optional(),
    aiModel: z.string().trim().max(120).optional(),
    deferAiResponse: z.boolean().optional(),
    name: validatedTrimmedString(1, 80, 'Chat name')
      .refine((val) => byteLength(val) <= 320, {
        message: 'Chat name exceeds maximum size of 320 bytes'
      })
      .optional()
  })
  .strict()

export const updatePersonalChatSchema = z
  .object({
    name: validatedTrimmedString(1, 80, 'Chat name')
      .refine((val) => byteLength(val) <= 320, {
        message: 'Chat name exceeds maximum size of 320 bytes'
      })
      .optional(),
    aiEnabled: z.boolean().optional(),
    aiModel: z.string().trim().max(120).nullable().optional()
  })
  .strict()

export const updateAIPersonalizationSchema = z
  .object({
    baseStyleTone: baseStyleToneSchema,
    responseDetailMode: responseDetailModeSchema,
    characteristics: z
      .object({
        warm: traitLevelSchema,
        enthusiastic: traitLevelSchema,
        headersAndLists: traitLevelSchema,
        emoji: traitLevelSchema
      })
      .strict(),
    customInstructions: validatedTrimmedString(0, 1000, 'Custom instructions'),
    aboutYou: validatedTrimmedString(0, 1000, 'About you')
  })
  .strict()

export const roomNameSchema = z
  .string()
  .transform((val) => val.trim().normalize('NFC'))
  .pipe(
    z
      .string()
      .min(1, 'Room name is required')
      .min(2, 'Room name must be at least 2 characters')
      .max(50, 'Room name must be less than 50 characters')
  )

export const deleteRoomSchema = z
  .object({
    id: uuidSchema
  })
  .strict()

export const deleteRoomQuerySchema = z
  .object({
    id: uuidSchema
  })
  .strict()

/**
 * AI Request Schemas
 *
 * Streaming endpoint validation - validates metadata before processing stream.
 */

export const aiMessageSchema = z
  .object({
    content: nonEmptyString,
    isAi: z.boolean(),
    userName: nonEmptyString
  })
  .strict()

export const aiStreamRequestSchema = z
  .object({
    roomId: uuidSchema,
    userId: uuidSchema,
    message: validatedTrimmedString(1, 5000, 'Message').refine(
      (val) => byteLength(val) <= 20480,
      {
        message: 'Message exceeds maximum size of 20KB'
      }
    ),
    isPrivate: z.boolean().optional(),
    responseFormat: z.enum(['plain', 'markdown']).optional(),
    triggerMessageId: nonEmptyString.optional(),
    fileContextId: uuidSchema.optional(),
    targetMessageId: nonEmptyString.optional(),
    targetMessageContent: validatedTrimmedString(
      1,
      5000,
      'Target message content'
    )
      .refine((val) => byteLength(val) <= 20480, {
        message: 'Target message exceeds maximum size of 20KB'
      })
      .optional(),
    customPrompt: validatedTrimmedString(1, 1000, 'Custom prompt')
      .refine((val) => byteLength(val) <= 4096, {
        message: 'Custom prompt exceeds maximum size of 4KB'
      })
      .optional(),
    draftOnly: z.boolean().optional(),
    // Limit previous messages array to prevent excessive payload
    previousMessages: z
      .array(aiMessageSchema)
      .max(50, 'Too many previous messages')
      .optional()
  })
  .strict()

/**
 * Query Parameter Schemas
 */

export const roomIdParamSchema = z
  .object({
    roomId: uuidSchema
  })
  .strict()

export const rejoinRoomSchema = z
  .object({
    userId: uuidSchema
  })
  .strict()

// Type exports for use in API routes
export type SendMessageInput = z.infer<typeof sendMessageSchema>
export type UnsendMessageInput = z.infer<typeof unsendMessageSchema>
export type MarkReceivedInput = z.infer<typeof markReceivedSchema>
export type CreateRoomInput = z.infer<typeof createRoomSchema>
export type CreateGroupInput = z.infer<typeof createGroupSchema>
export type CreateChannelInput = z.infer<typeof createChannelSchema>
export type DeleteRoomInput = z.infer<typeof deleteRoomSchema>
export type AIStreamRequestInput = z.infer<typeof aiStreamRequestSchema>
export type RoomIdParamInput = z.infer<typeof roomIdParamSchema>
export type RejoinRoomInput = z.infer<typeof rejoinRoomSchema>
export type MemberUserIdsInput = z.infer<typeof memberUserIdsSchema>
export type UpdateGroupMemberInput = z.infer<typeof updateGroupMemberSchema>
export type StartPersonalChatInput = z.infer<typeof startPersonalChatSchema>
export type UpdatePersonalChatInput = z.infer<typeof updatePersonalChatSchema>
