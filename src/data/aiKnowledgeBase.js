/**
 * Local AI Hotel Analyst response engine
 * Answers are computed live from seedData.js (no backend inference call required),
 * so every response reflects whatever numbers currently live in the mock dataset.
 */

import seedData from './seedData';

const maxBy = (arr, fn) => arr.reduce((best, item) => (fn(item) > fn(best) ? item : best), arr[0]);
const minBy = (arr, fn) => arr.reduce((worst, item) => (fn(item) < fn(worst) ? item : worst), arr[0]);

const pct = (n) => `${n > 0 ? '+' : ''}${n}%`;

function findMentionedBranch(query) {
  // "Other" is excluded — it's too generic an English word to reliably match as a branch name.
  return seedData.branches.find((b) => {
    if (b.key === 'Other') return false;
    return query.includes(b.name.toLowerCase()) || query.includes(b.key.toLowerCase());
  });
}

function branchBrief(b) {
  return {
    title: `${b.name} Branch Brief`,
    summary: `${b.name} (${b.subTitle}) is currently rated "${b.operationalStatus}" with ${b.occupancyRate}% occupancy.`,
    positive: [
      `Revenue: ₹${b.revenueLakhs}L (${pct(b.growthPercent)} week-over-week)`,
      `${b.roomsOccupied}/${b.roomsTotal} rooms occupied (${b.occupancyRate}%)`,
      `${b.bookingsCount} bookings and ${b.foodOrdersCount} F&B orders this week`,
      `Guest rating: ${b.rating} ⭐ across ${b.staffCount} staff on duty`
    ],
    needsAttention: b.growthIsPositive ? [] : [`Growth is down ${pct(b.growthPercent)} week-over-week — flagged as "${b.operationalStatus}"`],
    recommendation: b.executiveNotes
  };
}

function topBranchResponse() {
  const top = maxBy(seedData.branches, (b) => b.revenueLakhs);
  const topOccupancy = maxBy(seedData.branches, (b) => b.occupancyRate);
  return {
    title: 'Top Performing Branch This Week',
    summary: `${top.name} leads the group with ₹${top.revenueLakhs}L in revenue (${pct(top.growthPercent)} WoW).`,
    positive: [
      `Revenue: ₹${top.revenueLakhs}L (${pct(top.growthPercent)} WoW growth)`,
      `Occupancy: ${top.occupancyRate}% (${top.roomsOccupied}/${top.roomsTotal} rooms)`,
      `${top.foodOrdersCount} F&B orders with a ${top.rating} ⭐ guest rating`,
      `${topOccupancy.name} has the group's highest occupancy at ${topOccupancy.occupancyRate}%`
    ],
    needsAttention: [],
    recommendation: top.executiveNotes
  };
}

function attentionBranchesResponse() {
  const flagged = seedData.branches.filter((b) => b.operationalStatus === 'Needs Attention');
  if (flagged.length === 0) {
    return {
      title: 'No Branches Currently Flagged',
      summary: 'All 8 branches are operating within healthy performance ranges this week.',
      positive: ['No branch is currently marked "Needs Attention"'],
      needsAttention: [],
      recommendation: 'Continue monitoring daily occupancy and cancellation rates for early warning signs.'
    };
  }
  return {
    title: 'Branches Requiring Management Attention',
    summary: `${flagged.length} branch${flagged.length > 1 ? 'es are' : ' is'} currently flagged for operational attention.`,
    positive: seedData.branches
      .filter((b) => b.growthIsPositive)
      .slice(0, 2)
      .map((b) => `${b.name} is holding steady at ${b.occupancyRate}% occupancy`),
    needsAttention: flagged.map(
      (b) => `${b.name}: ${b.occupancyRate}% occupancy (${pct(b.growthPercent)} WoW) — ${b.executiveNotes}`
    ),
    recommendation: seedData.alerts.find((a) => a.priority !== 'POSITIVE')?.recommendation
      || 'Review pricing and cancellation policy for the flagged branches.'
  };
}

function revenueResponse() {
  const { kpis, revenueBreakdown } = seedData;
  return {
    title: 'Weekly Group Revenue Summary',
    summary: `Poppys Hotels generated ₹${kpis.revenueLakhs}L in total revenue this week (${pct(kpis.revenueGrowth)} WoW).`,
    positive: revenueBreakdown.streams.map(
      (s) => `${s.stream}: ₹${s.amountLakhs}L (${s.percent}% share)`
    ),
    needsAttention: (() => {
      const smallest = minBy(revenueBreakdown.streams, (s) => s.percent);
      return [`${smallest.stream} contributes only ${smallest.percent}% of total revenue`];
    })(),
    recommendation: 'Maintain the current rate card and enforce dynamic weekend pricing surges.'
  };
}

