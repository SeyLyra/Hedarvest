export interface WarehouseInfo {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude?: number;
  longitude?: number;
  capacity: number; // in tons
  available: number; // in tons
  utilization: number; // percentage
  services: string[];
  contact: {
    phone: string;
    email: string;
    manager: string;
  };
  operatingHours: {
    weekdays: string;
    weekends: string;
  };
  features: string[];
  pricing: {
    storage: number; // per ton per month
    handling: number; // per ton
  };
  certifications: string[];
  status: 'available' | 'full' | 'maintenance';
  rating: number;
}

export const WAREHOUSES: WarehouseInfo[] = [
  {
    id: 'WH001',
    name: 'Green Valley Storage',
    address: '123 Farm Road',
    city: 'Agricultural City',
    state: 'Farm State',
    country: 'Indonesia',
    latitude: -6.2088,
    longitude: 106.8456,
    capacity: 1000,
    available: 250,
    utilization: 75,
    services: ['Storage', 'Quality Testing', 'Insurance', 'Transportation'],
    contact: {
      phone: '+62 21 1234 5678',
      email: 'info@greenvalley.com',
      manager: 'John Smith',
    },
    operatingHours: {
      weekdays: '6:00 AM - 8:00 PM',
      weekends: '8:00 AM - 6:00 PM',
    },
    features: [
      'Climate Control',
      '24/7 Security',
      'Quality Lab',
      'Loading Dock',
    ],
    pricing: {
      storage: 15,
      handling: 5,
    },
    certifications: ['ISO 9001', 'Food Safety', 'Organic Certified'],
    status: 'available',
    rating: 4.8,
  },
  {
    id: 'WH002',
    name: 'Central Grain Hub',
    address: '456 Industrial Blvd',
    city: 'Central City',
    state: 'Farm State',
    country: 'Indonesia',
    latitude: -6.2146,
    longitude: 106.8451,
    capacity: 2000,
    available: 0,
    utilization: 100,
    services: ['Storage', 'Quality Testing', 'Insurance'],
    contact: {
      phone: '+62 21 2345 6789',
      email: 'contact@centralgrain.com',
      manager: 'Sarah Johnson',
    },
    operatingHours: {
      weekdays: '7:00 AM - 7:00 PM',
      weekends: '9:00 AM - 5:00 PM',
    },
    features: ['Climate Control', 'Security', 'Quality Lab'],
    pricing: {
      storage: 12,
      handling: 4,
    },
    certifications: ['ISO 9001', 'Food Safety'],
    status: 'full',
    rating: 4.6,
  },
  {
    id: 'WH003',
    name: 'Premium Storage Solutions',
    address: '789 Storage Lane',
    city: 'Storage City',
    state: 'Farm State',
    country: 'Indonesia',
    latitude: -6.2297,
    longitude: 106.8206,
    capacity: 1500,
    available: 600,
    utilization: 60,
    services: [
      'Storage',
      'Quality Testing',
      'Insurance',
      'Transportation',
      'Processing',
    ],
    contact: {
      phone: '+62 21 3456 7890',
      email: 'premium@storage.com',
      manager: 'Mike Davis',
    },
    operatingHours: {
      weekdays: '5:00 AM - 9:00 PM',
      weekends: '7:00 AM - 7:00 PM',
    },
    features: [
      'Climate Control',
      '24/7 Security',
      'Quality Lab',
      'Loading Dock',
      'Cold Storage',
    ],
    pricing: {
      storage: 18,
      handling: 6,
    },
    certifications: ['ISO 9001', 'Food Safety', 'Organic Certified', 'HACCP'],
    status: 'available',
    rating: 4.9,
  },
  {
    id: 'WH004',
    name: 'Rural Storage Co-op',
    address: '321 Country Road',
    city: 'Rural Town',
    state: 'Farm State',
    country: 'Indonesia',
    latitude: -6.1751,
    longitude: 106.8650,
    capacity: 800,
    available: 200,
    utilization: 75,
    services: ['Storage', 'Quality Testing', 'Insurance'],
    contact: {
      phone: '+62 21 4567 8901',
      email: 'coop@ruralstorage.com',
      manager: 'Lisa Brown',
    },
    operatingHours: {
      weekdays: '8:00 AM - 6:00 PM',
      weekends: '9:00 AM - 4:00 PM',
    },
    features: ['Climate Control', 'Security', 'Quality Lab'],
    pricing: {
      storage: 10,
      handling: 3,
    },
    certifications: ['Food Safety', 'Organic Certified'],
    status: 'available',
    rating: 4.4,
  },
];
