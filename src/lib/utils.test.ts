import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatRupiah, generateInvoiceNumber, generatePublicHash } from "./utils";
import { formatPhoneNumber } from "./whatsapp";

describe("Utils & Formatters", () => {
  it("formatRupiah formats numeric values to standard Indonesian currency format", () => {
    const formatted = formatRupiah(1500000);
    assert.match(formatted, /1\.500\.000/);
    assert.match(formatted, /Rp/);
  });

  it("generatePublicHash generates 64-character hex string", () => {
    const hash = generatePublicHash();
    assert.equal(typeof hash, "string");
    assert.equal(hash.length, 64);
    assert.match(hash, /^[a-f0-9]{64}$/);
  });

  it("generateInvoiceNumber matches INV/YYYYMM/XXXX format", () => {
    const inv = generateInvoiceNumber(42);
    assert.match(inv, /^INV\/\d{6}\/0042$/);
  });

  it("formatPhoneNumber converts 08xx to 628xx correctly", () => {
    assert.equal(formatPhoneNumber("08123456789"), "628123456789");
    assert.equal(formatPhoneNumber("628123456789"), "628123456789");
    assert.equal(formatPhoneNumber("+62 812-3456-789"), "628123456789");
  });
});
