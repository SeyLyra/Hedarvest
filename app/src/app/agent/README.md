# Agent Management Page

A comprehensive React/Next.js component for managing agents, farmers, and collateral in the Hedarvest platform.

## Features

### 1. Register Agent
- **Form fields**: agentName, email, phoneNumber
- **API Integration**: POST /api/agents/register
- **Success/Error handling**: Toast notifications
- **Real-time updates**: Agent list refreshes after registration

### 2. Register Farmer (linked to Agent)
- **Agent Selection**: Dropdown populated from registered agents
- **Form fields**: farmerName, nationalId, phoneNumber
- **API Integration**: POST /api/farmers/register
- **Farmer Lists**: Organized by agent with clear grouping

### 3. Collateral Management
- **Farmer Selection**: Dropdown with farmer details and agent info
- **Form fields**: cropType, amountKg
- **Token Minting**: 1 kg = 1 token (HTS tokens)
- **Comprehensive Table**: Shows farmer, agent, crop types, amounts, and token balances
- **Real-time Updates**: Table refreshes after adding collateral

## Technical Implementation

### State Management
- **React Query**: For data fetching, caching, and synchronization
- **Optimistic Updates**: Immediate UI updates with server synchronization
- **Error Handling**: Comprehensive error states and user feedback

### API Integration
- **Axios-style**: Using native fetch with proper error handling
- **Type Safety**: Full TypeScript interfaces for all data structures
- **Mock API**: Collateral endpoint for demonstration purposes

### UI/UX
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Clean Dashboard**: Card-based layout with proper spacing
- **Loading States**: Skeleton loaders and spinner indicators
- **Form Validation**: Client-side validation with user-friendly messages

### Navigation
- **Sidebar Navigation**: Clean three-section layout
- **Active States**: Visual feedback for current section
- **Smooth Transitions**: Hover effects and state changes

## Data Flow

1. **Agent Registration**: Form → API → Success Toast → Query Invalidation → UI Update
2. **Farmer Registration**: Agent Selection → Form → API → Success Toast → Query Invalidation → UI Update
3. **Collateral Addition**: Farmer Selection → Form → API → Success Toast → Query Invalidation → UI Update

## API Endpoints

- `GET /api/agents` - Fetch all agents
- `POST /api/agents/register` - Register new agent
- `GET /api/farmers` - Fetch all farmers
- `POST /api/farmers/register` - Register new farmer
- `GET /api/collateral` - Fetch all collateral
- `POST /api/collateral` - Add new collateral

## Usage

Navigate to `/agent` to access the Agent Management Portal. The page is fully functional with mock data and can be easily integrated with real backend APIs by updating the API endpoints in the component.