function roomCategoryResponse() {
  const { roomCategories } = seedData;
  const top = roomCategories.find((c) => c.isTopSeller) || maxBy(roomCategories, (c) => c.revenueLakhs);
  const weakest = minBy(roomCategories, (c) => c.occupancyPercent);
  return {
    title: 'Room Category Profitability Analysis',
    summary: `${top.name} is the #1 profit generator across Poppys Hotels, with ₹${top.revenueLakhs}L in revenue.`,
    positive: [
      `${top.name}: ₹${top.revenueLakhs}L revenue (${top.occupancyPercent}% occupancy, ${top.occupied}/${top.totalRooms} rooms)`,
      `Average Daily Rate (ADR): ₹${top.averagePrice.toLocaleString('en-IN')}`,
      `${roomCategories.length} room categories tracked across the group`
    ],
    needsAttention: [`${weakest.name} occupancy is lagging at ${weakest.occupancyPercent}%`],
    recommendation: `Package ${weakest.name} rooms with added perks (dining/spa credit) to lift weekend leisure demand.`
  };
}

function restaurantResponse() {
  const { restaurant } = seedData;
  const peakDay = maxBy(restaurant.pastWeekOrders, (d) => d.orders);
  const totalOrders = restaurant.pastWeekOrders.reduce((sum, d) => sum + d.orders, 0);
  return {
    title: 'Restaurant & F&B Intelligence',
    summary: `Past week generated ${totalOrders.toLocaleString('en-IN')} orders, peaking on ${peakDay.day} with ${peakDay.orders} orders.`,
    positive: restaurant.topFoodItems.map(
      (item) => `${item.rank}. ${item.name} — ${item.count} orders`
    ),
    needsAttention: ['Continental menu items show slower turnover in hill station outlets'],
    recommendation: `Feature ${restaurant.topFoodItems[0].name} prominently across all branch dining menus — it's the group's top seller.`
  };
}

function bookingsResponse() {
  const { bookingTypes, bookingTrend7Days, kpis } = seedData;
  const topChannel = maxBy(bookingTypes, (c) => c.percent);
  const peakDay = maxBy(bookingTrend7Days, (d) => d.count);
  return {
    title: 'Booking Channels & Demand Pace',
    summary: `${kpis.bookingsCount.toLocaleString('en-IN')} bookings this week (${pct(kpis.bookingsGrowth)} WoW), led by ${topChannel.channel} at ${topChannel.percent}%.`,
    positive: bookingTypes.map((c) => `${c.channel}: ${c.percent}% (${c.count} bookings)`),
    needsAttention: [`${peakDay.day} is the peak booking day (${peakDay.count}) — ensure front-desk staffing scales accordingly`],
    recommendation: 'Keep investing in the direct-website channel — it converts at the lowest acquisition cost.'
  };
}

function staffResponse() {
  const { staff } = seedData;
  const topDept = maxBy(staff.breakdown, (d) => d.count);
  return {
    title: 'Workforce & Staff Deployment',
    summary: `${staff.total} staff currently on duty across the group, at a ${staff.ratio} staff-to-guest ratio.`,
    positive: staff.breakdown.map((d) => `${d.department}: ${d.count} staff (${d.percent}%)`),
    needsAttention: [],
    recommendation: `${topDept.department} is the largest department (${topDept.count} staff) — prioritize it for scheduling and training investment.`
  };
}

function guestExperienceResponse() {
  const { guestExperience } = seedData;
  const weakest = minBy(guestExperience.categories, (c) => c.score);
  return {
    title: 'Guest Experience & Sentiment',
    summary: `Overall guest satisfaction stands at ${guestExperience.overallRating} / 5 across all branches.`,
    positive: guestExperience.categories.map((c) => `${c.name}: ${c.score} / 5 (${c.percent}%)`).concat(
      guestExperience.positiveFeedback.map((f) => `Guests praise: "${f}"`)
    ),
    needsAttention: guestExperience.needsImprovement.map((n) => `Feedback flag: "${n}"`),
    recommendation: `${weakest.name} scores lowest at ${weakest.score}/5 — prioritize it in the next service-quality review.`
  };
}

function occupancyForecastResponse() {
  const { occupancyForecast } = seedData;
  const peak = maxBy(occupancyForecast.days, (d) => d.occupancy);
  const dip = minBy(occupancyForecast.days, (d) => d.occupancy);
  return {
    title: '7-Day Occupancy Forecast',
    summary: `Occupancy is forecast to peak at ${peak.occupancy}% on ${peak.day} and dip to ${dip.occupancy}% on ${dip.day}.`,
    positive: occupancyForecast.days
      .filter((d) => d.occupancy >= 75)
      .map((d) => `${d.day}: ${d.occupancy}% (${d.status})`),
    needsAttention: occupancyForecast.days
      .filter((d) => d.occupancy < 70)
      .map((d) => `${d.day}: ${d.occupancy}% (${d.status})`),
    recommendation: occupancyForecast.aiRecommendation
  };
}

