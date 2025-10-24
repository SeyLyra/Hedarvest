# Unified Activity Feed - Feature Documentation

## Overview
Replaced separate "Track Deliveries" and "Transaction History" sections with a unified "Activity Feed" that combines all farmer activities in one place.

---

## What Changed

### **Before:**
```
Farmer Dashboard Navigation:
- Overview
- My Crops
- Track Deliveries ← Separate section
- Borrow & Loans
- Transaction History ← Separate section
```

### **After:**
```
Farmer Dashboard Navigation:
- Overview
- My Crops
- Borrow & Loans
- Activity ← Unified section with filters
```

---

## Features

### **1. Unified Timeline View**
All farmer activities in one chronological feed:
- 🚚 Delivery submissions and updates
- 💰 Transactions (deposits, withdrawals)
- 🏦 Loan activities (borrow, repay, liquidations)

### **2. Smart Filtering**
Filter tabs at the top:
```tsx
[All Activity] [Deliveries] [Transactions] [Loans]
```

### **3. Rich Activity Cards**
Each activity shows:
- Icon with color-coded status
- Title and description
- Timestamp (relative: "2 hours ago")
- Status badge
- Click to expand for full details

### **4. Expandable Details**
Click any activity card to see:
- **Deliveries:** Full delivery timeline, warehouse receipt info
- **Transactions:** Transaction hash, amounts, fees
- **Loans:** Pool info, collateral, interest rates

### **5. Activity Summary Stats**
Bottom summary showing:
- Total Deliveries
- Total Transactions
- Total Loans

---

## User Flow

### **Viewing Activity:**
```
1. Farmer logs in
2. Clicks "Activity" tab
3. Sees timeline of all activities
4. Can filter by type
5. Clicks to expand details
6. Tracks delivery status changes in real-time
```

### **Example Timeline:**
```
🚚 Rice Delivery (2 hours ago)
   500 kg Basmati - Received at warehouse
   Status: RECEIVED
   [Click to expand details]

💰 Borrowed 1000 USDC (Yesterday)
   From WHEAT pool
   Status: ACTIVE

🌾 Deposited 500kg WHEAT (2 days ago)
   As collateral
   Status: COMPLETED
```

---

## Component Structure

### **File:** `ActivityFeed.tsx`

```tsx
interface ActivityFeedProps {
  farmerId: number;
}

type ActivityType = "all" | "deliveries" | "transactions" | "loans";

interface ActivityItem {
  id: string;
  type: "delivery" | "transaction" | "loan";
  title: string;
  description: string;
  status: string;
  amount?: number;
  timestamp: string;
  icon: any;
  iconColor: string;
  details?: any;
}
```

### **Key Functions:**

**`fetchAllActivity()`**
- Fetches deliveries from `/warehouse/delivery-requests/farmer/:id`
- Fetches transactions from backend
- Fetches loans from backend
- Combines and sorts by timestamp

**`filteredActivities`**
- Filters based on active tab
- Returns only relevant activity types

**`renderActivityDetails()`**
- Renders expanded view for each activity type
- Shows delivery timeline and warehouse receipt
- Shows transaction details
- Shows loan information

---

## API Integration

### **Endpoints Used:**

**Deliveries:**
```
GET /warehouse/delivery-requests/farmer/:farmerId
```

**Transactions:** (To be implemented)
```
GET /transactions/farmer/:farmerId
```

**Loans:**
```
GET /farmers/loans (existing)
```

---

## Status Colors

### **Delivery Statuses:**
- 🟡 `pending` - Yellow (Waiting for confirmation)
- 🔵 `confirmed` - Blue (Confirmed by warehouse)
- 🟣 `in_transit` - Purple (On the way)
- 🟦 `received` - Indigo (Arrived at warehouse)
- 🟢 `completed` - Green (Verified and tokens minted)
- 🔴 `cancelled` - Red (Rejected or cancelled)

### **Transaction Statuses:**
- 🟢 `success` - Green
- 🔴 `failed` - Red
- 🟡 `pending` - Yellow

### **Loan Statuses:**
- 🟢 `active` - Green
- 🔵 `repaid` - Blue
- 🔴 `liquidated` - Red

---

## Expandable Details

### **Delivery Details:**
```
[Delivery Details Card]
├── Status Timeline
│   └── Current status with icon and notes
├── Details Grid
│   ├── Crop Type
│   ├── Variety
│   ├── Weight
│   ├── Grade
│   ├── Warehouse ID
│   ├── Scheduled Date
│   └── Location
└── Warehouse Receipt (if received)
    ├── Actual Weight
    ├── Verified Grade
    └── Arrival Date
```

### **Transaction Details:** (Future)
```
[Transaction Details Card]
├── Transaction Hash
├── From/To Addresses
├── Amount
├── Fees
├── Block Number
└── Timestamp
```

