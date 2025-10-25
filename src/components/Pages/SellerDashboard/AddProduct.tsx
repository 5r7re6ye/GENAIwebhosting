import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../firebase/config";

// Updated for GitHub Pages deployment

interface AddProductProps {
  user: any;
  onSuccess: () => void;
  onCancel: () => void;
}

function AddProduct({ user, onSuccess, onCancel }: AddProductProps) {
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productQuantity, setProductQuantity] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSaveProduct = async () => {
    // Validate inputs
    if (!productName || !productPrice || !productQuantity) {
      setError("請填寫所有欄位");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Add product to Firestore
      const docRef = await addDoc(collection(db, "products"), {
        name: productName,
        price: parseFloat(productPrice),
        quantity: parseInt(productQuantity),
        sellerId: user?.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log("Product saved with ID: ", docRef.id);

      // Reset form and notify success
      setProductName("");
      setProductPrice("");
      setProductQuantity("");
      setError("");

      // Show success message
      alert("廢料已成功儲存！");

      // Call success callback
      onSuccess();
    } catch (error: any) {
      console.error("Error saving product: ", error);
      setError("儲存失敗: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setProductName("");
    setProductPrice("");
    setProductQuantity("");
    setError("");
    onCancel();
  };

  return (
    <div className="p-4">
      <h3 className="mb-4">創造請求</h3>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <form>
                <div className="mb-3">
                  <label className="form-label">廢料名稱</label>

                  <input
                    type="text"
                    className="form-control"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="請輸入廢料名稱"
                    disabled={isLoading}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">價格</label>
                  <div className="input-group">
                    <span className="input-group-text">$</span>
                    <input
                      type="number"
                      className="form-control"
                      value={productPrice}
                      onChange={(e) => setProductPrice(e.target.value)}
                      placeholder="請輸入價格"
                      min="0"
                      step="0.01"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">數量</label>
                  <input
                    type="number"
                    className="form-control"
                    value={productQuantity}
                    onChange={(e) => setProductQuantity(e.target.value)}
                    placeholder="請輸入數量"
                    min="0"
                    disabled={isLoading}
                  />
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={handleSaveProduct}
                    disabled={isLoading}
                  >
                    {isLoading ? "儲存中..." : "儲存廢料"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCancel}
                    disabled={isLoading}
                  >
                    取消
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddProduct;
