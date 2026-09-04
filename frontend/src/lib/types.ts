export type UserRole = "admin" | "driver" | "student";

export type User = {
  id: string;
  role: UserRole;
  email: string;
  fullName: string;
  matricNumber?: string | null;
  ridePoints: number;
  leftoverKobo?: number;
  dedicatedAccount?: {
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
  };
  hasRfid?: boolean;
  rfidUid?: string | null;
  isActive: boolean;
};

export type Trip = {
  _id: string;
  studentId: string | { _id: string; fullName?: string; matricNumber?: string };
  driverId: string | { _id: string; fullName?: string };
  farePoints: number;
  fareKobo: number;
  method: "qr" | "rfid";
  status: "success" | "failed";
  failReason?: string;
  createdAt: string;
};

export type ScanResult = {
  ok: boolean;
  code?: string;
  message: string;
  studentName?: string;
  remainingPoints?: number;
  tripId?: string;
};

export type AdminStats = {
  students: number;
  drivers: number;
  ridesToday: number;
  successfulRides: number;
};
