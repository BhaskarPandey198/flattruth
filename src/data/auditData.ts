export type RiskLevel = 'safe' | 'moderate' | 'critical';

export interface CategoryScore {
  id: string;
  label: string;
  score: number;
  maxScore: number;
  level: RiskLevel;
  headline: string;
  detail: string;
  icon: string;
}

export interface RedFlag {
  id: string;
  tag: string;
  tagLevel: RiskLevel;
  title: string;
  body: string;
  reportedBy: string;
  date: string;
}

export interface RedditSignal {
  id: string;
  title: string;
  subreddit: string;
  excerpt: string;
  upvotes: number;
  comments: number;
  date: string;
  url: string;
  sentiment: RiskLevel;
  keywords: string[];
}

export interface GoogleReview {
  id: string;
  reviewer: string;
  rating: number;
  excerpt: string;
  date: string;
  keywords: string[];
  sentiment: RiskLevel;
  tenure: string;
}

export interface NewsSignal {
  id: string;
  headline: string;
  source: string;
  sourceType: 'civic' | 'legal' | 'media';
  excerpt: string;
  date: string;
  url: string;
  relevanceTags: string[];
}

export interface LeaseClause {
  id: string;
  clauseNumber: string;
  title: string;
  body: string;
  riskAddressed: string;
  priority: 'must-have' | 'recommended' | 'optional';
}

export interface SocietyAuditData {
  societyId: string;
  societyName: string;
  locality: string;
  city: string;
  municipalWard: string;
  pincode: string;
  builder: string;
  completionYear: number;
  totalUnits: number;
  tenantRiskIndex: number;
  riskLevel: RiskLevel;
  riskSummary: string;
  signalCounts: {
    googleReviews: number;
    redditThreads: number;
    newsMentions: number;
    twitterPosts: number;
  };
  lastAuditedAt: string;
  categories: CategoryScore[];
  redFlags: RedFlag[];
  redditSignals: RedditSignal[];
  googleReviews: GoogleReview[];
  newsSignals: NewsSignal[];
  leaseClauses: LeaseClause[];
}

// ─── MOCK DATA: Prestige Falcon City, Bengaluru ───────────────────────────────
// Backend integration point: replace with API call to /api/audit?society=prestige-falcon-city&city=bengaluru

