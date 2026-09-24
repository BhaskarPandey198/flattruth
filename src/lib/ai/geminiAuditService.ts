'use client';

import type { SocietyAuditData, CategoryScore, LeaseClause } from '@/data/auditData';

export interface GeminiRiskAnalysis {
  overallRiskScore: number;
  categoryScores: {
    waterSecurity: number;
    depositSafety: number;
    civicInfra: number;
    rwaRules: number;
  };
  topThreeRedFlags: string[];
  verdictSummary: string;
}

export interface GeminiLeaseClause {
  clauseNumber: string;
  title: string;
  body: string;
  riskAddressed: string;
  priority: 'must-have' | 'recommended' | 'optional';
}

// ─── Per-society mock audit data ─────────────────────────────────────────────

interface MockAuditPayload {
  riskScore: number;
  verdictSummary: string;
  categoryBreakdowns: GeminiRiskAnalysis['categoryScores'];
  tailoredClauses: GeminiLeaseClause[];
}

const SOCIETY_MOCK_DATA: Record<string, MockAuditPayload> = {
  'society-pfc-blr-001': {
    riskScore: 72,
    verdictSummary:
      'Prestige Falcon City carries elevated risk for prospective tenants primarily due to chronic water supply failures and a pattern of unjustified security deposit deductions. Multiple residents report tanker dependency during summer months and RWA-imposed restrictions on bachelor tenants that may not be legally enforceable.',
    categoryBreakdowns: {
      waterSecurity: 78,
      depositSafety: 74,
      civicInfra: 65,
      rwaRules: 70,
    },
    tailoredClauses: [
      {
        clauseNumber: 'Clause 1',
        title: 'Water Supply Guarantee & Tanker Surcharge Cap',
        body:
          'The Landlord warrants that the premises shall receive a minimum of 200 litres of potable water per person per day via BWSSB municipal supply. In the event of municipal supply failure exceeding 48 consecutive hours, the Landlord shall arrange private tanker supply at no additional cost to the Tenant. Any water-related maintenance surcharge levied by the RWA shall not exceed ₹500 per month and must be supported by a written invoice. Failure to meet this obligation entitles the Tenant to deduct equivalent costs from the subsequent month\'s rent.',
        riskAddressed: 'Chronic water shortage & tanker surcharges',
        priority: 'must-have',
      },
      {
        clauseNumber: 'Clause 2',
        title: 'Security Deposit Refund with Itemised Deduction Mandate',
        body:
          'The security deposit of ₹[AMOUNT] shall be refunded in full within 15 days of vacating the premises. Any deduction must be supported by a written itemised statement with photographic evidence and third-party repair invoices. Normal wear and tear — including minor wall scuffs, faded paint, and loose fixtures — shall not constitute grounds for deduction. Deductions exceeding ₹5,000 in aggregate require the Tenant\'s written consent. Failure to refund within 30 days shall attract interest at 12% per annum on the outstanding amount.',
        riskAddressed: 'Unjustified security deposit deductions',
        priority: 'must-have',
      },
      {
        clauseNumber: 'Clause 3',
        title: 'RWA Guest & Occupancy Policy Non-Discrimination',
        body:
          'The Landlord confirms that no RWA by-law or society rule shall restrict the Tenant\'s right to receive guests between 6 AM and 11 PM without prior written approval. Any RWA restriction targeting bachelor tenants, unmarried couples, or specific professions is acknowledged by the Landlord to be unenforceable under Karnataka Rent Act provisions and shall not be imposed on the Tenant. The Landlord shall intervene on the Tenant\'s behalf if the RWA attempts to enforce such discriminatory rules.',
        riskAddressed: 'Discriminatory RWA occupancy restrictions',
        priority: 'recommended',
      },
    ],
  },

  'society-sda-blr-002': {
    riskScore: 58,
    verdictSummary:
      'Sobha Dream Acres presents moderate tenant risk driven by inconsistent maintenance response times and occasional water pressure issues in upper-floor units. The society has a generally functional RWA but documented cases of delayed deposit refunds and opaque maintenance charge billing warrant protective clauses before signing.',
    categoryBreakdowns: {
      waterSecurity: 55,
      depositSafety: 65,
      civicInfra: 50,
      rwaRules: 60,
    },
    tailoredClauses: [
      {
        clauseNumber: 'Clause 1',
        title: 'Maintenance Response Time SLA',
        body:
          'The Landlord or their designated property manager shall acknowledge all maintenance requests submitted by the Tenant within 24 hours and resolve critical issues (water, electricity, structural) within 72 hours of acknowledgement. Non-critical repairs shall be completed within 10 working days. If the Landlord fails to respond within the stipulated period, the Tenant may engage a licensed contractor and deduct verified costs up to ₹3,000 per incident from the subsequent month\'s rent, with supporting invoices provided.',
        riskAddressed: 'Delayed maintenance response',
        priority: 'must-have',
      },
      {
        clauseNumber: 'Clause 2',
        title: 'Transparent Maintenance Charge Billing',
        body:
          'All society maintenance charges, including RWA fees, sinking fund contributions, and utility surcharges, shall be disclosed in writing prior to lease execution. Any increase in maintenance charges during the tenancy period shall require 30 days\' written notice. The Landlord shall provide itemised monthly statements for any charges billed beyond the agreed base maintenance amount. Undisclosed charges levied after lease signing shall not be recoverable from the Tenant.',
        riskAddressed: 'Opaque maintenance charge billing',
        priority: 'recommended',
      },
      {
        clauseNumber: 'Clause 3',
        title: 'Security Deposit Refund Timeline & Condition Documentation',
        body:
          'Prior to Tenant\'s move-in, both parties shall conduct a joint inspection and document the property condition with dated photographs annexed to this agreement. The security deposit shall be refunded within 21 days of vacating, less only documented damages beyond normal wear and tear. Water pressure issues, pre-existing paint conditions, and minor fixture wear shall not be deductible. Disputes regarding deductions shall be resolved through the Karnataka Rent Authority within 60 days.',
        riskAddressed: 'Deposit refund delays and condition disputes',
        priority: 'must-have',
      },
    ],
  },

  'society-dlf3-grg-003': {
    riskScore: 65,
    verdictSummary:
      'DLF Phase 3 in Gurgaon carries moderate-to-high tenant risk due to documented water supply irregularities, above-average security deposit dispute rates, and HRERA complaints regarding maintenance charge transparency. Prospective tenants should negotiate protective clauses covering water supply continuity, deposit refund timelines, and RWA fee escalation limits.',
    categoryBreakdowns: {
      waterSecurity: 68,
      depositSafety: 70,
      civicInfra: 62,
      rwaRules: 58,
    },
    tailoredClauses: [
      {
        clauseNumber: 'Clause 1',
        title: 'HRERA-Compliant Deposit Refund Guarantee',
        body:
          'In accordance with Haryana Real Estate Regulatory Authority guidelines, the security deposit of ₹[AMOUNT] shall be refunded within 15 days of the Tenant vacating the premises and handing over keys. Deductions shall be limited to damages documented in the move-out inspection report, supported by third-party repair quotations. The Landlord shall not deduct for repainting, cleaning, or normal wear and tear. Any disputed deduction exceeding ₹10,000 shall be referred to HRERA\'s online dispute resolution portal within 30 days.',
        riskAddressed: 'HRERA deposit dispute history',
        priority: 'must-have',
      },
      {
        clauseNumber: 'Clause 2',
        title: 'Water Supply Continuity & HUDA Dependency Disclosure',
        body:
          'The Landlord discloses that the society\'s water supply is dependent on HUDA (Haryana Urban Development Authority) bulk supply, which has historically experienced interruptions during peak summer months (April–June). The Landlord shall arrange alternative water supply via registered tanker services at no cost to the Tenant during any interruption exceeding 24 hours. The Tenant shall not be liable for any water conservation surcharge exceeding ₹300 per month without prior written consent.',
        riskAddressed: 'HUDA water supply interruptions',
        priority: 'must-have',
      },
      {
        clauseNumber: 'Clause 3',
        title: 'RWA Maintenance Fee Escalation Cap',
        body:
          'The current monthly maintenance charge of ₹[AMOUNT] shall not be increased by more than 8% per annum during the tenancy period. Any extraordinary levy or special assessment by the RWA exceeding ₹2,000 shall require the Tenant\'s written consent before being passed on. The Landlord shall provide audited RWA financial statements upon request. Failure to disclose pending special assessments prior to lease signing shall entitle the Tenant to terminate the agreement without penalty.',
        riskAddressed: 'Opaque RWA fee escalation',
        priority: 'recommended',
      },
    ],
  },

  'society-msh-pune-004': {
    riskScore: 61,
    verdictSummary:
      'Megapolis Smart Homes in Hinjawadi presents moderate risk primarily linked to monsoon flooding on approach roads, IT park traffic congestion affecting livability, and reported delays in common area maintenance. The society\'s deposit refund record is relatively better than Bengaluru counterparts, but water supply during summer months and RWA responsiveness remain areas of concern.',
    categoryBreakdowns: {
      waterSecurity: 60,
      depositSafety: 55,
      civicInfra: 70,
      rwaRules: 58,
    },
    tailoredClauses: [
      {
        clauseNumber: 'Clause 1',
        title: 'Monsoon Flooding & Civic Infrastructure Disclosure',
        body:
          'The Landlord discloses that the approach roads to Megapolis Smart Homes, Hinjawadi Phase 2, are subject to waterlogging during monsoon season (June–September), which may affect the Tenant\'s access to the premises. The Landlord warrants that the society\'s internal drainage system is functional and that the Tenant\'s unit is not in a flood-prone zone. Any damage to the Tenant\'s belongings caused by internal society drainage failure shall be the Landlord\'s liability. The Tenant may terminate the agreement with 30 days\' notice if civic flooding renders the premises inaccessible for more than 5 consecutive days.',
        riskAddressed: 'Monsoon road flooding & access disruption',
        priority: 'must-have',
      },
      {
        clauseNumber: 'Clause 2',
        title: 'Water Supply Continuity During Summer Months',
        body:
          'The Landlord warrants adequate water supply throughout the tenancy, including during peak summer months (March–May) when Hinjawadi\'s MIDC water allocation is historically reduced. In the event of supply shortfall, the Landlord shall arrange tanker water at no additional cost to the Tenant within 48 hours of reported shortage. The Tenant shall not be charged any water conservation levy exceeding ₹400 per month. Persistent water shortage exceeding 7 days shall entitle the Tenant to a proportional rent reduction.',
        riskAddressed: 'Summer water supply shortfall',
        priority: 'must-have',
      },
      {
        clauseNumber: 'Clause 3',
        title: 'Common Area Maintenance & RWA Response Commitment',
        body:
          'The Landlord acknowledges that common area maintenance — including lifts, parking, gym, and clubhouse — is the RWA\'s responsibility and shall remain operational throughout the tenancy. Lift downtime exceeding 72 consecutive hours in a building above the 5th floor shall entitle the Tenant to a daily rent rebate of ₹200. The Landlord shall escalate unresolved maintenance complaints to the RWA management committee within 5 working days of the Tenant\'s written request. Persistent common area neglect shall constitute grounds for early termination without penalty.',
        riskAddressed: 'Common area maintenance delays',
        priority: 'recommended',
      },
    ],
  },
};

