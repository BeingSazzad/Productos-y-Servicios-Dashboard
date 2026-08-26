import type {
  Admin,
  Announcement,
  AuditLog,
  Banner,
  Category,
  ContentPage,
  Faq,
  Plan,
  Product,
  Report,
  Service,
  Store,
  Subscription,
  SubscriptionStatus,
  SupportMessage,
  SupportSender,
  SupportStatus,
  SupportTicket,
  Transaction,
  TransactionStatus,
  User,
} from '@/types/models'

/* Deterministic-ish seed data. The clock is anchored to "now" so relative
   timestamps ("3 days ago") always read as the past, never the future. */

const NOW = Date.now()
const daysAgo = (n: number) => new Date(NOW - n * 86_400_000).toISOString()

const FIRST = ['Aisha', 'Rahim', 'Nadia', 'Tanvir', 'Sadia', 'Imran', 'Farhana', 'Jamal', 'Mitu', 'Karim', 'Lamia', 'Sohel']
const LAST = ['Khan', 'Ahmed', 'Hossain', 'Islam', 'Rahman', 'Akter', 'Chowdhury', 'Sarkar']

const productCats = ['Electronics', 'Fashion', 'Home & Living', 'Groceries', 'Beauty', 'Books']
const serviceCats = ['Cleaning', 'Repair', 'Tutoring', 'Beauty & Spa', 'Photography', 'Catering']

const name = (i: number) => `${FIRST[i % FIRST.length]} ${LAST[i % LAST.length]}`

export const users: User[] = Array.from({ length: 48 }, (_, i) => {
  const hasStore = i % 3 === 0
  return {
    id: `usr_${1000 + i}`,
    name: name(i),
    email: `${FIRST[i % FIRST.length].toLowerCase()}.${i}@example.com`,
    phone: `+8801${(700000000 + i * 137).toString().slice(0, 9)}`,
    status: i % 11 === 0 ? 'suspended' : i % 7 === 0 ? 'pending' : 'active',
    hasStore,
    createdAt: daysAgo(i * 3 + 2),
    lastActiveAt: daysAgo(i % 9),
  }
})

const sellers = users.filter((u) => u.hasStore)

export const stores: Store[] = sellers.map((owner, i) => {
  const type = i % 2 === 0 ? 'product' : 'service'
  const cat = type === 'product' ? productCats[i % productCats.length] : serviceCats[i % serviceCats.length]
  return {
    id: `str_${2000 + i}`,
    name: `${owner.name.split(' ')[0]}'s ${type === 'product' ? 'Mart' : 'Services'}`,
    type,
    ownerId: owner.id,
    ownerName: owner.name,
    category: cat,
    // A banned owner's store can't be live; otherwise it follows its own cycle.
    status: owner.status === 'suspended' ? 'suspended' : i % 9 === 0 ? 'pending' : i % 13 === 0 ? 'suspended' : 'active',
    subscriptionId: `sub_${4000 + i}`,
    planName: ['Starter', 'Growth', 'Pro'][i % 3],
    listingCount: 4 + (i % 12),
    rating: Number((3.6 + (i % 14) / 10).toFixed(1)),
    createdAt: daysAgo(i * 5 + 1),
  }
})

// Link each seller back to their store so the Users table can show the store name.
stores.forEach((store) => {
  const owner = users.find((u) => u.id === store.ownerId)
  if (owner) {
    owner.storeName = store.name
    owner.storeId = store.id
  }
})

const productStores = stores.filter((s) => s.type === 'product')
const serviceStores = stores.filter((s) => s.type === 'service')

export const products: Product[] = Array.from({ length: 60 }, (_, i) => {
  const store = productStores[i % productStores.length]
  return {
    id: `prd_${3000 + i}`,
    title: `${productCats[i % productCats.length]} Item ${i + 1}`,
    storeId: store.id,
    storeName: store.name,
    category: productCats[i % productCats.length],
    price: 5 + (i % 20) * 7,
    currency: 'USD',
    stock: (i * 3) % 50,
    // A listing can't be live before its store is — mirror the store status.
    status: store.status,
    createdAt: daysAgo(i * 2),
  }
})

const units = ['hour', 'project', 'visit', 'day'] as const
export const services: Service[] = Array.from({ length: 40 }, (_, i) => {
  const store = serviceStores[i % serviceStores.length]
  return {
    id: `svc_${3500 + i}`,
    title: `${serviceCats[i % serviceCats.length]} Service ${i + 1}`,
    storeId: store.id,
    storeName: store.name,
    category: serviceCats[i % serviceCats.length],
    price: 15 + (i % 10) * 12,
    currency: 'USD',
    pricingUnit: units[i % units.length],
    // Mirror the owning store's status.
    status: store.status,
    createdAt: daysAgo(i * 2 + 1),
  }
})