export const PRESTIGE_FALCON_CITY: SocietyAuditData = {
  societyId: 'society-pfc-blr-001',
  societyName: 'Prestige Falcon City',
  locality: 'Konanakunte Cross, Banashankari',
  city: 'Bengaluru',
  municipalWard: 'Ward 183 – Konanakunte',
  pincode: '560062',
  builder: 'Prestige Group',
  completionYear: 2019,
  totalUnits: 3200,
  tenantRiskIndex: 74,
  riskLevel: 'critical',
  riskSummary: 'Frequent Water Tanker Shortages & High Deposit Deductions',
  signalCounts: {
    googleReviews: 142,
    redditThreads: 38,
    newsMentions: 14,
    twitterPosts: 22,
  },
  lastAuditedAt: '23 Sep 2026, 06:14 AM',
  categories: [
    {
      id: 'cat-water',
      label: 'Water Security',
      score: 32,
      maxScore: 100,
      level: 'critical',
      headline: 'Severe Tanker Dependency',
      detail: 'Cauvery pipeline connection pending since Q3 2023. Residents pay ₹1,800–₹3,200/month for private tankers on top of maintenance.',
      icon: 'Droplets',
    },
    {
      id: 'cat-deposit',
      label: 'Deposit Safety',
      score: 45,
      maxScore: 100,
      level: 'moderate',
      headline: 'Avg 38% Deposit Deducted',
      detail: 'Landlords citing "painting charges" and "general wear" as deduction grounds. Average security deposit here is ₹1.2L–₹1.8L (3–4 months rent).',
      icon: 'IndianRupee',
    },
    {
      id: 'cat-civic',
      label: 'Civic Infrastructure',
      score: 28,
      maxScore: 100,
      level: 'critical',
      headline: 'Waterlogged Access Road',
      detail: 'Main entrance road (Konanakunte Cross) floods for 3–6 days during heavy rain. BBMP storm drain repair stalled since 2024 budget.',
      icon: 'Construction',
    },
    {
      id: 'cat-rwa',
      label: 'RWA / Society Rules',
      score: 82,
      maxScore: 100,
      level: 'safe',
      headline: 'Strict Bachelor Restrictions',
      detail: 'RWA enforces 10 PM visitor cut-off, no bachelor tenants in 60% of blocks, and mandatory police verification. Gate staff known for confrontational behaviour.',
      icon: 'ShieldAlert',
    },
  ],
  redFlags: [
    {
      id: 'flag-water-001',
      tag: 'CRITICAL WATER',
      tagLevel: 'critical',
      title: 'Private water tanker surcharge jumped ₹2,800/mo in summer 2026',
      body: 'RWA passed a resolution in April 2026 levying ₹2,800/month tanker surcharge on top of the ₹4,500 base maintenance. Multiple residents on r/bangalore reported receiving zero notice before the charge appeared on their maintenance bill.',
      reportedBy: '14 Reddit threads + 3 Google reviews',
      date: 'Apr–Jun 2026',
    },
    {
      id: 'flag-deposit-001',
      tag: 'FINANCIAL RISK',
      tagLevel: 'moderate',
      title: 'Deposit deductions averaging ₹42,000 on ₹1.1L deposits',
      body: 'Aggregated from 22 move-out reports on r/bangalore and Google reviews. Common deduction line items: "full apartment repainting" (₹18,000), "cleaning charges" (₹8,500), "fixture damage" (₹6,000–₹15,000). Most tenants report no pre-move-in condition documentation provided.',
      reportedBy: '22 Reddit threads + 8 Google reviews',
      date: 'Jan 2025–Aug 2026',
    },
    {
      id: 'flag-flood-001',
      tag: 'MONSOON HAZARD',
      tagLevel: 'critical',
      title: 'Konanakunte Cross waterlogged 4–8 days every monsoon season',
      body: 'BBMP ward 183 storm drain upgrade was approved in 2023 budget but work has not commenced as of September 2026. Residents report cars damaged, basement parking flooded, and children unable to attend school during peak monsoon weeks.',
      reportedBy: 'BBMP notice + 19 Google reviews + Deccan Herald',
      date: 'Jul–Sep 2025 & 2026',
    },
  ],
  redditSignals: [
    {
      id: 'reddit-001',
      title: 'Anyone else getting hit with ₹2800/month "water tanker" charge at Prestige Falcon City?',
      subreddit: 'r/bangalore',
      excerpt: 'We just got our July maintenance bill and there\'s a ₹2,800 "Tanker Water Surcharge" line item with zero prior notice. The RWA WhatsApp group has 200+ angry messages. Management says Cauvery connection is "in progress" — same thing they\'ve been saying since 2023.',
      upvotes: 847,
      comments: 134,
      date: '14 Jul 2026',
      url: '#',
      sentiment: 'critical',
      keywords: ['tanker surcharge', 'BWSSB', 'no notice', 'RWA'],
    },
    {
      id: 'reddit-002',
      title: 'Moving out of PFC — landlord deducted ₹46,000 from my ₹1.1L deposit. Here\'s what happened.',
      subreddit: 'r/bangalore',
      excerpt: 'After 18 months at Falcon City, my landlord deducted ₹46,000 citing full repainting (₹18K), "deep cleaning" (₹9K), and "lift damage" (₹7K, which makes no sense). I had no move-in inspection report. Sending legal notice now. Save yourselves.',
      upvotes: 1203,
      comments: 218,
      date: '03 Aug 2026',
      url: '#',
      sentiment: 'critical',
      keywords: ['deposit deduction', 'painting charges', 'legal notice', 'no inspection report'],
    },
    {
      id: 'reddit-003',
      title: 'Konanakunte Cross waterlogging — anyone else stuck for 5 days?',
      subreddit: 'r/bangalore',
      excerpt: 'My office cab couldn\'t enter the society for 5 days straight last August. Had to wade through ankle-deep water to reach the main road. BBMP has a notice board saying "work in progress" but there\'s been zero activity. This is the third year in a row.',
      upvotes: 612,
      comments: 89,
      date: '22 Aug 2026',
      url: '#',
      sentiment: 'critical',
      keywords: ['waterlogging', 'BBMP', 'Konanakunte', 'monsoon', 'cab access'],
    },
    {
      id: 'reddit-004',
      title: 'Bachelors at Prestige Falcon City — what\'s the actual ground reality?',
      subreddit: 'r/bangalore',
      excerpt: 'I\'m a single male professional looking at PFC. On paper some blocks allow bachelors but multiple people here say the gate security harasses you every time a friend visits after 9:30 PM. Is this actually enforced or just on paper?',
      upvotes: 389,
      comments: 76,
      date: '09 Sep 2026',
      url: '#',
      sentiment: 'moderate',
      keywords: ['bachelor restrictions', 'security harassment', 'visitor policy', 'single tenant'],
    },
    {
      id: 'reddit-005',
      title: 'Prestige Falcon City lift issues — Tower C and D residents?',
      subreddit: 'r/bangalore',
      excerpt: 'Tower C lift has been stuck in "maintenance" for 3 weeks. We have elderly parents visiting and have to climb 14 floors. RWA response: "vendor is busy." Anyone else facing this? This is the 4th breakdown this year.',
      upvotes: 278,
      comments: 44,
      date: '18 Sep 2026',
      url: '#',
      sentiment: 'moderate',
      keywords: ['lift breakdown', 'Tower C', 'maintenance', 'RWA unresponsive'],
    },
    {
      id: 'reddit-006',
      title: 'Good things about PFC — trying to be fair here',
      subreddit: 'r/bangalore',
      excerpt: 'Despite all the issues, I want to say the clubhouse and pool are well-maintained, power backup is solid (DG covers 100%), and the green areas are genuinely good. Just go in with eyes open about water and deposit issues.',
      upvotes: 156,
      comments: 31,
      date: '20 Sep 2026',
      url: '#',
      sentiment: 'safe',
      keywords: ['clubhouse', 'power backup', 'green areas', 'pool'],
    },
  ],
  googleReviews: [
    {
      id: 'google-001',
      reviewer: 'Priya Venkataraman',
      rating: 1,
      excerpt: 'Water situation is a complete disaster. We haven\'t had BWSSB water in our taps for 11 months. The tanker comes at 6 AM and you have to wake up to fill tanks or you have nothing for the day. The ₹2,800 surcharge is just extortion at this point.',
      date: '02 Aug 2026',
      keywords: ['BWSSB', 'tanker', 'surcharge', 'water shortage'],
      sentiment: 'critical',
      tenure: 'Resident for 2 years',
    },
    {
      id: 'google-002',
      reviewer: 'Karthik Subramaniam',
      rating: 2,
      excerpt: 'Moved out after 14 months. Landlord deducted ₹38,000 from my deposit for "repainting" even though I had painted the walls myself before moving in. No move-in checklist was given. The society itself is okay but the deposit situation is a scam.',
      date: '15 Jul 2026',
      keywords: ['deposit deduction', 'repainting', 'no checklist', 'scam'],
      sentiment: 'critical',
      tenure: 'Former resident (14 months)',
    },
    {
      id: 'google-003',
      reviewer: 'Ananya Krishnamurthy',
      rating: 1,
      excerpt: 'Basement parking flooded completely during July rains. My car had ₹85,000 in water damage. Society claims no liability. The entrance road was unusable for 6 days. I had to take an Uber from 800 metres away just to get home. Never again.',
      date: '28 Jul 2026',
      keywords: ['basement flooding', 'car damage', 'waterlogging', 'monsoon'],
      sentiment: 'critical',
      tenure: 'Resident for 8 months',
    },
    {
      id: 'google-004',
      reviewer: 'Rohan Mehta',
      rating: 2,
      excerpt: 'Security staff is extremely rude to guests. My parents were made to wait 25 minutes at the gate while the guard "verified" with the RWA. My girlfriend was told she cannot enter after 10 PM. This is 2026, not 1980.',
      date: '11 Sep 2026',
      keywords: ['security staff', 'guest policy', 'visitor restriction', 'rude'],
      sentiment: 'moderate',
      tenure: 'Resident for 1.5 years',
    },
    {
      id: 'google-005',
      reviewer: 'Deepa Nair',
      rating: 2,
      excerpt: 'Seepage issue in my bedroom wall for 6 months. Raised 4 complaints with RWA. They sent a plumber once who said it\'s the flat above my responsibility. Flat above says it\'s RWA\'s responsibility. Nothing has been fixed.',
      date: '06 Sep 2026',
      keywords: ['seepage', 'wall damp', 'RWA unresponsive', 'complaint ignored'],
      sentiment: 'moderate',
      tenure: 'Resident for 3 years',
    },
    {
      id: 'google-006',
      reviewer: 'Aditya Bhat',
      rating: 2,
      excerpt: 'Lift issues in Tower D are chronic. 4th breakdown this year. Management says AMC vendor is delayed. For a society of this size and price point, this is completely unacceptable. Amenities on paper, chaos in reality.',
      date: '19 Sep 2026',
      keywords: ['lift issues', 'Tower D', 'AMC', 'maintenance failure'],
      sentiment: 'moderate',
      tenure: 'Resident for 11 months',
    },
    {
      id: 'google-007',
      reviewer: 'Meghna Shetty',
      rating: 1,
      excerpt: 'BWSSB connection was supposed to come in "6 months" when I moved in. That was 22 months ago. The builder and RWA keep passing the blame. Meanwhile we pay ₹3,200/month tanker charges. This should be in the rental listing as a mandatory disclosure.',
      date: '21 Sep 2026',
      keywords: ['BWSSB pending', 'builder negligence', 'tanker charges', 'disclosure'],
      sentiment: 'critical',
      tenure: 'Resident for 22 months',
    },
  ],
  newsSignals: [
    {
      id: 'news-001',
      headline: 'BBMP Ward 183 Storm Drain Upgrade: Third Year of Delays as Konanakunte Cross Floods Again',
      source: 'Deccan Herald',
      sourceType: 'media',
      excerpt: 'Residents of Konanakunte Cross and surrounding layouts faced severe waterlogging during the August 2026 monsoon, with the BBMP ward 183 storm drain upgrade project stalled for the third consecutive year. Officials cited "contractor non-performance" and "revised DPR requirements" as reasons for the delay. Ward corporator Smt. Kavitha Reddy acknowledged the issue in a press statement.',
      date: '24 Aug 2026',
      url: '#',
      relevanceTags: ['BBMP', 'Ward 183', 'Flooding', 'Infrastructure Delay'],
    },
    {
      id: 'news-002',
      headline: 'BWSSB Cauvery Stage V: Banashankari–Konanakunte Extension Pushed to Q2 2027',
      source: 'The Hindu – Bengaluru',
      sourceType: 'civic',
      excerpt: 'The Bengaluru Water Supply and Sewerage Board (BWSSB) confirmed that the Cauvery Stage V pipeline extension covering Banashankari 6th Stage and Konanakunte areas has been rescheduled to Q2 2027, citing land acquisition challenges and contractor delays. Approximately 18,000 households in the affected layouts remain dependent on private water tankers.',
      date: '15 Sep 2026',
      url: '#',
      relevanceTags: ['BWSSB', 'Cauvery Stage V', 'Water Pipeline', 'Q2 2027'],
    },
    {
      id: 'news-003',
      headline: 'Consumer Forum Orders Prestige Group to Refund ₹2.1L to Homebuyer Over Delayed Possession',
      source: 'Bengaluru Consumer Disputes Redressal Commission',
      sourceType: 'legal',
      excerpt: 'The Bengaluru Consumer Disputes Redressal Commission directed Prestige Estates Projects Ltd to refund ₹2.1 lakh to a homebuyer in a related Prestige property, citing 18-month possession delay and misrepresentation of amenity timelines. Legal experts note this sets a precedent relevant to other Prestige society buyers.',
      date: '08 Jul 2026',
      url: '#',
      relevanceTags: ['Consumer Forum', 'Prestige Group', 'Legal Precedent', 'Possession Delay'],
    },
    {
      id: 'news-004',
      headline: 'Karnataka Rent Control Amendments: Security Deposit Cap at 3 Months Now Enforceable',
      source: 'Times of India – Bengaluru',
      sourceType: 'civic',
      excerpt: 'Karnataka\'s amended rental legislation, effective September 2026, caps security deposits at 3 months\' rent and mandates written move-in/move-out condition reports. Violations are now cognisable offences under the Karnataka Rent Act. Legal aid bodies urge tenants to document flat conditions at move-in.',
      date: '01 Sep 2026',
      url: '#',
      relevanceTags: ['Karnataka Rent Act', 'Deposit Cap', '3 Months', 'Tenant Rights'],
    },
    {
      id: 'news-005',
      headline: 'Bengaluru RWAs Under Scanner: BBMP Issues Notice Over Illegal Guest Restrictions',
      source: 'Bangalore Mirror',
      sourceType: 'civic',
      excerpt: 'BBMP issued notices to 14 Resident Welfare Associations in South Bengaluru for enforcing guest entry restrictions that contravene municipal guidelines. Societies imposing "no guests after 10 PM" and "bachelor tenant bans" without legal backing were specifically cited. RWAs have 30 days to revise their by-laws.',
      date: '10 Sep 2026',
      url: '#',
      relevanceTags: ['RWA', 'BBMP Notice', 'Guest Restrictions', 'Bachelor Ban'],
    },
  ],
  leaseClauses: [
    {
      id: 'clause-001',
      clauseNumber: 'Clause 7',
      title: 'Security Deposit Refund & Deduction Accountability',
      body: 'The Landlord agrees to refund the full security deposit of ₹[AMOUNT] within fourteen (14) calendar days of the Tenant vacating the premises. Any deductions shall be limited to documented physical damage beyond normal wear and tear, supported by photographic evidence and third-party repair estimates. A joint move-in inspection report (Annexure A) and move-out inspection report (Annexure B) shall be mandatory. Deductions not supported by Annexure B evidence shall be deemed unlawful and recoverable under Karnataka Rent Act, 2024 Amendment.',
      riskAddressed: 'Deposit Deduction Risk',
      priority: 'must-have',
    },
    {
      id: 'clause-002',
      clauseNumber: 'Clause 11',
      title: 'Water Supply Surcharge Cap & Disclosure',
      body: 'The Landlord acknowledges that the property at [ADDRESS] is currently not connected to the BWSSB municipal water supply line and is dependent on private water tankers. The total monthly water-related surcharge payable by the Tenant (including tanker fees, RWA water charges, and any levy) shall not exceed ₹1,500 per month for the duration of this agreement. Any increase beyond this cap shall require written consent from the Tenant with 30 days\' advance notice. If BWSSB connection is established during the tenancy, this clause shall lapse.',
      riskAddressed: 'Water Tanker Cost Escalation',
      priority: 'must-have',
    },
    {
      id: 'clause-003',
      clauseNumber: 'Clause 14',
      title: 'Force Majeure — Monsoon Infrastructure Failure',
      body: 'In the event that access to the leased premises is rendered impossible or substantially impaired for more than 48 continuous hours due to flooding, waterlogging, or failure of civic infrastructure (including but not limited to BBMP road drainage failure at Konanakunte Cross), the Tenant shall be entitled to a pro-rata rent deduction for each day of impaired access. Documentation via photographs and municipal complaint reference numbers shall constitute sufficient evidence. This clause supersedes any general maintenance clause in this agreement.',
      riskAddressed: 'Monsoon Access Disruption',
      priority: 'recommended',
    },
  ],
};

