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
  const [productQuantity, setProductQuantity] = useState("");
  const [productWeight, setProductWeight] = useState("");
  const [productType, setProductType] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSaveProduct = async () => {
    // Validate inputs
    if (
      !productName ||
      !productQuantity ||
      !productWeight ||
      !productType ||
      !productPrice
    ) {
      setError("請填寫所有欄位");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Optional: convert image to base64 data URL (no Firebase Storage)
      let photoURL: string | undefined = undefined;
      if (imageFile) {
        photoURL = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(imageFile);
        });
      }

      // Add product to Firestore with base64 image
      const docRef = await addDoc(collection(db, "products"), {
        name: productName,
        quantity: parseInt(productQuantity),
        weight: parseFloat(productWeight),
        type: productType,
        price: parseFloat(productPrice),
        description: productDescription,
        photoURL: photoURL || null,
        sellerId: user?.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log("Product saved with ID: ", docRef.id);

      // Reset form and notify success
      setProductName("");
      setProductQuantity("");
      setProductWeight("");
      setProductType("");
      setProductPrice("");
      setError("");
      setProductDescription("");
      setImageFile(null);
      setImagePreview("");

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
    setProductQuantity("");
    setProductWeight("");
    setProductType("");
    setProductPrice("");
    setError("");
    onCancel();
  };

  return (
    <div>
      <h3
        style={{
          color: "#6c757d",
          fontSize: "24px",
          fontWeight: "bold",
          marginBottom: "30px",
        }}
      >
        創造請求
      </h3>

      {error && (
        <div
          style={{
            backgroundColor: "#f8d7da",
            color: "#721c24",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "20px",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          maxWidth: "600px",
          backgroundColor: "white",
          padding: "40px",
          borderRadius: "20px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
        }}
      >
        <form>
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#6c757d",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              廢料名稱
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="請輸入廢料名稱"
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "2px solid #e9ecef",
                borderRadius: "10px",
                fontSize: "16px",
                outline: "none",
                transition: "border-color 0.3s ease",
                backgroundColor: isLoading ? "#f8f9fa" : "white",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#D59C00")}
              onBlur={(e) => (e.target.style.borderColor = "#e9ecef")}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#6c757d",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              描述
            </label>
            <textarea
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              placeholder="請輸入描述 (選填)"
              disabled={isLoading}
              rows={4}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "2px solid #e9ecef",
                borderRadius: "10px",
                fontSize: "16px",
                outline: "none",
                transition: "border-color 0.3s ease",
                backgroundColor: isLoading ? "#f8f9fa" : "white",
                resize: "vertical",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#D59C00")}
              onBlur={(e) => (e.target.style.borderColor = "#e9ecef")}
            />
          </div>

          {/* Image upload */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#6c757d",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              上傳圖片 (選填)
            </label>
            <input
              type="file"
              accept="image/*"
              disabled={isLoading}
              onChange={(e) => {
                const file = e.target.files && e.target.files[0];
                if (file) {
                  setImageFile(file);
                  const reader = new FileReader();
                  reader.onload = () =>
                    setImagePreview(reader.result as string);
                  reader.readAsDataURL(file);
                } else {
                  setImageFile(null);
                  setImagePreview("");
                }
              }}
              style={{ display: "block", marginBottom: "10px" }}
            />
            {imagePreview && (
              <img
                src={imagePreview}
                alt="預覽"
                style={{
                  maxWidth: "100%",
                  borderRadius: "8px",
                  border: "1px solid #e9ecef",
                }}
              />
            )}
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#6c757d",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              數量
            </label>
            <input
              type="number"
              value={productQuantity}
              onChange={(e) => setProductQuantity(e.target.value)}
              placeholder="請輸入數量"
              min="0"
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "2px solid #e9ecef",
                borderRadius: "10px",
                fontSize: "16px",
                outline: "none",
                transition: "border-color 0.3s ease",
                backgroundColor: isLoading ? "#f8f9fa" : "white",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#D59C00")}
              onBlur={(e) => (e.target.style.borderColor = "#e9ecef")}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#6c757d",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              重量 (kg)
            </label>
            <input
              type="number"
              value={productWeight}
              onChange={(e) => setProductWeight(e.target.value)}
              placeholder="請輸入重量"
              min="0"
              step="0.1"
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "2px solid #e9ecef",
                borderRadius: "10px",
                fontSize: "16px",
                outline: "none",
                transition: "border-color 0.3s ease",
                backgroundColor: isLoading ? "#f8f9fa" : "white",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#D59C00")}
              onBlur={(e) => (e.target.style.borderColor = "#e9ecef")}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#6c757d",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              價格 ($)
            </label>
            <input
              type="number"
              value={productPrice}
              onChange={(e) => setProductPrice(e.target.value)}
              placeholder="請輸入價格"
              min="0"
              step="0.01"
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "2px solid #e9ecef",
                borderRadius: "10px",
                fontSize: "16px",
                outline: "none",
                transition: "border-color 0.3s ease",
                backgroundColor: isLoading ? "#f8f9fa" : "white",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#D59C00")}
              onBlur={(e) => (e.target.style.borderColor = "#e9ecef")}
            />
          </div>

          <div style={{ marginBottom: "30px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#6c757d",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              種類
            </label>
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "2px solid #e9ecef",
                borderRadius: "10px",
                fontSize: "16px",
                outline: "none",
                transition: "border-color 0.3s ease",
                backgroundColor: isLoading ? "#f8f9fa" : "white",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#D59C00")}
              onBlur={(e) => (e.target.style.borderColor = "#e9ecef")}
            >
              <option value="">請選擇建材種類</option>
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

          <div
            style={{ display: "flex", gap: "15px", justifyContent: "center" }}
          >
            <button
              type="button"
              onClick={handleSaveProduct}
              disabled={isLoading}
              style={{
                backgroundColor: "#D59C00",
                color: "white",
                border: "none",
                padding: "12px 30px",
                borderRadius: "25px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.7 : 1,
                transition: "all 0.3s ease",
              }}
            >
              {isLoading ? "儲存中..." : "儲存廢料"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              style={{
                backgroundColor: "transparent",
                color: "#D59C00",
                border: "2px solid #D59C00",
                padding: "10px 30px",
                borderRadius: "25px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.7 : 1,
                transition: "all 0.3s ease",
              }}
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddProduct;
