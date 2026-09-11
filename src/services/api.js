/**
 * Local Data Service for Poppys Hotels Management & AI Analytics Dashboard
 * Serves the app's seed data directly in-browser — no backend server required.
 */

import seedData from '../data/seedData';
import { answerAiQuery } from '../data/aiKnowledgeBase';

const clone = (value) => JSON.parse(JSON.stringify(value));

export const api = {
  // 1. Fetch Aggregated / Branch KPIs
  async getKpis(branch = 'all') {
    if (!branch || branch === 'all') {
      return clone(seedData.kpis);
    }

    const target = seedData.branches.find((b) => b.key.toLowerCase() === branch.toLowerCase());
    if (!target) return null;

    return {
      totalBranches: 1,
      totalRooms: target.roomsTotal,
      occupiedRooms: target.roomsOccupied,
      occupancyRate: target.occupancyRate,
      occupancyGrowth: target.growthPercent,
      revenueLakhs: target.revenueLakhs,
      revenueGrowth: target.growthPercent,
      bookingsCount: target.bookingsCount,
      bookingsGrowth: Math.round(target.growthPercent * 0.9),
      foodOrdersCount: target.foodOrdersCount,
      foodGrowth: Math.round(target.growthPercent * 1.1),
      staffCount: target.staffCount,
      staffGrowth: 1.5,
      guestRating: target.rating,
      ratingGrowth: 2.1,
      branchName: target.name,
      isMock: true
    };
  },

  // 2. Fetch All Branches
  async getBranches() {
    return clone(seedData.branches);
  },

  // 3. Fetch AI Alerts
  async getAlerts() {
    return clone(seedData.alerts);
  },

  // 4. Acknowledge Alert
  async acknowledgeAlert(alertId) {
    const alert = seedData.alerts.find((a) => a.alertId === alertId);
    if (alert) {
      alert.isAcknowledged = true;
      return { success: true, data: clone(alert) };
    }
    return { success: false, message: 'Alert not found' };
  },

  // 5. Fetch Occupancy 7-Day Trend
  async getOccupancyTrend() {
    return clone(seedData.occupancyTrend);
  },

  // 6. Fetch Bookings Breakdown
  async getBookings() {
    return {
      success: true,
      types: clone(seedData.bookingTypes),
      sevenDayPace: clone(seedData.bookingTrend7Days),
      totalBookings: 1284,
      wowGrowth: 16.5
    };
  },

  // 7. Fetch Room Categories
  async getRoomCategories() {
    return clone(seedData.roomCategories);
  },

  // 8. Fetch Restaurant & Food Analytics
  async getRestaurantData() {
    return clone(seedData.restaurant);
  },

  // 9. Fetch Staff Analytics
  async getStaffData() {
    return clone(seedData.staff);
  },

  // 10. Fetch Revenue Breakdown
  async getRevenueBreakdown() {
    return clone(seedData.revenueBreakdown);
  },

  // 11. Fetch Guest Experience
  async getGuestExperience() {
    return clone(seedData.guestExperience);
  },

  // 12. Fetch Occupancy Forecast
  async getOccupancyForecast() {
    return clone(seedData.occupancyForecast);
  },

  // 13. Query AI Hotel Analyst
  async queryAi(question) {
    if (!question) return null;
    return answerAiQuery(question);
  }
};
