import type { EntityStatus, ID, ISODate } from './common.types'

/* ------------------------------------------------------------------ */
/*  Domain models — the shared vocabulary of the Julio marketplace.    */
/*  Buyer ↔ Seller is a *mode* of a single User. A user opens a Store  */
/*  (product OR service based) backed by an active paid Subscription.  */
/*  There is no cart/checkout — deals happen inside Conversations.     */
/* ------------------------------------------------------------------ */

export type StoreType = 'product' | 'service'

export interface User {
  id: ID
  name: string
  email: string
  phone?: string
  avatarUrl?: string
  status: EntityStatus
  /** Convenience flag — true when the user owns a store (i.e. is a seller). */
  hasStore: boolean
  /** Name of the store this user owns (sellers only). */
  storeName?: string
  /** Id of the store this user owns (sellers only). */
  storeId?: ID
  /** Populated when status is `suspended` via a ban action. */
  banReason?: string
  createdAt: ISODate
  lastActiveAt: ISODate
  role?: string
  verified?: boolean
  subscriptionStatus?: string
  store?: any
}

export interface Store {
  id: ID
  name: string
  type: StoreType
  ownerId: ID
  ownerName: string
  logoUrl?: string
  coverImageUrl?: string
  category: string
  status: EntityStatus
  /** Current subscription id, if the store has one. */
  subscriptionId?: ID
  planName?: string
  listingCount: number
  rating: number
  createdAt: ISODate
  description?: string
  phone?: string
  whatsapp?: string
  email?: string
  streetAddress?: string
  city?: string
  postalCode?: string
  businessLicenseNumber?: string
  tinNumber?: string
  tradeLicenseUrl?: string
  documentFrontUrl?: string
  documentBackUrl?: string
  documentType?: string
  isVerified?: boolean
  ratingCount?: number
  visitorCount?: number
  owner?: any
}

export interface StoreDetailData {
  store: Store
  products: Product[]
  services: Service[]
}

export interface Product {
  id: ID
  title: string
  storeId: ID
  storeName: string
  category: string
  price: number
  currency: string
  stock: number
  status: EntityStatus
  imageUrl?: string
  createdAt: ISODate
}

export interface Service {
  id: ID
  title: string
  storeId: ID
  storeName: string
  category: string
  /** Services are priced per unit of work (hour, project, visit…). */
  price: number
  currency: string
  pricingUnit: 'hour' | 'project' | 'visit' | 'day'
  status: EntityStatus
  imageUrl?: string
  createdAt: ISODate
}

export type BillingInterval = 'monthly' | 'yearly' | string

export interface Plan {
  id: ID
  _id?: ID
  name: string
  description?: string
  price: number
  currency: string
  interval?: BillingInterval
  billingCycle?: BillingInterval
  duration?: string
  status?: string
  packageType?: string
  /** Which store types may subscribe to this plan. */
  appliesTo?: StoreType[]
  /** Max listings allowed under the plan (null = unlimited). */
  listingLimit: number | null
  isUnlimitedListings?: boolean
  trialEnabled?: boolean
  trialPeriodDays?: number
  stripeProductId?: string
  stripePriceId?: string
  features: string[]
  isActive: boolean
  popular?: boolean
  createdAt?: ISODate
  updatedAt?: ISODate
}

export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired'

export interface SubscriptionPackage {
  _id: ID
  name: string
  price: number
  duration: string
  status?: string
  packageType?: string
  listingLimit?: number
  isUnlimitedListings?: boolean
  trialEnabled?: boolean
  trialPeriodDays?: number
  stripeProductId?: string
  stripePriceId?: string
  features?: string[]
  isDeleted?: boolean
  createdAt?: ISODate
  updatedAt?: ISODate
}

export interface SubscriptionUser {
  _id: ID
  name: string
  email: string
  profileImage?: string
  phone?: string
}