function alertsResponse() {
  const active = seedData.alerts.filter((a) => !a.isAcknowledged);
  if (active.length === 0) {
    return {
      title: 'No Active Alerts',
      summary: 'All operational alerts have been acknowledged.',
      positive: ['Alert queue is clear'],
      needsAttention: [],
      recommendation: 'Keep monitoring daily KPIs for new anomalies.'
    };
  }
  return {
    title: 'Active Operational Alerts',
    summary: `${active.length} alert${active.length > 1 ? 's are' : ' is'} currently active and awaiting action.`,
    positive: active.filter((a) => a.priority === 'POSITIVE').map((a) => `${a.branchName}: ${a.description}`),
    needsAttention: active.filter((a) => a.priority !== 'POSITIVE').map((a) => `[${a.priority}] ${a.branchName}: ${a.description}`),
    recommendation: active[0].recommendation
  };
}

function recommendationsResponse() {
  const { occupancyForecast, alerts } = seedData;
  const actionItems = alerts.filter((a) => a.priority !== 'POSITIVE').map((a) => `${a.branchName}: ${a.recommendation}`);
  return {
    title: 'Executive Recommendations for Next Week',
    summary: 'Strategic roadmap synthesized from current occupancy, alerts, and revenue trends.',
    positive: [occupancyForecast.aiRecommendation],
    needsAttention: actionItems,
    recommendation: actionItems[0] || occupancyForecast.aiRecommendation
  };
}

function defaultResponse(question) {
  const { kpis } = seedData;
  const flaggedCount = seedData.branches.filter((b) => b.operationalStatus === 'Needs Attention').length;
  return {
    title: `Executive Intelligence for "${question}"`,
    summary: `Group occupancy is at ${kpis.occupancyRate}% (${pct(kpis.occupancyGrowth)} WoW) with ₹${kpis.revenueLakhs}L in revenue (${pct(kpis.revenueGrowth)} WoW).`,
    positive: [
      `Revenue up ${pct(kpis.revenueGrowth)} (₹${kpis.revenueLakhs}L total)`,
      `Occupancy up ${pct(kpis.occupancyGrowth)} (${kpis.occupancyRate}% avg)`,
      `Food orders up ${pct(kpis.foodGrowth)} (${kpis.foodOrdersCount.toLocaleString('en-IN')} total)`
    ],
    needsAttention: flaggedCount > 0 ? [`${flaggedCount} branch${flaggedCount > 1 ? 'es are' : ' is'} currently flagged "Needs Attention"`] : [],
    recommendation: 'Ask about a specific branch, revenue, bookings, staff, guest experience, or the occupancy forecast for a deeper brief.'
  };
}

export function getWelcomeBrief() {
  const { kpis, occupancyForecast } = seedData;
  const flagged = seedData.branches.filter((b) => b.operationalStatus === 'Needs Attention');
  return {
    title: 'Good day, Manager!',
    summary: `Overall hotel performance is at ${kpis.occupancyRate}% occupancy with ₹${kpis.revenueLakhs}L in revenue (${pct(kpis.revenueGrowth)} WoW).`,
    positive: [
      `Revenue increased ${pct(kpis.revenueGrowth)} (₹${kpis.revenueLakhs}L this week)`,
      `Occupancy up ${pct(kpis.occupancyGrowth)} group-wide (${kpis.occupancyRate}% avg)`,
      `Food & Restaurant orders up ${pct(kpis.foodGrowth)} (${kpis.foodOrdersCount.toLocaleString('en-IN')} total)`
    ],
    needsAttention: flagged.map((b) => `${b.name}: ${b.executiveNotes}`),
    recommendation: occupancyForecast.aiRecommendation
  };
}

export function answerAiQuery(question) {
  const query = question.toLowerCase();

  const mentionedBranch = findMentionedBranch(query);
  if (mentionedBranch) return branchBrief(mentionedBranch);

  if (query.includes('best') || query.includes('top branch') || query.includes('top perform')) {
    return topBranchResponse();
  }
  if (query.includes('attention') || query.includes('worst') || query.includes('problem') || query.includes('underperform')) {
    return attentionBranchesResponse();
  }
  if (query.includes('alert') || query.includes('anomal')) {
    return alertsResponse();
  }
  if (query.includes('forecast') || query.includes('next week') && query.includes('occup') || query.includes('tomorrow') || query.includes('weekend')) {
    return occupancyForecastResponse();
  }
  if (query.includes('recommend') || query.includes('strategy') || query.includes('advice') || query.includes('next week')) {
    return recommendationsResponse();
  }
  if (query.includes('staff') || query.includes('employee') || query.includes('workforce') || query.includes('headcount')) {
    return staffResponse();
  }
  if (query.includes('guest') || query.includes('satisfaction') || query.includes('review') || query.includes('feedback') || query.includes('sentiment')) {
    return guestExperienceResponse();
  }
  if (query.includes('book') || query.includes('channel') || query.includes('ota') || query.includes('direct website')) {
    return bookingsResponse();
  }
  if (query.includes('room') || query.includes('categor') || query.includes('profitable') || query.includes('deluxe') || query.includes('suite')) {
    return roomCategoryResponse();
  }
  if (query.includes('food') || query.includes('restaurant') || query.includes('dish') || query.includes('biryani') || query.includes('menu')) {
    return restaurantResponse();
  }
  if (query.includes('revenue') || query.includes('money') || query.includes('earning') || query.includes('income')) {
    return revenueResponse();
  }

  return defaultResponse(question);
}
