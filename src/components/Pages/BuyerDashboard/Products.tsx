import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../../../firebase/config";

interface ProductsProps {
  onAddToCart: (product: any) => void;
  onSellerClick: (sellerId: string) => void;
  onProductClick: (product: any) => void;
}

function Products({
  onAddToCart,
  onSellerClick,
  onProductClick,
}: ProductsProps) {
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchCriteria, setSearchCriteria] = useState({
    quantityMin: "",
    weightMin: "",
    materialType: "",
  });

  // Debug: Check sellers and products collections
  useEffect(() => {
    const checkData = async () => {
      try {
        // Check sellers
        const sellersQuery = query(collection(db, "sellers"));
        const sellersSnapshot = await getDocs(sellersQuery);

        console.log("All sellers in database:", sellersSnapshot.docs.length);
        const sellerUserIds = new Set();
        sellersSnapshot.docs.forEach((doc, index) => {
          const data = doc.data();
          sellerUserIds.add(data.userId);
          console.log(`Seller ${index + 1}:`, {
            id: doc.id,
            userId: data.userId,
            username: data.username,
            email: data.email,
          });
        });

        // Check products
        const productsQuery = query(collection(db, "products"));
        const productsSnapshot = await getDocs(productsQuery);

        console.log("All products in database:", productsSnapshot.docs.length);
        const productsWithWrongSellerId: Array<{
          id: string;
          name: string;
          sellerId: string;
        }> = [];
        productsSnapshot.docs.forEach((doc, index) => {
          const data = doc.data();
          const hasWrongSellerId = !sellerUserIds.has(data.sellerId);
          if (hasWrongSellerId) {
            productsWithWrongSellerId.push({
              id: doc.id,
              name: data.name,
              sellerId: data.sellerId,
            });
          }
          console.log(`Product ${index + 1}:`, {
            id: doc.id,
            name: data.name,
            sellerId: data.sellerId,
            price: data.price,
            hasWrongSellerId: hasWrongSellerId,
          });
        });

        // Check buyers
        const buyersQuery = query(collection(db, "buyers"));
        const buyersSnapshot = await getDocs(buyersQuery);

        console.log("All buyers in database:", buyersSnapshot.docs.length);
        buyersSnapshot.docs.forEach((doc, index) => {
          const data = doc.data();
          console.log(`Buyer ${index + 1}:`, {
            id: doc.id,
            userId: data.userId,
            username: data.username,
            email: data.email,
          });
        });

        // Report products with wrong seller IDs
        if (productsWithWrongSellerId.length > 0) {
          console.warn(
            "⚠️ Products with wrong seller IDs found:",
            productsWithWrongSellerId
          );
          console.log(
            "These products should be deleted or their sellerId should be corrected."
          );
        }
      } catch (error) {
        console.error("Error checking data:", error);
      }
    };

    checkData();
  }, []);

  // Fetch all products for buyers
  useEffect(() => {
    const q = query(collection(db, "products"));

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const productsList: any[] = [];

      for (const docSnapshot of querySnapshot.docs) {
        const productData = docSnapshot.data();

        // Fetch seller information for each product
        try {
          console.log(
            "Fetching seller for product:",
            productData.name,
            "sellerId:",
            productData.sellerId
          );

          // First try to find in sellers collection
          const sellerQuery = query(
            collection(db, "sellers"),
            where("userId", "==", productData.sellerId)
          );
          const sellerSnapshot = await getDocs(sellerQuery);

          console.log(
            "Seller query result:",
            sellerSnapshot.docs.length,
            "docs found"
          );

          let sellerName = "未知賣家";
          if (!sellerSnapshot.empty) {
            const sellerData = sellerSnapshot.docs[0].data();
            sellerName = sellerData.username || "未知賣家";
            console.log("Found seller:", sellerName);
          } else {
            // If not found in sellers, check if it's actually a buyer ID
            console.log("No seller found, checking if it's a buyer ID...");
            const buyerQuery = query(
              collection(db, "buyers"),
              where("userId", "==", productData.sellerId)
            );
            const buyerSnapshot = await getDocs(buyerQuery);

            if (!buyerSnapshot.empty) {
              const buyerData = buyerSnapshot.docs[0].data();
              sellerName = `[錯誤] ${buyerData.username} (這是買家ID)`;
              console.log("Found buyer instead of seller:", buyerData.username);
            } else {
              console.log(
                "No seller found for sellerId:",
                productData.sellerId
              );
            }
          }

          productsList.push({
            id: docSnapshot.id,
            ...productData,
            sellerName: sellerName,
          });
        } catch (error) {
          console.error("Error fetching seller for product:", error);
          productsList.push({
            id: docSnapshot.id,
            ...productData,
            sellerName: "未知賣家",
          });
        }
      }

      setAllProducts(productsList);
    });

    return () => unsubscribe();
  }, []);

  const filteredProducts = allProducts.filter((product) => {
    // Basic name search
    const nameMatch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    // Advanced criteria search
    const quantityMatch = (() => {
      if (!product.quantity) return true;

      const productQuantity = Number(product.quantity);
      if (isNaN(productQuantity)) return true;

      const minValue = Number(searchCriteria.quantityMin);

      const minMatch =
        !searchCriteria.quantityMin ||
        (!isNaN(minValue) && productQuantity >= minValue);

      return minMatch;
    })();

    const weightMatch = (() => {
      if (!product.weight) return true;

      // Extract number from weight string (e.g., "5kg" -> 5)
      const weightNumber = Number(product.weight.replace(/[^\d.]/g, ""));
      if (isNaN(weightNumber)) return true;

      const minValue = Number(searchCriteria.weightMin);

      const minMatch =
        !searchCriteria.weightMin ||
        (!isNaN(minValue) && weightNumber >= minValue);

      return minMatch;
    })();

    const materialTypeMatch =
      !searchCriteria.materialType ||
      (product.materialType &&
        product.materialType
          .toLowerCase()
          .includes(searchCriteria.materialType.toLowerCase()));

    return nameMatch && quantityMatch && weightMatch && materialTypeMatch;
  });

  const handleCriteriaChange = (field: string, value: string) => {
    setSearchCriteria((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSearchCriteria({
      quantityMin: "",
      weightMin: "",
      materialType: "",
    });
  };

  return (
    <div className="p-4">
      <h3 className="mb-4">待回收廢料</h3>

      {/* Search Form */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">搜尋條件</h5>
        </div>
        <div className="card-body">
          {/* Basic Search */}
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">商品名稱</label>
              <input
                type="text"
                className="form-control"
                placeholder="搜尋商品名稱..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-6 d-flex align-items-end">
              <button
                className="btn btn-outline-secondary"
                onClick={clearSearch}
              >
                清除搜尋
              </button>
            </div>
          </div>

          {/* Advanced Search Criteria */}
          <div className="row">
            <div className="col-md-6 col-lg-4 mb-3">
              <label className="form-label">數量 (至少)</label>
              <input
                type="number"
                className="form-control"
                placeholder="輸入最小數量..."
                min="0"
                value={searchCriteria.quantityMin}
                onChange={(e) =>
                  handleCriteriaChange("quantityMin", e.target.value)
                }
              />
            </div>
            <div className="col-md-6 col-lg-4 mb-3">
              <label className="form-label">重量 (至少)</label>
              <input
                type="number"
                className="form-control"
                placeholder="輸入最小重量..."
                min="0"
                value={searchCriteria.weightMin}
                onChange={(e) =>
                  handleCriteriaChange("weightMin", e.target.value)
                }
              />
            </div>
            <div className="col-md-6 col-lg-4 mb-3">
              <label className="form-label">建材種類</label>
              <select
                className="form-select"
                value={searchCriteria.materialType}
                onChange={(e) =>
                  handleCriteriaChange("materialType", e.target.value)
                }
              >
                <option value="">全部</option>
                <option value="玻璃">玻璃</option>
                <option value="金屬">金屬</option>
                <option value="瀝青">瀝青</option>
                <option value="煤灰">煤灰</option>
                <option value="泡沫塑料">泡沫塑料</option>
                <option value="塑膠">塑膠</option>
                <option value="碎石骨料">碎石骨料</option>
                <option value="挖掘料">挖掘料</option>
                <option value="橡膠">橡膠</option>
                <option value="公眾填料">公眾填料</option>
                <option value="其他">其他</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {filteredProducts.length === 0 ? (
          <div className="col-12 text-center text-muted">
            {searchTerm ? "找不到符合搜尋條件的商品" : "尚無商品"}
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div key={product.id} className="col-md-4 mb-3">
              <div
                className="card"
                style={{ cursor: "pointer" }}
                onClick={() => onProductClick(product)}
              >
                <div className="card-body">
                  <h5 className="card-title">{product.name}</h5>
                  <p className="card-text">
                    <strong>價格:</strong> ${product.price}
                    <br />
                    <strong>庫存:</strong> {product.quantity}
                    {product.weight && (
                      <>
                        <br />
                        <strong>重量:</strong> {product.weight}
                      </>
                    )}
                    {product.materialType && (
                      <>
                        <br />
                        <strong>建材種類:</strong> {product.materialType}
                      </>
                    )}
                    {product.location && (
                      <>
                        <br />
                        <strong>地點:</strong> {product.location}
                      </>
                    )}
                    <br />
                    <strong>賣家:</strong>{" "}
                    <button
                      className="btn btn-link p-0 text-decoration-underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSellerClick(product.sellerId);
                      }}
                      style={{ color: "#0d6efd" }}
                    >
                      {product.sellerName}
                    </button>
                  </p>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(product);
                    }}
                    disabled={product.quantity <= 0}
                  >
                    {product.quantity <= 0 ? "缺貨" : "加入購物車"}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Products;
