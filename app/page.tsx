import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { products } from "@/lib/products";

export default function Home() {
  return (
    <main>
      <header className="topbar">
        <Link href="/" className="brand" aria-label="NikiStore">
          <span className="brand-mark">
            <ShoppingBag size={19} />
          </span>
          <span>NikiStore</span>
        </Link>
      </header>

      <section className="catalog-section" id="produk">
        <div className="section-heading">
          <h1>Produk</h1>
        </div>
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}
