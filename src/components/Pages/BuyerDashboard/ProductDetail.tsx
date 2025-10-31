import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../../firebase/config";

interface ProductDetailProps {
  product: any;
  onBackToProducts: () => void;
  onAddToCart: (product: any) => void;
  onSellerClick: (sellerId: string) => void;
  onContactSeller?: (sellerId: string, sellerName: string) => void;
}

function ProductDetail({
  product,
  onBackToProducts,
  onAddToCart,
  onSellerClick,
  onContactSeller,
}: ProductDetailProps) {
  const [sellerInfo, setSellerInfo] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);

  // Fetch seller information
  useEffect(() => {
    const fetchSellerInfo = async () => {
      if (product?.sellerId) {
        try {
          const sellerQuery = query(
            collection(db, "sellers"),
            where("userId", "==", product.sellerId)
          );
          const sellerSnapshot = await getDocs(sellerQuery);

          if (!sellerSnapshot.empty) {
            const sellerData = sellerSnapshot.docs[0].data();
            setSellerInfo(sellerData);
          }
        } catch (error) {
          console.error("Error fetching seller info:", error);
        }
      }
    };

    fetchSellerInfo();
  }, [product?.sellerId]);

  const handleAddToCart = () => {
    const productWithQuantity = {
      ...product,
      quantity: quantity,
    };
    onAddToCart(productWithQuantity);
    alert(`已將 ${quantity} 個 ${product.name} 加入購物車！`);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value >= 1 && value <= product.quantity) {
      setQuantity(value);
    }
  };

  const isMobile = window.innerWidth <= 768;
  
  return (
    <div className="p-4" style={{ padding: isMobile ? "12px" : "24px" }}>
      <div className="d-flex justify-content-between align-items-center mb-4" style={{ marginBottom: isMobile ? "12px" : "24px" }}>
        <h3 className="mb-0" style={{ fontSize: isMobile ? "18px" : "24px" }}>商品詳情</h3>
        <button className="btn btn-secondary" onClick={onBackToProducts} style={{ padding: isMobile ? "6px 12px" : "8px 16px", fontSize: isMobile ? "12px" : "14px" }}>
          返回
        </button>
      </div>

      {product ? (
        <div className={isMobile ? "" : "row"}>
          {/* Product Image */}
          <div className={isMobile ? "mb-3" : "col-md-6 mb-4"}>
            <div className="card" style={{ padding: isMobile ? "8px" : "16px" }}>
              <div className="card-body text-center" style={{ padding: isMobile ? "8px" : "16px" }}>
                {product.photoURL ? (
                  <img
                    src={product.photoURL}
                    alt={product.name}
                    style={{
                      maxWidth: "100%",
                      maxHeight: isMobile ? "150px" : "300px",
                      borderRadius: "8px",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    className="bg-light d-flex align-items-center justify-content-center"
                    style={{ height: isMobile ? "150px" : "300px", borderRadius: "8px" }}
                  >
                    <i className={`fas fa-image ${isMobile ? "fa-2x" : "fa-3x"} text-muted`}></i>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Product Information */}
          <div className={isMobile ? "" : "col-md-6"}>
            <div className="card" style={{ padding: isMobile ? "8px" : "16px" }}>
              <div className="card-body" style={{ padding: isMobile ? "8px" : "16px" }}>
                <h2 className="card-title mb-3" style={{ fontSize: isMobile ? "18px" : "24px", marginBottom: isMobile ? "8px" : "16px" }}>{product.name}</h2>

                <div className="mb-3" style={{ marginBottom: isMobile ? "8px" : "16px" }}>
                  <h4 className="text-primary" style={{ fontSize: isMobile ? "20px" : "28px", margin: 0 }}>${product.price}</h4>
                </div>

                {product.description && (
                  <div className="mb-3" style={{ marginBottom: isMobile ? "8px" : "16px" }}>
                    <h5 style={{ fontSize: isMobile ? "13px" : "16px", marginBottom: isMobile ? "4px" : "8px" }}>商品描述</h5>
                    <p className="text-muted" style={{ fontSize: isMobile ? "12px" : "14px", margin: 0 }}>{product.description}</p>
                  </div>
                )}

                <div className="mb-3" style={{ marginBottom: isMobile ? "8px" : "16px" }}>
                  <h5 style={{ fontSize: isMobile ? "13px" : "16px", marginBottom: isMobile ? "4px" : "8px" }}>數量狀況</h5>
                  <span
                    className={`badge ${
                      product.quantity > 0 ? "bg-success" : "bg-danger"
                    }`}
                    style={{ fontSize: isMobile ? "11px" : "14px" }}
                  >
                    {product.quantity > 0
                      ? `數量 ${product.quantity} 個`
                      : "缺貨"}
                  </span>
                </div>

                {/* Seller Information */}
                <div className="mb-4">
                  <h5>賣家資訊</h5>
                  <div className="d-flex align-items-center">
                    <span className="me-2">賣家:</span>
                    <button
                      className="btn btn-link p-0 text-decoration-underline"
                      onClick={() => onSellerClick(product.sellerId)}
                      style={{ color: "#0d6efd" }}
                    >
                      {product.sellerName}
                    </button>
                  </div>
                  {sellerInfo && (
                    <small className="text-muted d-block">
                      註冊時間:{" "}
                      {sellerInfo.createdAt
                        ?.toDate()
                        .toLocaleDateString("zh-TW") || "未知"}
                    </small>
                  )}
                  {onContactSeller && (
                    <div className="mt-2">
                      <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={() =>
                          onContactSeller(product.sellerId, product.sellerName)
                        }
                      >
                        <i className="fas fa-comment me-1"></i>
                        聯絡賣家
                      </button>
                    </div>
                  )}
                </div>

                {/* Quantity Selection and Add to Cart */}
                {product.quantity > 0 && (
                  <div className="mb-3">
                    <h5>購買數量</h5>
                    <div className="d-flex align-items-center">
                      <input
                        type="number"
                        className="form-control me-2"
                        style={{ width: "100px" }}
                        min="1"
                        max={product.quantity}
                        value={quantity}
                        onChange={handleQuantityChange}
                      />
                      <span className="text-muted">
                        / {product.quantity} 個
                      </span>
                    </div>
                  </div>
                )}

                <div className="d-grid gap-2">
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={handleAddToCart}
                    disabled={product.quantity <= 0}
                  >
                    {product.quantity <= 0
                      ? "缺貨"
                      : `加入購物車 (${quantity} 個)`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <p>載入商品資訊中...</p>
        </div>
      )}
    </div>
  );
}

export default ProductDetail;