// Keep store-level facts consistent with the actual listings/reviews.
stores.forEach((store) => {
  store.listingCount =
    store.type === 'product'
      ? products.filter((p) => p.storeId === store.id).length
      : services.filter((s) => s.storeId === store.id).length
  // A store that isn't live yet hasn't earned a rating.
  if (store.status !== 'active') store.rating = 0
})

export const plans: Plan[] = [
  {
    id: 'pln_1',
    name: 'Starter',
    price: 9,
    currency: 'USD',
    interval: 'monthly',
    appliesTo: ['product', 'service'],
    listingLimit: 10,
    features: ['Up to 10 listings', 'Basic store profile', 'In-app messaging'],
    isActive: true,
  },
  {
    id: 'pln_2',
    name: 'Growth',
    price: 29,
    currency: 'USD',
    interval: 'monthly',
    appliesTo: ['product', 'service'],
    listingLimit: 50,
    features: ['Up to 50 listings', 'Featured in Explore', 'Analytics dashboard', 'Priority support'],
    isActive: true,
    popular: true,
  },
  {
    id: 'pln_3',
    name: 'Pro',
    price: 79,
    currency: 'USD',
    interval: 'monthly',
    appliesTo: ['product', 'service'],
    listingLimit: null,
    features: ['Unlimited listings', 'Top placement', 'Verified badge', 'Dedicated manager'],
    isActive: true,
  },
]

// A subscription's state follows its store: pending stores are on trial,
// suspended stores have lapsed billing, live stores are paying (mostly).
const subStatusForStore = (store: Store, i: number): SubscriptionStatus => {
  if (store.status === 'pending') return 'trialing'
  if (store.status === 'suspended') return i % 2 === 0 ? 'past_due' : 'canceled'
  return i % 7 === 0 ? 'trialing' : i % 11 === 0 ? 'past_due' : 'active'
}
export const subscriptions: Subscription[] = stores.map((store, i) => {
  const plan = plans[i % plans.length]
  return {
    id: store.subscriptionId!,
    storeId: store.id,
    storeName: store.name,
    ownerName: store.ownerName,
    storeType: store.type,
    planId: plan.id,
    planName: plan.name,
    amount: plan.price,
    currency: plan.currency,
    interval: plan.interval,
    status: subStatusForStore(store, i),
    currentPeriodStart: daysAgo(15 + (i % 15)),
    currentPeriodEnd: daysAgo(15 + (i % 15) - 30),
    createdAt: store.createdAt,
  }
})

export const categories: Category[] = [
  ...productCats.map((c, i) => ({
    id: `cat_p_${i}`,
    name: c,
    type: 'product' as const,
    listingCount: products.filter((p) => p.category === c).length,
    isActive: true,
  })),
  ...serviceCats.map((c, i) => ({
    id: `cat_s_${i}`,
    name: c,
    type: 'service' as const,
    listingCount: services.filter((s) => s.category === c).length,
    isActive: i !== serviceCats.length - 1,
  })),
]

/* ----------------------------- Reports ---------------------------- */

const reportTargets = ['user', 'store', 'product', 'service'] as const
const reportReasons = [
  'Spam or misleading content',
  'Fraudulent listing',
  'Abusive language',
  'Counterfeit product',
  'No-show / fake service',
  'Inappropriate images',
]
const severities = ['low', 'medium', 'high'] as const
const reportStatuses = ['open', 'open', 'open', 'resolved', 'dismissed'] as const

export const reports: Report[] = Array.from({ length: 22 }, (_, i) => {
  const targetType = reportTargets[i % reportTargets.length]
  const status = reportStatuses[i % reportStatuses.length]
  return {
    id: `rpt_${6000 + i}`,
    targetType,
    targetName:
      targetType === 'user'
        ? users[(i * 3) % users.length].name
        : targetType === 'store'
          ? stores[i % stores.length].name
          : targetType === 'product'
            ? products[i % products.length].title
            : services[i % services.length].title,
    reporterName: users[(i * 7) % users.length].name,
    reason: reportReasons[i % reportReasons.length],
    severity: severities[i % severities.length],
    status,
    createdAt: daysAgo(i % 14),
    resolvedAt: status === 'open' ? undefined : daysAgo((i % 14) - 1),
  }
})

/* ----------------------------- Admins ----------------------------- */