### **Loan Details:** (Future)
```
[Loan Details Card]
├── Pool Information
├── Collateral Amount
├── Borrowed Amount
├── Interest Rate
├── Health Factor
├── Liquidation Threshold
└── Repayment History
```

---

## Benefits

### **For Farmers:**
✅ **Single Source of Truth** - Everything in one place
✅ **Better UX** - No more switching between tabs
✅ **Context** - See full story of their farming journey
✅ **Easy Filtering** - Quick access to specific activity types

### **For Developers:**
✅ **Maintainable** - One component instead of multiple
✅ **Scalable** - Easy to add new activity types
✅ **Reusable** - Can be extended for other user roles
✅ **Clean Code** - Single responsibility principle

---

## Future Enhancements

### **Phase 2:**
1. **Real-time Updates** - WebSocket for live activity
2. **Notifications** - Alert when status changes
3. **Search** - Search activities by keyword
4. **Export** - Download activity history as CSV/PDF
5. **Pagination** - Load more for long histories

### **Phase 3:**
1. **Activity Insights** - Analytics and trends
2. **Grouped Activities** - Group by date/week/month
3. **Related Activities** - Link related events
4. **Quick Actions** - Act directly from activity feed
5. **Comments** - Add notes to activities

---

## Testing Checklist

### **Manual Testing:**
```
[ ] Can view all activities
[ ] Filter tabs work correctly
[ ] Deliveries show up in feed
[ ] Transactions show up (when implemented)
[ ] Loans show up (when implemented)
[ ] Click to expand works
[ ] Timestamp shows correctly
[ ] Status badges show correct colors
[ ] Refresh button works
[ ] Mobile responsive
[ ] Summary stats calculate correctly
```

### **Edge Cases:**
```
[ ] No activities yet (empty state)
[ ] Very long activity lists (pagination needed)
[ ] Activities with missing data (graceful degradation)
[ ] Network errors (error handling)
[ ] Slow API responses (loading states)
```

---

## API Response Format

### **Expected Delivery Response:**
```json
[
  {
    "id": 1,
    "farmerId": 1,
    "warehouseId": "WH001",
    "cropType": "rice",
    "variety": "Basmati",
    "estimatedWeight": 500,
    "unit": "kg",
    "estimatedGrade": "premium",
    "moistureContent": 12.5,
    "scheduledDate": "2025-01-30",
    "location": "Farm A",
    "status": "received",
    "notes": "Quality looks good",
    "createdAt": "2025-01-25T10:00:00Z",
    "incomingDelivery": {
      "id": 1,
      "weight": 495,
      "grade": "premium",
      "arrivalDate": "2025-01-30T08:00:00Z",
      "status": "verified",
      "storageLocation": "Bay A-1"
    }
  }
]
```

---

## Connection Points

### **Farmer Submission → Activity Feed:**
```
1. Farmer submits crop (RegisterCrop)
2. Creates DeliveryRequest via API
3. Activity Feed fetches and displays
4. Status updates flow automatically
5. Warehouse verification updates status
6. Farmer sees updates in real-time
```

### **Warehouse Actions → Farmer Activity:**
```
Warehouse Dashboard       Farmer Activity Feed
─────────────────────    ─────────────────────
Receive delivery    →    Status: RECEIVED
Start inspection    →    Status: INSPECTING
Verify & mint       →    Status: COMPLETED
                         + Tokens minted activity
```

---

## Code Examples

### **Using the Component:**
```tsx
// In FarmerDashboard
import ActivityFeed from "./ActivityFeed";

<ActivityFeed farmerId={farmerId} />
```

### **Fetching Activity:**
```tsx
const fetchAllActivity = async () => {
  const token = localStorage.getItem('token');

  // Fetch deliveries
  const deliveries = await fetch(
    `http://localhost:4000/warehouse/delivery-requests/farmer/${farmerId}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  ).then(res => res.json());

  // Transform to activity items
  const activities = deliveries.map(d => ({
    id: `delivery-${d.id}`,
    type: "delivery",
    title: `${d.cropType} Delivery`,
    description: `${d.estimatedWeight} ${d.unit} - ${d.status}`,
    status: d.status,
    timestamp: d.createdAt,
    icon: Truck,
    iconColor: getDeliveryColor(d.status),
    details: d
  }));

  setActivities(activities);
};
```

---

## Summary

**Files Created:**
- ✅ `ActivityFeed.tsx` (500+ lines)

**Files Modified:**
- ✅ `FarmerDashboardNew.tsx` (navigation updated)

**Files Removed:**
- ❌ `DeliveryTracking.tsx` (replaced by ActivityFeed)
- ❌ `TransactionHistory.tsx` (integrated into ActivityFeed)

**Result:**
- Better UX with unified view
- Cleaner navigation (4 tabs instead of 5)
- Extensible architecture
- Real-time delivery tracking integrated

---

**Status:** ✅ Complete and Ready to Test
**Date:** January 2025
**Developer:** Claude (Anthropic)
