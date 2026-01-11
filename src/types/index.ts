import { User, Collection, Submission, Vote, Winner } from '@prisma/client'

export type Phase = 'submission' | 'voting' | 'display'

export interface PhaseInfo {
  phase: Phase
  phaseLabel: string
  monthYear: string
  monthLabel: string
  startTime: Date
  endTime: Date
  timeRemaining: number
  isOverridden: boolean
}

export interface CollectionWithVotes extends Collection {
  votes: Vote[]
  voteCount: number
  hasVoted?: boolean
  submission?: Submission
}

export interface CollectionMetadata {
  contractAddress: string
  name: string
  imageUrl: string | null
  description: string | null
  twitterUrl: string | null
  tradeportUrl: string
  floorPrice: number | null
  volume: number | null
}

export interface UserWithRoles extends User {
  hasRequiredRole: boolean
}

export interface VoteUpdate {
  collectionId: string
  voteCount: number
  monthYear: string
}

export interface AdminStats {
  totalUsers: number
  totalSubmissions: number
  totalVotes: number
  currentMonthSubmissions: number
  currentMonthVotes: number
}

export interface ExportData {
  winners: (Winner & { collection: Collection })[]
  votes: (Vote & { user: User; collection: Collection })[]
  loginRecords: {
    id: string
    discordId: string
    username: string
    timestamp: Date
    ipAddress: string | null
  }[]
}

export type ClearTarget = 'all' | 'submissions' | 'votes' | 'winners' | 'login-records'

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// Discord types
export interface DiscordGuildMember {
  roles: string[]
  user: {
    id: string
    username: string
    discriminator: string
    avatar: string | null
  }
}

// Tradeport API types
export interface TradeportCollection {
  contract_address: string
  name: string
  image_url?: string
  description?: string
  twitter_url?: string
  floor_price?: number
  total_volume?: number
}
