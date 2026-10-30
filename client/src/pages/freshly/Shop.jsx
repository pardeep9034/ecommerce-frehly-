import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  X,
} from "lucide-react";
import useProduct from "@/hooks/use-product";
import useCategory from "@/hooks/use-category";
import useVariant from "@/hooks/use-variant";
import { useStoreStock, applyStoreStock } from "@/hooks/use-inventory";
import ShopProductCard from "@/components/freshly/ShopProductCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const EMPTY = [];

const PRICE_RANGES = [
  { id: "u50", label: "Under ₹50", test: (p) => p < 50 },
  { id: "50-100", label: "₹50 – ₹100", test: (p) => p >= 50 && p <= 100 },
  { id: "100-200", label: "₹100 – ₹200", test: (p) => p > 100 && p <= 200 },
  { id: "o200", label: "Over ₹200", test: (p) => p > 200 },
];
const DISCOUNTS = [10, 20, 30];
const SORTS = [
  { id: "popular", label: "Popular" },
  { id: "price-low", label: "Price: low to high" },
  { id: "price-high", label: "Price: high to low" },
  { id: "discount", label: "Biggest discount" },
];

const toggle = (list, value) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

// Design B: one layout, rearranged at lg (1024 px). Below lg the filter panel
// is a bottom sheet; from lg it is the left sidebar.
const Shop = () => {
  // The navbar search sends ?q=.
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get("q") ?? "";
  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const [cats, setCats] = useState(EMPTY);
  const [prices, setPrices] = useState(EMPTY);
  const [discounts, setDiscounts] = useState(EMPTY);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState("popular");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const pageSize = 12;

  const {
    products: productsData,
    isLoading: productListLoading,
    error: productsError,
  } = useProduct({ page: currentPage, limit: pageSize, storefront: true });
  const { categories: categoriesData } = useCategory();

  const productsList = productsData?.data?.products || productsData?.products || EMPTY;
  const pagination = productsData?.data?.pagination || productsData?.pagination || {};
  const categoriesList = categoriesData?.data?.categories || categoriesData?.categories || EMPTY;
console.log("Products List:", productsList);

  const searched = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return productsList.filter((product) => (product.name || "").toLowerCase().includes(term));
  }, [productsList, searchTerm]);

  const variantIds = useMemo(
    () => [...new Set(searched.flatMap((product) => (product.variants || []).map((v) => v.id)))],
    [searched]
  );
  const { variantInfo } = useVariant({ variantIds });
  const variantInfoMap = useMemo(
    () => new Map((variantInfo || []).map((variant) => [Number(variant.id), variant])),
    [variantInfo]
  );
  const { stock, isLoading: stockLoading } = useStoreStock(variantIds);
  // Skeleton until the store's stock is in, so cards never flash "in stock" first.
  const productsLoading = productListLoading || stockLoading;

  // Variants merged with price info and the store's stock, plus the values the filters read.
  // Every ACTIVE product stays: no active pack, or none in stock at this store, shows as Out of stock.
  const merged = useMemo(
    () =>
      searched
        .map((product) => {
          const variants = applyStoreStock(
            (product.variants || []).map((variant) => {
              const info = variantInfoMap.get(Number(variant.id));
              return { ...variant, ...info, variant_name: info?.variant_name || null };
            }),
            stock
          );
          const first = variants.find((v) => v.in_stock) || variants[0] || {};
          // null when the product has no pack, so price filters skip it
          const price = first.price ?? product.price ?? null;
          const mrp = Number(first.mrp || product.oldPrice || 0);
          return {
            product: { ...product, variants },
            category: product.Category?.name || product.category?.name || product.category || "",
            price,
            discount: price !== null && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0,
            inStock: variants.some((v) => v.in_stock),
          };
        }),
    [searched, variantInfoMap, stock]
  );

  // ponytail: filters run on the current page of 12 only; pass them to the
  // product API when the catalogue outgrows one page per category.
  const minDiscount = discounts.length ? Math.min(...discounts) : 0;
  const shown = useMemo(() => {
    const result = merged.filter(
      (row) =>
        (!cats.length || cats.includes(row.category)) &&
        (!prices.length || (row.price !== null && PRICE_RANGES.some((r) => prices.includes(r.id) && r.test(row.price)))) &&
        row.discount >= minDiscount &&
        (!inStockOnly || row.inStock)
    );
    const by = {
      "price-low": (a, b) => a.price - b.price,
      "price-high": (a, b) => b.price - a.price,
      discount: (a, b) => b.discount - a.discount,
    }[sortBy];
    if (by) result.sort(by);
    // Out-of-stock items go last (sort is stable).
    return result.sort((a, b) => b.inStock - a.inStock);
  }, [merged, cats, prices, minDiscount, inStockOnly, sortBy]);

  const cartItems = useSelector((state) => state.cart.items);
  const cartTotal = cartItems.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0);

  const activeCount = cats.length + prices.length + discounts.length + (inStockOnly ? 1 : 0);
  const clearAll = () => {
    setCats(EMPTY);
    setPrices(EMPTY);
    setDiscounts(EMPTY);
    setInStockOnly(false);
  };

  const totalPages = pagination.totalPages || 1;
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (productsError) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center p-10 text-center bg-white">
        <div className="mb-6 rounded-full bg-destructive p-6 animate-bounce">
          <SlidersHorizontal className="h-10 w-10 text-destructive" />
        </div>
        <h3 className="text-2xl font-black text-foreground">Something went wrong</h3>
        <p className="mt-2 max-w-sm text-muted-foreground">We couldn't load the products. Please check your connection and try again.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-8 rounded-full bg-primary px-10 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-primary/90"
        >
          Try Again
        </button>
      </div>
    );
  }

  const chip = (active) =>
    `shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
      active ? "border-primary bg-primary/10 text-primary" : "border-border bg-white text-foreground hover:border-primary"
    }`;

  const groups = [
    {
      title: "Category",
      options: categoriesList.map((c) => ({
        key: c.name,
        label: c.name,
        count: merged.filter((row) => row.category === c.name).length,
        checked: cats.includes(c.name),
        onChange: () => setCats(toggle(cats, c.name)),
      })),
    },
    {
      title: "Price",
      options: PRICE_RANGES.map((r) => ({
        key: r.id,
        label: r.label,
        count: merged.filter((row) => row.price !== null && r.test(row.price)).length,
        checked: prices.includes(r.id),
        onChange: () => setPrices(toggle(prices, r.id)),
      })),
    },
    {
      title: "Discount",
      options: DISCOUNTS.map((d) => ({
        key: d,
        label: `${d}% or more`,
        count: merged.filter((row) => row.discount >= d).length,
        checked: discounts.includes(d),
        onChange: () => setDiscounts(toggle(discounts, d)),
      })),
    },
    {
      title: "Availability",
      options: [
        {
          key: "stock",
          label: "In stock only",
          count: merged.filter((row) => row.inStock).length,
          checked: inStockOnly,
          onChange: () => setInStockOnly(!inStockOnly),
        },
      ],
    },
  ];

  const title = cats.length === 1 ? cats[0] : "All products";

  return (
    <div className={cartItems.length ? "pb-20 lg:pb-10" : "pb-6 lg:pb-10"}>
      <div className="mx-auto max-w-screen-2xl lg:px-8 lg:pt-5">
        {/* Category chips: full-width strip -> white card at lg */}
        <div className="border-b border-border bg-white lg:rounded-2xl lg:border">
          <div className="flex gap-3 overflow-x-auto px-4 py-3 lg:gap-5 lg:px-5 lg:py-4">
            {[{ name: "All" }, ...categoriesList].map((c) => {
              const active = c.name === "All" ? !cats.length : cats.length === 1 && cats[0] === c.name;
              return (
                <button
                  key={c.name}
                  onClick={() => {
                    setCats(c.name === "All" ? EMPTY : [c.name]);
                    setCurrentPage(1);
                  }}
                  aria-pressed={active}
                  className="flex w-16 shrink-0 flex-col items-center gap-1.5 lg:w-20"
                >
                  <span
                    className={`relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 bg-muted lg:h-16 lg:w-16 ${
                      active ? "border-primary bg-primary/10" : "border-transparent"
                    }`}
                  >
                    <LayoutGrid className="h-6 w-6 text-primary" />
                    {c.image_url && (
                      <img
                        src={c.image_url}
                        alt=""
                        loading="lazy"
                        onError={(e) => e.currentTarget.remove()}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    )}
                  </span>
                  <span className={`line-clamp-2 text-center text-[11px] leading-tight lg:text-xs ${active ? "font-extrabold text-primary" : "font-semibold text-foreground"}`}>
                    {c.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-3 flex items-start gap-6 px-3 sm:px-4 lg:mt-5 lg:px-0">
          {isFilterOpen && (
            <button
              aria-label="Close filters"
              onClick={() => setIsFilterOpen(false)}
              className="fixed inset-0 z-50 bg-black/40 lg:hidden"
            />
          )}

          {/* One filter panel: bottom sheet below lg, sticky sidebar from lg */}
          <aside
            aria-label="Filters"
            className={`${isFilterOpen ? "flex" : "hidden"} fixed inset-x-0 bottom-0 z-50 max-h-[82vh] flex-col rounded-t-2xl bg-white shadow-2xl lg:sticky lg:top-24 lg:z-auto lg:flex lg:max-h-[calc(100vh-7rem)] lg:w-64 lg:shrink-0 lg:rounded-2xl lg:border lg:border-border lg:shadow-none`}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-base font-extrabold">Filters</h2>
              <div className="flex items-center gap-1">
                {activeCount > 0 && (
                  <button onClick={clearAll} className="px-2 py-1 text-xs font-bold text-primary">
                    Clear all
                  </button>
                )}
                <button onClick={() => setIsFilterOpen(false)} aria-label="Close filters" className="p-1 lg:hidden">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-2">
              {groups.map((group) => (
                <fieldset key={group.title} className="border-b border-border py-3 last:border-0">
                  <legend className="sr-only">{group.title}</legend>
                  <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-muted-foreground">{group.title}</p>
                  {group.options.map((o) => (
                    <label key={o.key} className="flex cursor-pointer items-center gap-2.5 py-1.5 text-sm">
                      <input
                        type="checkbox"
                        checked={o.checked}
                        onChange={o.onChange}
                        className="h-4 w-4 accent-primary"
                      />
                      <span className="flex-1">{o.label}</span>
                      <span className="text-xs text-muted-foreground">{o.count}</span>
                    </label>
                  ))}
                </fieldset>
              ))}
            </div>

            <div className="border-t border-border p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden">
              <button
                onClick={() => setIsFilterOpen(false)}
                className="h-11 w-full rounded-xl bg-primary text-sm font-extrabold text-white"
              >
                Show {shown.length} items
              </button>
            </div>
          </aside>

          <main className="min-w-0 flex-1">
            {/* Toolbar: one scrolling row -> wraps at lg, Sort to the right */}
            <div className="-mx-3 flex items-center gap-2 overflow-x-auto px-3 pb-1 sm:-mx-4 sm:px-4 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
              <button
                onClick={() => setIsFilterOpen(true)}
                className={`${chip(activeCount > 0)} flex items-center gap-1.5 lg:hidden`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filters
                {activeCount > 0 && (
                  <span className="rounded-full bg-primary px-1.5 text-[10px] text-white">{activeCount}</span>
                )}
              </button>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger aria-label="Sort products" className={`${chip(false)} w-auto gap-1 lg:order-last lg:ml-auto`}>
                  <SelectValue>Sort: {SORTS.find((s) => s.id === sortBy)?.label}</SelectValue>
                </SelectTrigger>
                <SelectContent align="end">
                  {SORTS.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button onClick={() => setInStockOnly(!inStockOnly)} aria-pressed={inStockOnly} className={chip(inStockOnly)}>
                In stock
              </button>
              <button onClick={() => setPrices(toggle(prices, "u50"))} aria-pressed={prices.includes("u50")} className={chip(prices.includes("u50"))}>
                Under ₹50
              </button>
              <button onClick={() => setDiscounts(toggle(discounts, 10))} aria-pressed={discounts.includes(10)} className={chip(discounts.includes(10))}>
                Offers
              </button>
            </div>

            <div className="mb-3 mt-3 flex items-baseline gap-2">
              <h1 className="text-lg font-extrabold text-foreground lg:text-xl">{title}</h1>
              {!productsLoading && <span className="text-xs text-muted-foreground">{shown.length} items</span>}
            </div>

            {productsLoading ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-2.5 lg:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] lg:gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="rounded-xl bg-white p-2.5">
                    <div className="h-[120px] rounded-lg skeleton-shimmer lg:h-[150px]" />
                    <div className="mt-3 h-4 w-3/4 rounded skeleton-shimmer" style={{ animationDelay: "80ms" }} />
                    <div className="mt-2 h-4 w-1/2 rounded skeleton-shimmer" style={{ animationDelay: "160ms" }} />
                    <div className="mt-3 h-9 rounded-lg skeleton-shimmer" style={{ animationDelay: "240ms" }} />
                  </div>
                ))}
              </div>
            ) : shown.length > 0 ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-2.5 lg:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] lg:gap-4">
                {shown.map((row) => (
                  <ShopProductCard key={row.product.id} product={row.product} />
                ))}
              </div>
            ) : (
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl bg-white p-10 text-center">
                <div className="mb-4 rounded-full bg-muted p-6">
                  <Search className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-extrabold text-foreground">No products found</h3>
                <p className="mt-2 max-w-xs text-sm text-muted-foreground">Try removing a filter or searching for something else.</p>
                <button
                  onClick={() => {
                    clearAll();
                    setSearchParams({});
                  }}
                  className="mt-6 text-sm font-extrabold text-primary underline decoration-2 underline-offset-4"
                >
                  Clear all filters
                </button>
              </div>
            )}

            {!productsLoading && totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  aria-label="Previous page"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-foreground ring-1 ring-border transition-colors hover:bg-primary hover:text-white disabled:opacity-30"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    aria-current={page === currentPage ? "page" : undefined}
                    className={`h-10 min-w-10 rounded-xl text-sm font-extrabold transition-colors ${
                      page === currentPage ? "bg-primary text-white" : "bg-white text-muted-foreground ring-1 ring-border hover:bg-muted"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  aria-label="Next page"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-foreground ring-1 ring-border transition-colors hover:bg-primary hover:text-white disabled:opacity-30"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Floating cart bar, phone/tablet only, above the bottom tab bar. The
          navbar Cart shows no amount on web. */}
      {cartItems.length > 0 && (
        <Link
          to="/cart"
          className="fixed inset-x-3 bottom-[calc(4rem+1px+env(safe-area-inset-bottom)+0.5rem)] z-30 flex items-center justify-between rounded-xl bg-primary px-4 py-3 text-white shadow-lg lg:hidden"
        >
          <span className="text-sm font-bold">
            {cartItems.length} {cartItems.length === 1 ? "item" : "items"} · ₹{cartTotal}
          </span>
          <span className="text-sm font-extrabold">View cart →</span>
        </Link>
      )}
    </div>
  );
};

export default Shop;