// Default fallback for unknown societies
const DEFAULT_MOCK: MockAuditPayload = {
  riskScore: 55,
  verdictSummary:
    'This society presents moderate tenant risk based on aggregated community signals. Key areas of concern include water supply reliability and security deposit refund practices. Prospective tenants are advised to negotiate protective clauses before signing.',
  categoryBreakdowns: {
    waterSecurity: 58,
    depositSafety: 60,
    civicInfra: 50,
    rwaRules: 52,
  },
  tailoredClauses: [
    {
      clauseNumber: 'Clause 1',
      title: 'Water Supply Guarantee',
      body:
        'The Landlord warrants uninterrupted water supply to the premises. In the event of supply failure exceeding 48 hours, the Landlord shall arrange alternative supply at no cost to the Tenant.',
      riskAddressed: 'Water supply reliability',
      priority: 'must-have',
    },
    {
      clauseNumber: 'Clause 2',
      title: 'Security Deposit Refund Timeline',
      body:
        'The security deposit shall be refunded within 21 days of vacating. Deductions must be itemised with supporting evidence. Normal wear and tear shall not be deductible.',
      riskAddressed: 'Deposit refund delays',
      priority: 'must-have',
    },
    {
      clauseNumber: 'Clause 3',
      title: 'Maintenance Charge Transparency',
      body:
        'All maintenance charges shall be disclosed prior to lease signing. Any increase exceeding 10% per annum requires 30 days\' written notice and the Tenant\'s written consent.',
      riskAddressed: 'Opaque maintenance billing',
      priority: 'recommended',
    },
  ],
};

