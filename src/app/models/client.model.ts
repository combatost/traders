export interface Client {
  id?: string;              // Optional: Firestore document ID
  fullName: string;         // Client's full name
  phoneNumber: string;      // Primary phone number
  OtherPhoneNumber: string; // Secondary phone number
  location: string;         // Client's city or area
  address: string;          // Primary address
  address2: string;         // Additional address details
  orderId: string;          // Linked order ID
}