const adminRoles = ['super_admin', 'admin', 'moderator', 'support'] as const
export const admins: Admin[] = [
  { id: 'adm_1', name: 'Julio Admin', email: 'admin@julio.app', role: 'super_admin', status: 'active', lastActiveAt: daysAgo(0), createdAt: daysAgo(200) },
  ...Array.from({ length: 7 }, (_, i) => ({
    id: `adm_${2 + i}`,
    name: name(i + 2),
    email: `${FIRST[(i + 2) % FIRST.length].toLowerCase()}.admin@julio.app`,
    role: adminRoles[(i % 3) + 1],
    status: (i % 6 === 0 ? 'suspended' : 'active') as Admin['status'],
    lastActiveAt: daysAgo(i + 1),
    createdAt: daysAgo(120 - i * 10),
  })),
]

/* ------------------------------ CMS ------------------------------- */

const placements = ['home_top', 'explore', 'product_store', 'service_store'] as const
export const banners: Banner[] = Array.from({ length: 6 }, (_, i) => ({
  id: `bnr_${7000 + i}`,
  title: ['Eid Mega Sale', 'New Sellers Welcome', 'Service Week', 'Free Delivery', 'Ramadan Specials', 'Refer & Earn'][i],
  placement: placements[i % placements.length],
  isActive: i % 4 !== 0,
  startsAt: daysAgo(10 - i),
  endsAt: daysAgo(10 - i - 14),
}))

export const contentPages: ContentPage[] = [
  {
    id: 'pg_1',
    title: 'Terms & Conditions',
    status: 'published',
    content:
      'These Terms & Conditions govern your use of the Productos y Servicios marketplace. By accessing the app you agree to buy and sell in good faith, communicate respectfully, and follow local laws.',
    updatedAt: daysAgo(12),
  },
  {
    id: 'pg_2',
    title: 'Privacy Policy',
    status: 'published',
    content:
      'We collect only the data needed to operate the marketplace: your profile, listings, and conversations. We never sell your personal information to third parties.',
    updatedAt: daysAgo(12),
  },
  {
    id: 'pg_3',
    title: 'About Us',
    status: 'published',
    content:
      'Productos y Servicios connects local buyers with nearby product and service sellers. Our mission is to make local commerce simple, personal, and trusted.',
    updatedAt: daysAgo(40),
  },
  {
    id: 'pg_4',
    title: 'Refund Policy',
    status: 'published',
    content:
      'Deals are arranged directly between buyers and sellers in chat. Subscription fees for opening a store are billed monthly and can be canceled at any time.',
    updatedAt: daysAgo(8),
  },
  {
    id: 'pg_5',
    title: 'Seller Guidelines',
    status: 'draft',
    content:
      'Keep your listings accurate, respond to buyers promptly, and honor the prices you publish. Stores that repeatedly violate these guidelines may be suspended.',
    updatedAt: daysAgo(2),
  },
]

export const faqs: Faq[] = [
  { id: 'faq_1', question: 'How do I open a store?', answer: 'Switch to seller mode and choose a subscription plan.', category: 'Selling', order: 1, isPublished: true },
  { id: 'faq_2', question: 'What is the difference between a product and service store?', answer: 'Product stores sell goods; service stores offer bookable services.', category: 'Selling', order: 2, isPublished: true },
  { id: 'faq_3', question: 'How do payments work?', answer: 'Deals are arranged in chat; subscriptions are billed monthly.', category: 'Payments', order: 3, isPublished: true },
  { id: 'faq_4', question: 'How do I contact a seller?', answer: 'Open any listing and tap Message to start a conversation.', category: 'Buying', order: 4, isPublished: true },
  { id: 'faq_5', question: 'How do I report a listing?', answer: 'Use the report option on the listing or conversation.', category: 'Safety', order: 5, isPublished: false },
]

/* ---------------------------- Billing ----------------------------- */

// The latest invoice reflects the subscription's billing state (a trialing
// store hasn't been charged yet, a past-due one failed, etc.).
const txStatusForSub = (status: SubscriptionStatus | string): TransactionStatus => {
  switch (status) {
    case 'active':
      return 'paid'
    case 'trialing':
      return 'pending'
    case 'past_due':
      return 'failed'
    case 'canceled':
      return 'refunded'
    default:
      return 'paid'
  }
}
const methods = ['card', 'mobile_banking', 'wallet'] as const
export const transactions: Transaction[] = subscriptions.map((sub, i) => ({
  id: `txn_${8000 + i}`,
  storeName: sub.storeName,
  planName: sub.planName,
  amount: sub.amount,
  currency: sub.currency,
  status: txStatusForSub(sub.status),
  method: methods[i % methods.length],
  invoiceNo: `INV-${2026}-${(1000 + i).toString()}`,
  createdAt: daysAgo(i % 20),
}))

/* --------------------------- Engagement --------------------------- */

