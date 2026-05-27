import { ProductCard } from "@/components/ProductCard";
import { Topbar } from "@/components/Topbar";
import { getPublicProducts } from "@/lib/products";

export default async function Home() {
  const products = await getPublicProducts();
  return (
    <main>
      <Topbar />

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
