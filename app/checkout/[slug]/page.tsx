import { ArrowLeft, ReceiptText } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckoutForm } from "@/components/CheckoutForm";
import { formatRupiah } from "@/lib/format";
import { getProductBySlug, getProductPrice, hasPromo, products } from "@/lib/products";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();
  const salePrice = getProductPrice(product);
  const promo = hasPromo(product);

  return (
    <main>
      <header className="topbar">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <ReceiptText size={19} />
          </span>
          <span>NikiStore</span>
        </Link>
        <Link className="back-link" href={`/products/${product.slug}`}>
          <ArrowLeft size={17} />
          Detail
        </Link>
      </header>

      <section className="checkout-layout">
        <div className="checkout-summary">
          <img src={product.image} alt="" />
          <span className="eyebrow">{product.category}</span>
          <h1>{product.title}</h1>
          <p>{product.subtitle}</p>
          <strong className="summary-price">
            {promo ? <span className="price-old">{formatRupiah(product.price)}</span> : null}
            <span>{formatRupiah(salePrice)}</span>
          </strong>
        </div>
        <CheckoutForm product={product} />
      </section>
    </main>
  );
}