// ─── MOCK DATA: Sobha Dream Acres, Bengaluru ──────────────────────────────────
export const SOBHA_DREAM_ACRES: SocietyAuditData = {
  societyId: 'society-sda-blr-002',
  societyName: 'Sobha Dream Acres',
  locality: 'Balagere Road, Whitefield',
  city: 'Bengaluru',
  municipalWard: 'Ward 85 – Balagere',
  pincode: '560066',
  builder: 'Sobha Limited',
  completionYear: 2020,
  totalUnits: 6800,
  tenantRiskIndex: 56,
  riskLevel: 'moderate',
  riskSummary: 'Traffic Congestion & Occasional Water Pressure Issues',
  signalCounts: {
    googleReviews: 218,
    redditThreads: 52,
    newsMentions: 9,
    twitterPosts: 31,
  },
  lastAuditedAt: '23 Sep 2026, 06:14 AM',
  categories: [
    { id: 'cat-water', label: 'Water Security', score: 61, maxScore: 100, level: 'moderate', headline: 'Intermittent Pressure Issues', detail: 'BWSSB connection exists but low pressure reported in upper floors (10th+) during peak hours. Occasional tanker supplementation in summer months.', icon: 'Droplets' },
    { id: 'cat-deposit', label: 'Deposit Safety', score: 58, maxScore: 100, level: 'moderate', headline: 'Avg 28% Deposit Deducted', detail: 'Deductions more reasonable than market average but painting charges remain contentious. Move-in documentation practices vary by landlord.', icon: 'IndianRupee' },
    { id: 'cat-civic', label: 'Civic Infrastructure', score: 38, maxScore: 100, level: 'critical', headline: 'Severe Traffic Congestion', detail: 'Whitefield–Balagere stretch clocked 45-minute delays during peak hours. BMTC connectivity poor. Metro Phase 3 Whitefield extension expected Q4 2027.', icon: 'Construction' },
    { id: 'cat-rwa', label: 'RWA / Society Rules', score: 74, maxScore: 100, level: 'safe', headline: 'Moderate Visitor Restrictions', detail: 'Visitor entry cut-off at 11 PM. Bachelor tenants allowed in designated blocks. Security verification process takes 5–10 minutes.', icon: 'ShieldAlert' },
  ],
  redFlags: [
    { id: 'flag-traffic-001', tag: 'CIVIC HAZARD', tagLevel: 'critical', title: 'Balagere Road peak-hour commute averaging 55 minutes for 4km stretch', body: 'Multiple residents report leaving home by 7:30 AM to beat traffic. Return commute from Whitefield ITPL can take 70–90 minutes in the evening. BMTC routes are infrequent.', reportedBy: '28 Reddit threads + Google reviews', date: 'Jan–Sep 2026' },
    { id: 'flag-deposit-002', tag: 'FINANCIAL RISK', tagLevel: 'moderate', title: 'Painting deduction disputes common at move-out', body: 'Around 30% of move-out reviews mention painting charges of ₹12,000–₹22,000. Landlords claim tenants are responsible for full repaint regardless of duration.', reportedBy: '18 Reddit threads', date: 'Mar 2025–Aug 2026' },
  ],
  redditSignals: [
    { id: 'reddit-sda-001', title: 'Sobha Dream Acres traffic — is it as bad as people say?', subreddit: 'r/bangalore', excerpt: 'I work in Marathahalli and am considering SDA. The commute from Balagere seems brutal. Anyone doing this daily? Is it manageable?', upvotes: 534, comments: 98, date: '18 Aug 2026', url: '#', sentiment: 'critical', keywords: ['traffic', 'Balagere', 'commute', 'Marathahalli'] },
    { id: 'reddit-sda-002', title: 'Water pressure in high floors at SDA — 12th floor experience?', subreddit: 'r/bangalore', excerpt: 'On the 12th floor, water pressure is very low between 7–9 AM. Overhead tank takes time to fill. Not a dealbreaker but worth knowing.', upvotes: 189, comments: 34, date: '05 Sep 2026', url: '#', sentiment: 'moderate', keywords: ['water pressure', 'high floor', 'overhead tank'] },
  ],
  googleReviews: [
    { id: 'google-sda-001', reviewer: 'Sanjay Kulkarni', rating: 2, excerpt: 'The traffic situation is genuinely awful. I spend 2.5 hours commuting daily. The society itself is well-maintained but the location is a trap.', date: '12 Sep 2026', keywords: ['traffic', 'commute', 'location'], sentiment: 'critical', tenure: 'Resident for 1 year' },
    { id: 'google-sda-002', reviewer: 'Lakshmi Prasad', rating: 2, excerpt: 'Landlord deducted ₹18,000 for painting when I lived here for 2.5 years. No move-in checklist was given. Good society otherwise.', date: '01 Aug 2026', keywords: ['deposit deduction', 'painting', 'no checklist'], sentiment: 'moderate', tenure: 'Former resident' },
  ],
  newsSignals: [
    { id: 'news-sda-001', headline: 'Whitefield Metro Phase 3 Extension: BMRCL Confirms Q4 2027 Target', source: 'Bangalore Mirror', sourceType: 'civic', excerpt: 'BMRCL confirmed the Whitefield–Balagere metro extension is targeted for Q4 2027, potentially reducing commute times significantly for Sobha Dream Acres and surrounding layouts.', date: '10 Sep 2026', url: '#', relevanceTags: ['Metro Phase 3', 'Whitefield', 'BMRCL', '2027'] },
  ],
  leaseClauses: [
    { id: 'clause-sda-001', clauseNumber: 'Clause 7', title: 'Security Deposit Refund & Deduction Accountability', body: 'The Landlord agrees to refund the full security deposit of ₹[AMOUNT] within fourteen (14) calendar days of the Tenant vacating the premises. Any deductions shall be limited to documented physical damage beyond normal wear and tear, supported by photographic evidence and third-party repair estimates. A joint move-in inspection report (Annexure A) shall be mandatory.', riskAddressed: 'Deposit Deduction Risk', priority: 'must-have' },
    { id: 'clause-sda-002', clauseNumber: 'Clause 12', title: 'Water Pressure & Supply Adequacy Warranty', body: 'The Landlord warrants that the premises shall receive adequate municipal water supply at sufficient pressure to service all fixtures on the leased floor. In the event of supply failure exceeding 72 hours, the Landlord shall arrange alternative supply at no cost to the Tenant.', riskAddressed: 'Water Supply Adequacy', priority: 'recommended' },
    { id: 'clause-sda-003', clauseNumber: 'Clause 15', title: 'Infrastructure Development Disclosure', body: 'The Landlord acknowledges that current road infrastructure on Balagere Road experiences significant peak-hour congestion and agrees to disclose any known planned construction that may further impact access to the premises.', riskAddressed: 'Commute & Access Risk', priority: 'optional' },
  ],
};

