import { useState, useEffect } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../../firebase/config";

interface SellerInfoProps {
  selectedSeller: any;
  onBackToProducts: () => void;
  onAddToCart: (product: any) => void;
  onContactSeller?: (sellerId: string, sellerName: string) => void;
}

function SellerInfo({
  selectedSeller,
  onBackToProducts,
  onAddToCart,
  onContactSeller,
}: SellerInfoProps) {
  const [sellerProducts, setSellerProducts] = useState<any[]>([]);

  // Fetch seller's products
  useEffect(() => {
    if (selectedSeller?.id) {
      const q = query(
        collection(db, "products"),
        where("sellerId", "==", selectedSeller.id)
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const productsList: any[] = [];
        querySnapshot.forEach((doc) => {
          productsList.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        setSellerProducts(productsList);
      });

      return () => unsubscribe();
    }
  }, [selectedSeller?.id]);
  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0">賣家資訊</h3>
        <button className="btn btn-secondary" onClick={onBackToProducts}>
          返回待回收廢料
        </button>
      </div>

      {selectedSeller ? (
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">{selectedSeller.username}</h5>
                <div className="mb-3">
                  <strong>電子郵件:</strong> {selectedSeller.email}
                </div>
                <div className="mb-3">
                  <strong>聯絡電話:</strong> {selectedSeller.phoneNumber}
                </div>
                <div className="mb-3">
                  <strong>用戶類型:</strong> 賣家
                </div>
                <div className="mb-3">
                  <strong>註冊時間:</strong>{" "}
                  {selectedSeller.createdAt
                    ? selectedSeller.createdAt
                        .toDate()
                        .toLocaleDateString("zh-TW")
                    : "未知"}
                </div>
                {onContactSeller && (
                  <div className="mt-3">
                    <button
                      className="btn btn-primary"
                      onClick={() =>
                        onContactSeller(
                          selectedSeller.id,
                          selectedSeller.username
                        )
                      }
                    >
                      <i className="fas fa-comment me-2"></i>
                      聯絡賣家
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <p>載入賣家資訊中...</p>
        </div>
      )}

      {/* Seller's Products Section */}
      {selectedSeller && (
        <div className="row mt-4">
          <div className="col-12">
            <h4 className="mb-3">此賣家的商品</h4>
            {sellerProducts.length === 0 ? (
              <div className="text-center text-muted">
                <p>此賣家目前沒有商品</p>
              </div>
            ) : (
              <div className="row">
                {sellerProducts.map((product) => (
                  <div key={product.id} className="col-md-4 mb-3">
                    <div className="card">
                      <div className="card-body">
                        <h5 className="card-title">{product.name}</h5>
                        <p className="card-text">
                          <strong>價格:</strong> ${product.price}
                          <br />
                          <strong>庫存:</strong> {product.quantity}
                          <br />
                          {product.description && (
                            <>
                              <strong>描述:</strong> {product.description}
                              <br />
                            </>
                          )}
                        </p>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => onAddToCart(product)}
                          disabled={product.quantity <= 0}
                        >
                          {product.quantity <= 0 ? "缺貨" : "加入購物車"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SellerInfo;
