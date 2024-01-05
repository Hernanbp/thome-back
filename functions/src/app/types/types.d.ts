export interface User {
  id: string;
  email: string;
  name: string;
  surname: string;
  registrationNumber: number;
  phoneNumber: number;
  address: string;
  roles: string[];
  status: "COMPLETED" | "PENDING";
}
