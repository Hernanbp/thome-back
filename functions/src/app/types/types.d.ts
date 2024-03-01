export interface User {
  id: string;
  alias: string;
  email: string;
  name: string;
  surname: string;
  registrationNumber?: number;
  phoneNumber: number;
  address?: string;
  roles: string[];
  status: "COMPLETED" | "PENDING";
}

export interface Property {
  id?: string;
  ownerId: string;
  description: string;
  purpose: "sell" | "rent";
  propertyType: string;
  price: {
    ars?: number;
    usd?: number;
  };
  hasExpenses: boolean;
  expensesPrice?: {
    ars?: number;
    usd?: number;
  };
  address: {
    province: string;
    neighborhood: string;
    street: string;
    number: number;
    postalCode: string;
  };
  lat: string;
  long: string;
  geohash: string;
  isActive: boolean;
  squareMeters: number;
  rooms: number;
  bedrooms: number;
  bathrooms: number;
  parkingSpaces: number;
  amenities?: string[];
  propertyBonus?: string;
  images: string[];
  tags: string[];
  [key: string]: any;
}