// ─── Public API ───────────────────────────────────────────────────────────────

export async function analyzeRiskWithGemini(
  auditData: SocietyAuditData
): Promise<GeminiRiskAnalysis | null> {
  // Simulate 600ms analysis delay — no external API call
  await new Promise(resolve => setTimeout(resolve, 600));

  const mock = SOCIETY_MOCK_DATA[auditData.societyId] ?? DEFAULT_MOCK;

  return {
    overallRiskScore: mock.riskScore,
    verdictSummary: mock.verdictSummary,
    categoryScores: mock.categoryBreakdowns,
    topThreeRedFlags: auditData.redFlags.slice(0, 3).map(f => `${f.title}: ${f.body.split('.')[0]}.`),
  };
}

export async function generateLeaseClausesWithGemini(
  auditData: SocietyAuditData,
  _riskAnalysis: GeminiRiskAnalysis
): Promise<GeminiLeaseClause[] | null> {
  // Simulate 600ms clause generation delay — no external API call
  await new Promise(resolve => setTimeout(resolve, 600));

  const mock = SOCIETY_MOCK_DATA[auditData.societyId] ?? DEFAULT_MOCK;
  return mock.tailoredClauses;
}

// ─── Merge helpers (unchanged) ────────────────────────────────────────────────

export function mergeGeminiRiskIntoAuditData(
  auditData: SocietyAuditData,
  riskAnalysis: GeminiRiskAnalysis
): SocietyAuditData {
  const { overallRiskScore, categoryScores, verdictSummary } = riskAnalysis;

  const getRiskLevel = (score: number): SocietyAuditData['riskLevel'] => {
    if (score <= 35) return 'safe';
    if (score <= 65) return 'moderate';
    return 'critical';
  };

  const updatedCategories: CategoryScore[] = auditData.categories.map(cat => {
    let newScore = cat.score;
    if (cat.id === 'cat-water') newScore = categoryScores.waterSecurity;
    else if (cat.id === 'cat-deposit') newScore = categoryScores.depositSafety;
    else if (cat.id === 'cat-civic') newScore = categoryScores.civicInfra;
    else if (cat.id === 'cat-rwa') newScore = categoryScores.rwaRules;
    return {
      ...cat,
      score: Math.min(100, Math.max(0, Math.round(newScore))),
      level: getRiskLevel(newScore),
    };
  });

  return {
    ...auditData,
    tenantRiskIndex: Math.min(100, Math.max(0, Math.round(overallRiskScore))),
    riskLevel: getRiskLevel(overallRiskScore),
    riskSummary: verdictSummary.split('.')[0].trim(),
    categories: updatedCategories,
  };
}

export function mergeGeminiClausesIntoAuditData(
  auditData: SocietyAuditData,
  geminiClauses: GeminiLeaseClause[]
): SocietyAuditData {
  const leaseClauses: LeaseClause[] = geminiClauses.map((c, i) => ({
    id: `ai-clause-${auditData.societyId}-${i + 1}`,
    clauseNumber: c.clauseNumber,
    title: c.title,
    body: c.body,
    riskAddressed: c.riskAddressed,
    priority: c.priority,
  }));

  return { ...auditData, leaseClauses };
}
