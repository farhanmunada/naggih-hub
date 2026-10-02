import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import { verifyMidtransSignature, isPaymentSuccessful } from "./midtrans";

describe("Midtrans Adapter", () => {
  const serverKey = "SB-Mid-server-test123456";
  const orderId = "INV/202603/0001";
  const statusCode = "200";
  const grossAmount = "250000.00";

  // SHA512(order_id + status_code + gross_amount + ServerKey)
  const validSignature = crypto
    .createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest("hex");

  it("verifyMidtransSignature validates authentic signature accurately", () => {
    const isValid = verifyMidtransSignature(
      {
        order_id: orderId,
        status_code: statusCode,
        gross_amount: grossAmount,
        signature_key: validSignature,
      },
      serverKey
    );
    assert.equal(isValid, true);
  });

  it("verifyMidtransSignature rejects tampered payload or forged signature", () => {
    const isInvalid = verifyMidtransSignature(
      {
        order_id: orderId,
        status_code: statusCode,
        gross_amount: "999999.00", // Tampered amount
        signature_key: validSignature,
      },
      serverKey
    );
    assert.equal(isInvalid, false);
  });

  it("isPaymentSuccessful evaluates settlement and accept capture status correctly", () => {
    assert.equal(
      isPaymentSuccessful({ transaction_status: "settlement" }),
      true
    );
    assert.equal(
      isPaymentSuccessful({
        transaction_status: "capture",
        fraud_status: "accept",
      }),
      true
    );
    assert.equal(
      isPaymentSuccessful({
        transaction_status: "capture",
        fraud_status: "challenge",
      }),
      false
    );
    assert.equal(
      isPaymentSuccessful({ transaction_status: "pending" }),
      false
    );
  });
});
