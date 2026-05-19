import { ArrowLeft, QrCode } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyTextButton } from "@/components/CopyTextButton";
import { PaymentWatcher } from "@/components/PaymentWatcher";
import { compactDateTime, formatRupiah } from "@/lib/format";
import { createQrisPayment } from "@/lib/okepay";
import { verifyOrderToken } from "@/lib/orders";
import { getProductById } from "@/lib/products";

export const runtime = "nodejs";

export default async function PayPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let order;
  try {
    order = verifyOrderToken(decodeURIComponent(token));
  } catch {
    notFound();
  }
  const product = getProductById(order.productId);
  if (!product) notFound();

  let qris;
  let qrisError = "";
  try {
    qris = await createQrisPayment(order.amount);
  } catch (error) {
    qrisError = error instanceof Error ? error.message : "Gagal membuat QRIS.";
  }

  return (
    <main>
      <header className="topbar">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <QrCode size={19} />
          </span>
          <span>NikiStore</span>
        </Link>
        <Link className="back-link" href={`/checkout/${product.slug}`}>
          <ArrowLeft size={17} />
          Checkout
        </Link>
      </header>

      <section className="payment-layout">
        <div className="qris-panel">
          <span className="eyebrow">Invoice {order.id}</span>
          <h1>{formatRupiah(order.amount)}</h1>
          <p>Termasuk kode unik {order.uniqueCode}. Berlaku sampai {compactDateTime(order.paymentExpiresAt)}.</p>
          {qris ? (
            <>
              <div className="qr-frame">
                <img src={qris.qrisUrl} alt="QRIS pembayaran" />
              </div>
              {qris.provider === "demo" ? <p className="form-error">Mode demo: set OKEPAY_API_KEY.</p> : null}
            </>
          ) : (
            <div className="qr-error">{qrisError}</div>
          )}
        </div>

        <aside className="invoice-panel">
          <div>
            <span className="eyebrow">Produk</span>
            <h2>{product.title}</h2>
            <p>{order.customerEmail}</p>
            <p>{order.customerPhone}</p>
          </div>
          <div className="invoice-lines">
            <div>
              <span>Harga</span>
              <strong>{formatRupiah(order.basePrice)}</strong>
            </div>
            <div>
              <span>Kode unik</span>
              <strong>{formatRupiah(order.uniqueCode)}</strong>
            </div>
            <div>
              <span>Total</span>
              <strong>{formatRupiah(order.amount)}</strong>
            </div>
          </div>
          <PaymentWatcher token={decodeURIComponent(token)} />
          {qris?.qrisString ? (
            <CopyTextButton text={qris.qrisString} label="Copy QRIS string" />
          ) : null}
        </aside>
      </section>
    </main>
  );
}