const audiences = ['all', 'buyers', 'sellers', 'product_sellers', 'service_sellers'] as const
const channels = ['push', 'email', 'in_app'] as const
const annStatuses = ['sent', 'sent', 'scheduled', 'draft'] as const
export const announcements: Announcement[] = Array.from({ length: 8 }, (_, i) => {
  const status = annStatuses[i % annStatuses.length]
  return {
    id: `ann_${9000 + i}`,
    title: ['Welcome to Julio!', 'New service categories live', 'Scheduled maintenance', 'Eid offers for sellers', 'Update your store profile', 'Referral program', 'Policy update', 'Holiday hours'][i],
    body: 'Tap to learn more about this update from the Julio team.',
    audience: audiences[i % audiences.length],
    channel: channels[i % channels.length],
    status,
    recipients: status === 'draft' ? 0 : 1200 + i * 340,
    sentAt: status === 'sent' ? daysAgo(i + 1) : undefined,
    createdAt: daysAgo(i + 1),
  }
})

/* ---------------------------- Support ----------------------------- */

const supportSubjects = [
  'Trouble opening my store',
  'Payment charged twice',
  'How do I upgrade my plan?',
  'Seller not responding',
  'Cannot change my store category',
  'App keeps logging me out',
  'Listing not showing in search',
  'Request a refund',
  'How do I become a seller?',
  'Update my phone number',
]
const customerOpeners = [
  'Hi, I need some help please.',
  'I was charged twice this month — can you check?',
  'How can I upgrade to the Growth plan?',
  'A seller hasn’t replied to me in days.',
  'I can’t change my store category, it’s greyed out.',
  'The app logs me out every few minutes.',
  'My new listing isn’t appearing in search.',
  'I’d like to request a refund for my subscription.',
]
const agentReplies = [
  'Hi! Thanks for reaching out — happy to help. Could you share a bit more detail?',
  'Thanks for flagging this. Let me look into it for you right away.',
  'I’ve checked your account and escalated this to the team.',
  'That should be sorted now. Is there anything else I can help with?',
]
const customerFollowUps = [
  'Sure — it started happening yesterday.',
  'Thank you! Any update on this?',
  'Okay, I’ll wait to hear back.',
]

export const supportTickets: SupportTicket[] = Array.from({ length: 12 }, (_, i) => {
  const customer = users[(i * 3) % users.length]
  const status: SupportStatus = (['open', 'open', 'pending', 'resolved'] as const)[i % 4]
  return {
    id: `tkt_${12000 + i}`,
    customerName: customer.name,
    customerEmail: customer.email,
    subject: supportSubjects[i % supportSubjects.length],
    status,
    lastMessage: '',
    lastMessageAt: daysAgo(i % 7),
    unread: status === 'open' ? 1 : 0,
    messageCount: 0,
    createdAt: daysAgo((i % 7) + 1),
  }
})

// Build each ticket's thread. Open tickets end on a customer message (awaiting a
// reply); resolved tickets end on an agent message.
export const supportMessages: SupportMessage[] = supportTickets.flatMap((ticket, i) => {
  const senders: SupportSender[] =
    ticket.status === 'resolved'
      ? ['customer', 'agent', 'customer', 'agent']
      : ticket.status === 'pending'
        ? ['customer', 'agent']
        : ['customer', 'agent', 'customer']

  const thread = senders.map((sender, k) => {
    const body =
      sender === 'agent'
        ? agentReplies[(i + k) % agentReplies.length]
        : k === 0
          ? customerOpeners[i % customerOpeners.length]
          : customerFollowUps[(i + k) % customerFollowUps.length]
    return {
      id: `${ticket.id}_m${k}`,
      ticketId: ticket.id,
      sender,
      body,
      sentAt: daysAgo((i % 7) + (senders.length - k) * 0.04),
    }
  })

  const last = thread[thread.length - 1]
  ticket.lastMessage = last.body
  ticket.lastMessageAt = last.sentAt
  ticket.messageCount = thread.length
  return thread
})

/* ----------------------------- Audit ------------------------------ */

const auditActions = [
  { action: 'banned a user', targetType: 'User' },
  { action: 'approved a store', targetType: 'Store' },
  { action: 'resolved a report', targetType: 'Report' },
  { action: 'refunded a payment', targetType: 'Transaction' },
  { action: 'published a page', targetType: 'Content' },
  { action: 'added an admin', targetType: 'Admin' },
  { action: 'updated a plan', targetType: 'Plan' },
]
export const auditLogs: AuditLog[] = Array.from({ length: 30 }, (_, i) => {
  const entry = auditActions[i % auditActions.length]
  return {
    id: `log_${10000 + i}`,
    actorName: admins[i % admins.length].name,
    action: entry.action,
    targetType: entry.targetType,
    targetName:
      entry.targetType === 'User'
        ? users[i % users.length].name
        : entry.targetType === 'Store'
          ? stores[i % stores.length].name
          : `#${1000 + i}`,
    createdAt: daysAgo(i),
  }
})