// ─── MOCK DATA: DLF Phase 3, Gurgaon ─────────────────────────────────────────
export const DLF_PHASE3: SocietyAuditData = {
  societyId: 'society-dlf3-grg-003',
  societyName: 'DLF Phase 3',
  locality: 'Sector 24, DLF Phase 3',
  city: 'Gurgaon',
  municipalWard: 'Ward 22 – Sector 24',
  pincode: '122002',
  builder: 'DLF Limited',
  completionYear: 2011,
  totalUnits: 1400,
  tenantRiskIndex: 48,
  riskLevel: 'moderate',
  riskSummary: 'Ageing Infrastructure & Power Cut Concerns',
  signalCounts: {
    googleReviews: 89,
    redditThreads: 24,
    newsMentions: 7,
    twitterPosts: 12,
  },
  lastAuditedAt: '23 Sep 2026, 06:14 AM',
  categories: [
    { id: 'cat-water', label: 'Water Security', score: 68, maxScore: 100, level: 'safe', headline: 'Stable Municipal Supply', detail: 'MCG water supply generally reliable. Minor pressure complaints in older blocks. No tanker dependency reported.', icon: 'Droplets' },
    { id: 'cat-deposit', label: 'Deposit Safety', score: 55, maxScore: 100, level: 'moderate', headline: 'Avg 32% Deposit Deducted', detail: 'Ageing buildings mean landlords frequently cite "wear and tear" on older fixtures. Move-in documentation practices inconsistent.', icon: 'IndianRupee' },
    { id: 'cat-civic', label: 'Civic Infrastructure', score: 44, maxScore: 100, level: 'moderate', headline: 'Power Cuts in Summer', detail: 'DHBVN power cuts average 3–4 hours/day during May–July peak. DG backup covers only common areas, not individual flats in most buildings.', icon: 'Construction' },
    { id: 'cat-rwa', label: 'RWA / Society Rules', score: 65, maxScore: 100, level: 'moderate', headline: 'Reasonable Rules, Aging Enforcement', detail: 'Rules are moderate. Visitor policy is flexible. Some older blocks have maintenance backlogs that RWA has been slow to address.', icon: 'ShieldAlert' },
  ],
  redFlags: [
    { id: 'flag-power-001', tag: 'CIVIC HAZARD', tagLevel: 'moderate', title: 'DHBVN power cuts averaging 3–4 hours/day in peak summer', body: 'Residents report unplanned cuts during May–July. DG backup is available for common areas but not individual flats. Work-from-home residents particularly impacted.', reportedBy: '11 Reddit threads', date: 'May–Jul 2026' },
  ],
  redditSignals: [
    { id: 'reddit-dlf-001', title: 'DLF Phase 3 power situation — WFH feasible?', subreddit: 'r/gurgaon', excerpt: 'I am considering DLF Phase 3 and work from home full time. How bad are the power cuts really? Is inverter enough or do I need a full UPS setup?', upvotes: 234, comments: 56, date: '15 Jul 2026', url: '#', sentiment: 'moderate', keywords: ['power cut', 'DHBVN', 'WFH', 'inverter'] },
  ],
  googleReviews: [
    { id: 'google-dlf-001', reviewer: 'Vikram Oberoi', rating: 2, excerpt: 'Power cuts in summer are brutal. 4 hours without power in 45°C heat is not acceptable. The DG only covers lifts and common areas. Landlord said "everyone has an inverter" but that was not disclosed upfront.', date: '28 Jun 2026', keywords: ['power cut', 'DG', 'summer', 'heat'], sentiment: 'critical', tenure: 'Resident for 8 months' },
  ],
  newsSignals: [
    { id: 'news-dlf-001', headline: 'DHBVN Load-Shedding Schedule: Gurgaon Sectors 22–28 to Face 3-Hour Cuts in Peak Summer', source: 'Hindustan Times', sourceType: 'civic', excerpt: 'DHBVN announced a revised load-shedding schedule for Gurgaon sectors 22–28, with 3-hour cuts between 2 PM and 6 PM during peak summer months. Sectors with DLF residential complexes are included.', date: '18 May 2026', url: '#', relevanceTags: ['DHBVN', 'Load Shedding', 'Gurgaon', 'Power Cut'] },
  ],
  leaseClauses: [
    { id: 'clause-dlf-001', clauseNumber: 'Clause 7', title: 'Security Deposit Refund & Deduction Accountability', body: 'The Landlord agrees to refund the full security deposit of ₹[AMOUNT] within fourteen (14) calendar days. Deductions require documented evidence and joint inspection reports.', riskAddressed: 'Deposit Deduction Risk', priority: 'must-have' },
    { id: 'clause-dlf-002', clauseNumber: 'Clause 9', title: 'Power Backup Adequacy Disclosure', body: 'The Landlord warrants that DG backup or UPS coverage extends to the leased flat\'s essential circuits (minimum: 2 power points and 1 light point). If this is not the case, the Landlord shall install adequate backup at no cost to the Tenant within 30 days of lease commencement.', riskAddressed: 'Power Cut Disruption', priority: 'must-have' },
    { id: 'clause-dlf-003', clauseNumber: 'Clause 13', title: 'Ageing Infrastructure Maintenance Responsibility', body: 'The Landlord accepts responsibility for maintenance and repair of all original building fixtures, plumbing, and electrical installations that are more than 10 years old. Tenant shall not be held liable for failure of such installations due to age or normal wear.', riskAddressed: 'Ageing Infrastructure Risk', priority: 'recommended' },
  ],
};

