import crypto from "crypto";

export interface MidtransSnapItem {
  id: string;
  price: number;
  quantity: number;
  name: string;
}

export interface MidtransCustomerDetails {
  first_name: string;
  email?: string;
  phone: string;
}

export interface CreateSnapTransactionParams {
  orderId: string;
  grossAmount: number;
  items: MidtransSnapItem[];
  customer: MidtransCustomerDetails;
}

export interface MidtransWebhookPayload {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status: string;
  fraud_status?: string;
  payment_type: string;
  transaction_id: string;
  transaction_time: string;
  settlement_time?: string;
}

/**
 * Verify SHA-512 signature from Midtrans webhook
 * Formula: SHA512(order_id + status_code + gross_amount + ServerKey)
 */
export function verifyMidtransSignature(
  payload: {
    order_id: string;
    status_code: string;
    gross_amount: string;
    signature_key: string;
  },
  serverKey: string
): boolean {
  if (!serverKey || !payload.signature_key) return false;

  const rawString = `${payload.order_id}${payload.status_code}${payload.gross_amount}${serverKey}`;
  const computedHash = crypto
    .createHash("sha512")
    .update(rawString)
    .digest("hex");

  return computedHash.toLowerCase() === payload.signature_key.toLowerCase();
}

/**
 * Request Snap Token from Midtrans Sandbox API
 */
export async function createSnapToken(
  params: CreateSnapTransactionParams,
  serverKey: string = process.env.MIDTRANS_SERVER_KEY || ""
): Promise<{ token: string; redirect_url: string }> {
  if (!serverKey) {
    throw new Error("MIDTRANS_SERVER_KEY is missing");
  }

  const endpoint = "https://app.sandbox.midtrans.com/snap/v1/transactions";
  const authHeader = `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`;

  const payload = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: Math.round(params.grossAmount),
    },
    item_details: params.items.map((item) => ({
      id: item.id.substring(0, 50),
      price: Math.round(item.price),
      quantity: item.quantity,
      name: item.name.substring(0, 50),
    })),
    customer_details: {
      first_name: params.customer.first_name,
      email: params.customer.email || undefined,
      phone: params.customer.phone,
    },
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Midtrans Snap error (${res.status}): ${errorText}`);
  }

  return res.json();
}

/**
 * Determine if transaction is paid successfully
 */
export function isPaymentSuccessful(payload: {
  transaction_status: string;
  fraud_status?: string;
}): boolean {
  const status = payload.transaction_status;
  if (status === "capture") {
    return payload.fraud_status === "accept";
  }
  return status === "settlement";
}