export interface SubscriptionStore {
  _id: ID
  name?: string
  owner?: string
  storeType?: string
  displayName?: string
  description?: string
  categoryId?: {
    _id: string
    name: string
  } | string
  logo?: string
  coverImage?: string
  phone?: string
  whatsapp?: string
  email?: string
  streetAddress?: string
  city?: string
  postalCode?: string
  latitude?: number
  longitude?: number
  businessLicenseNumber?: string
  tradeLicense?: string
  tinNumber?: string
  status?: string
  isDeleted?: boolean
  createdAt?: ISODate
  updatedAt?: ISODate
  documentBack?: string
  documentFront?: string
  documentType?: string
  isVerified?: boolean
  averageRating?: number
  ratingCount?: number
  visitorCount?: number
}

export interface Subscription {
  id: ID
  _id?: ID
  storeId?: ID
  storeName?: string
  ownerName?: string
  ownerEmail?: string
  storeType?: StoreType
  planId?: ID
  planName?: string
  amount: number
  amountPaid?: number
  currency: string
  interval?: BillingInterval
  billingCycle?: BillingInterval
  status: SubscriptionStatus | string
  currentPeriodStart?: ISODate
  currentPeriodEnd?: ISODate
  startDate?: ISODate
  expiresAt?: ISODate
  createdAt?: ISODate
  updatedAt?: ISODate
  stripeSubscriptionId?: string
  stripeSessionId?: string
  trxId?: string
  packageType?: string
  user?: SubscriptionUser
  userId?: SubscriptionUser
  store?: SubscriptionStore
  package?: SubscriptionPackage
  packageId?: SubscriptionPackage
}

export interface Category {
  id: ID
  _id?: string
  name: string
  description?: string
  type: StoreType
  status?: string
  isDeleted?: boolean
  listingCount: number
  isActive: boolean
  createdAt?: ISODate
  updatedAt?: ISODate
}

/* --------------------------- Dashboard ---------------------------- */

export interface DashboardCards {
  totalUsers: number
  totalStores: number
  activeSubscriptions: number
  mrr: number
}

export interface StoreTypesSplit {
  productStoresCount: number
  serviceStoresCount: number
  productPercentage: number
  servicePercentage: number
}

export interface RevenueChartPoint {
  month: string
  revenue: number
}

export interface DashboardOverviewData {
  cards: DashboardCards
  storeTypesSplit: StoreTypesSplit
  revenueChart: RevenueChartPoint[]
}

export interface DashboardOverviewResponse {
  success: boolean
  message: string
  data: DashboardOverviewData
}

export interface DashboardStats {
  totalUsers: number
  totalStores: number
  activeSubscriptions: number
  mrr: number // monthly recurring revenue
  deltas?: {
    users: number
    stores: number
    subscriptions: number
    mrr: number
  }
}

export interface TimeSeriesPoint {
  label: string
  revenue: number
  signups?: number
}

export interface StoreTypeBreakdown {
  type: StoreType
  count: number
}

/* --------------------------- Moderation --------------------------- */

export type ReportTargetType = 'user' | 'store' | 'product' | 'service'
export type ReportStatus = 'open' | 'resolved' | 'dismissed'
export type ReportSeverity = 'low' | 'medium' | 'high'

export interface Report {
  id: ID
  targetType: ReportTargetType
  targetName: string
  reporterName: string
  reason: string
  severity: ReportSeverity
  status: ReportStatus
  createdAt: ISODate
  resolvedAt?: ISODate
}

/* ------------------------ Admins & Access ------------------------- */

export type AdminRole = 'super_admin' | 'admin' | 'moderator' | 'support'

export interface Admin {
  id: ID
  _id?: ID
  name: string
  email: string
  role: AdminRole | string
  status: 'active' | 'suspended' | string
  profileImage?: string
  lastActiveAt?: ISODate
  createdAt?: ISODate
  updatedAt?: ISODate
}

/* ------------------------------ CMS ------------------------------- */

export type BannerPlacement = 'home_top' | 'explore' | 'product_store' | 'service_store'

export interface Banner {
  id: ID
  _id?: ID
  title: string
  name?: string
  description?: string
  imageUrl?: string
  image?: string
  placement?: BannerPlacement
  isActive: boolean
  status?: string
  isDeleted?: boolean
  startsAt?: ISODate
  endsAt?: ISODate
  createdAt?: ISODate
  updatedAt?: ISODate
}