// ─── MOCK DATA: Megapolis Smart Homes, Hinjawadi Pune ─────────────────────────
export const MEGAPOLIS_SMART_HOMES: SocietyAuditData = {
  societyId: 'society-msh-pune-004',
  societyName: 'Megapolis Smart Homes',
  locality: 'Hinjawadi Phase 2, Rajiv Gandhi IT Park',
  city: 'Pune',
  municipalWard: 'Pimpri-Chinchwad Municipal Corp – Zone C',
  pincode: '411057',
  builder: 'Pegasus Properties',
  completionYear: 2017,
  totalUnits: 4200,
  tenantRiskIndex: 62,
  riskLevel: 'moderate',
  riskSummary: 'Water Tanker Dependency & IT Park Traffic Congestion',
  signalCounts: {
    googleReviews: 167,
    redditThreads: 41,
    newsMentions: 11,
    twitterPosts: 18,
  },
  lastAuditedAt: '23 Sep 2026, 06:14 AM',
  categories: [
    { id: 'cat-water', label: 'Water Security', score: 40, maxScore: 100, level: 'critical', headline: 'PCMC Water Irregular', detail: 'PCMC supply comes once every 3 days. Tanker dependency during summer. Monthly tanker cost ₹1,200–₹2,000 per flat.', icon: 'Droplets' },
    { id: 'cat-deposit', label: 'Deposit Safety', score: 62, maxScore: 100, level: 'moderate', headline: 'Avg 25% Deposit Deducted', detail: 'Below-market deduction rates. Several landlords in this society provide move-in checklists. Deposit disputes less common than Bengaluru average.', icon: 'IndianRupee' },
    { id: 'cat-civic', label: 'Civic Infrastructure', score: 35, maxScore: 100, level: 'critical', headline: 'Hinjawadi IT Park Gridlock', detail: 'NH-48 and Hinjawadi Road experience 60–90 minute delays during 8–10 AM and 6–9 PM. Pune Metro Hinjawadi extension expected Q3 2027.', icon: 'Construction' },
    { id: 'cat-rwa', label: 'RWA / Society Rules', score: 71, maxScore: 100, level: 'safe', headline: 'Flexible Tenant Policies', detail: 'Bachelor tenants allowed in all blocks. Visitor policy reasonable (midnight cut-off). RWA is generally responsive to maintenance complaints within 48 hours.', icon: 'ShieldAlert' },
  ],
  redFlags: [
    { id: 'flag-water-msh', tag: 'CRITICAL WATER', tagLevel: 'critical', title: 'PCMC water supply every 3 days — tanker cost ₹1,200–₹2,000/month', body: 'PCMC supply is intermittent and residents store water in overhead tanks. During summer (Mar–Jun), supply drops to once every 4–5 days and tanker costs spike.', reportedBy: '19 Reddit threads + 12 Google reviews', date: 'Mar–Jun 2026' },
    { id: 'flag-traffic-msh', tag: 'CIVIC HAZARD', tagLevel: 'critical', title: 'Hinjawadi IT Park gridlock: 60–90 min commute for 5km', body: 'Morning peak (8–10 AM) and evening peak (6–9 PM) gridlock is severe. Residents working in Hinjawadi Phase 1 IT park report leaving home by 7:15 AM.', reportedBy: '24 Reddit threads', date: 'Jan–Sep 2026' },
  ],
  redditSignals: [
    { id: 'reddit-msh-001', title: 'Megapolis Hinjawadi water situation — is it actually that bad?', subreddit: 'r/pune', excerpt: 'Considering moving to Megapolis Smart Homes. Multiple people warning me about water. PCMC supply once in 3 days sounds wild. Is this true even now?', upvotes: 412, comments: 87, date: '10 Sep 2026', url: '#', sentiment: 'critical', keywords: ['PCMC water', 'tanker', 'Hinjawadi', 'water shortage'] },
    { id: 'reddit-msh-002', title: 'Hinjawadi traffic is genuinely destroying my mental health', subreddit: 'r/pune', excerpt: 'I spend 3 hours commuting daily from Megapolis to my office in Phase 1. It is 4km. I have started working from a cafe near office 3 days a week just to avoid the commute.', upvotes: 678, comments: 142, date: '19 Aug 2026', url: '#', sentiment: 'critical', keywords: ['traffic', 'commute', 'Hinjawadi', 'mental health'] },
  ],
  googleReviews: [
    { id: 'google-msh-001', reviewer: 'Suhas Deshpande', rating: 1, excerpt: 'Water comes once in 3 days. In summer it was once in 5 days. We pay ₹1,800/month for tanker on top of maintenance. Nobody told us this when we moved in.', date: '14 Jul 2026', keywords: ['PCMC', 'water shortage', 'tanker', 'summer'], sentiment: 'critical', tenure: 'Resident for 1.5 years' },
    { id: 'google-msh-002', reviewer: 'Rashmi Kulkarni', rating: 2, excerpt: 'Society is nice and RWA is responsive, but the traffic to Hinjawadi IT park is a nightmare. If you work in Hinjawadi, budget 2 hours for a 5km commute.', date: '02 Sep 2026', keywords: ['traffic', 'Hinjawadi', 'commute', 'IT park'], sentiment: 'critical', tenure: 'Resident for 2 years' },
  ],
  newsSignals: [
    { id: 'news-msh-001', headline: 'Pune Metro Hinjawadi–Shivajinagar Corridor: PMRDA Confirms Q3 2027 Target', source: 'Pune Mirror', sourceType: 'civic', excerpt: 'PMRDA confirmed the Hinjawadi–Shivajinagar metro corridor is targeted for Q3 2027. The Hinjawadi Phase 2 station will be within 800 metres of Megapolis Smart Homes, potentially transforming commute options.', date: '05 Sep 2026', url: '#', relevanceTags: ['Pune Metro', 'Hinjawadi', 'PMRDA', '2027'] },
    { id: 'news-msh-002', headline: 'PCMC Water Supply: Hinjawadi Phase 2 to Receive Pipeline Upgrade by March 2027', source: 'Indian Express – Pune', sourceType: 'civic', excerpt: 'PCMC has approved a ₹42 crore pipeline upgrade for Hinjawadi Phase 2 layouts. Work is expected to commence in November 2026 with completion by March 2027, which should bring daily water supply to approximately 18,000 households.', date: '20 Aug 2026', url: '#', relevanceTags: ['PCMC', 'Pipeline Upgrade', 'Hinjawadi Phase 2', '2027'] },
  ],
  leaseClauses: [
    { id: 'clause-msh-001', clauseNumber: 'Clause 7', title: 'Security Deposit Refund & Deduction Accountability', body: 'The Landlord agrees to refund the full security deposit of ₹[AMOUNT] within fourteen (14) calendar days. Deductions require documented evidence and joint inspection reports as per Karnataka Rent Act analogous standards.', riskAddressed: 'Deposit Deduction Risk', priority: 'must-have' },
    { id: 'clause-msh-002', clauseNumber: 'Clause 11', title: 'Water Supply Surcharge Cap & Disclosure', body: 'The Landlord acknowledges that the property depends on PCMC intermittent supply supplemented by private tankers. Total monthly water charges shall not exceed ₹1,200 per month. Any surcharge beyond this cap requires Tenant\'s written consent with 30 days\' notice.', riskAddressed: 'Water Tanker Cost Escalation', priority: 'must-have' },
    { id: 'clause-msh-003', clauseNumber: 'Clause 14', title: 'Infrastructure Development Disclosure', body: 'The Landlord acknowledges the current traffic congestion on Hinjawadi Road and discloses any known planned construction that may further impact access. Tenant acknowledges awareness of current commute conditions.', riskAddressed: 'Commute & Access Risk', priority: 'optional' },
  ],
};

export const QUICK_TRY_CHIPS = [
  { id: 'chip-pfc', label: 'Prestige Falcon City, BLR', data: PRESTIGE_FALCON_CITY },
  { id: 'chip-sda', label: 'Sobha Dream Acres, BLR', data: SOBHA_DREAM_ACRES },
  { id: 'chip-dlf', label: 'DLF Phase 3, Gurgaon', data: DLF_PHASE3 },
  { id: 'chip-msh', label: 'Megapolis Smart Homes, Hinjawadi Pune', data: MEGAPOLIS_SMART_HOMES },
];

export const CITIES = [
  { id: 'city-blr', label: 'Bengaluru' },
  { id: 'city-pune', label: 'Pune' },
  { id: 'city-dlhi', label: 'Delhi NCR' },
  { id: 'city-mum', label: 'Mumbai' },
  { id: 'city-hyd', label: 'Hyderabad' },
];