import { ArrowLeft, Check, CreditCard } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/Topbar";
import { formatRupiah } from "@/lib/format";
import { findProductBySlug, getProductPrice, hasPromo, products } from "@/lib/products";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await findProductBySlug(slug);
  if (!product) notFound();
  const salePrice = getProductPrice(product);
  const promo = hasPromo(product);

  return (
    <main>
      <Topbar />
      <div className="topbar topbar-sub">
        <span />
        <Link className="back-link" href="/">
          <ArrowLeft size={17} />
          Katalog
        </Link>
      </div>

      <section className="detail-layout">
        <div className="detail-media">
          <img src={product.image} alt="" />
        </div>
        <div className="detail-copy">
          <span className="eyebrow">{product.category}</span>
          <h1>{product.title}</h1>
          <p>{product.description}</p>
          <div className="detail-price">
            {promo ? <span className="price-old">{formatRupiah(product.price)}</span> : null}
            <span>{formatRupiah(salePrice)}</span>
          </div>
          <div className="stack-row">
            {product.stack.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <Link className="icon-button primary wide-on-mobile" href={`/checkout/${product.slug}`}>
            <CreditCard size={18} />
            Checkout QRIS
          </Link>
        </div>
      </section>

      <section className="spec-grid">
        <div>
          <h2>Isi Paket</h2>
          <ul className="check-list">
            {product.includes.map((item) => (
              <li key={item}>
                <Check size={17} />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2>Highlight</h2>
          <ul className="check-list">
            {product.highlights.map((item) => (
              <li key={item}>
                <Check size={17} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