export type ContentStatus = 'published' | 'draft'

/** Maps to the mobile app's "Other Pages" (Terms, Privacy, About…). */
export interface ContentPage {
  id: ID
  _id?: ID
  type?: string
  title: string
  status: ContentStatus
  /** Rich HTML body shown in the app. */
  content: string
  updatedAt: ISODate
}

export interface Faq {
  id: ID
  _id?: ID
  question: string
  answer: string
  category?: string
  order?: number
  isPublished?: boolean
  isDeleted?: boolean
  createdAt?: ISODate
  updatedAt?: ISODate
}

/* ---------------------------- Billing ----------------------------- */

export type TransactionStatus = 'paid' | 'failed' | 'refunded' | 'pending'

export interface Transaction {
  id: ID
  storeName?: string
  planName?: string
  amount: number
  currency: string
  status: TransactionStatus
  method: 'card' | 'mobile_banking' | 'wallet'
  invoiceNo: string
  createdAt: ISODate
}

/* --------------------------- Engagement --------------------------- */

export type AnnouncementAudience =
  | 'everyone'
  | 'buyers'
  | 'all_sellers'
  | 'product_sellers'
  | 'service_sellers'
  | 'all'
  | 'sellers'

export type AnnouncementStatus = 'sent' | 'scheduled' | 'draft' | string

export interface AnnouncementCreatedBy {
  _id: ID
  name: string
  role?: string
  activeRole?: string
  email?: string
  profileImage?: string
  gender?: string
  status?: string
  phone?: string
  countryCode?: string
  verified?: boolean
  createdAt?: ISODate
  updatedAt?: ISODate
}

export interface Announcement {
  id: ID
  _id?: ID
  title: string
  message?: string
  body?: string
  audience: AnnouncementAudience
  channel?: 'push_notification' | 'push' | 'email' | 'in_app' | string
  status: AnnouncementStatus
  recipients?: number
  createdBy?: AnnouncementCreatedBy | string
  isDeleted?: boolean
  sentAt?: ISODate
  createdAt: ISODate
  updatedAt?: ISODate
}

/* -------------------------- Support & Chat ------------------------------- */

export type SupportStatus = 'open' | 'pending' | 'resolved'
export type SupportSender = 'customer' | 'agent'

export interface ChatParticipant {
  _id: string
  name: string
  role?: string
  activeRole?: string
  email?: string
  profileImage?: string
}

export interface ChatLastMessage {
  _id: string
  chatId: string
  sender: string | ChatParticipant
  text: string
  image?: string
  read?: boolean
  type?: string
  createdAt?: ISODate
  updatedAt?: ISODate
}

export interface Chat {
  id: ID
  _id: ID
  participants: ChatParticipant[]
  lastMessage?: ChatLastMessage | null
  communicationType?: string
  status?: string
  createdAt?: ISODate
  updatedAt?: ISODate
  isRead?: boolean
  unreadCount?: number
}

export interface ChatMessage {
  id: ID
  _id: ID
  chatId: ID
  sender: ChatParticipant | string
  text: string
  image?: string
  read?: boolean
  type?: string
  createdAt: ISODate
  updatedAt?: ISODate
}

export interface SupportMessage {
  id: ID
  ticketId: ID
  sender: SupportSender
  body: string
  sentAt: ISODate
}

/** A customer support conversation shown in the admin inbox. */
export interface SupportTicket {
  id: ID
  customerName: string
  customerEmail: string
  subject: string
  status: SupportStatus
  lastMessage: string
  lastMessageAt: ISODate
  /** Unread inbound (customer) messages awaiting an agent reply. */
  unread: number
  messageCount: number
  createdAt: ISODate
}

/* ----------------------------- Audit ------------------------------ */

export interface AuditLog {
  id: ID
  actorName: string
  action: string
  targetType: string
  targetName: string
  createdAt: ISODate
}
