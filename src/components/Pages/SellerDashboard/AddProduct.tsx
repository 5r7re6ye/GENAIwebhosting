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

  // Roboflow config via Vite env (optional)
  const apiUrl = (import.meta as any).env.VITE_ROBOFLOW_API_URL as
    | string
    | undefined;
  const modelId = (import.meta as any).env.VITE_ROBOFLOW_MODEL_ID as
    | string
    | undefined;
  const apiKey = (import.meta as any).env.VITE_ROBOFLOW_API_KEY as
    | string
    | undefined;

  const mapLabelToType = (label: string): string => {
    const mapping: Record<string, string> = {
      glass: "玻璃",
      public_fill: "公眾填料",
      metal: "金屬",
      asphalt: "瀝青",
      pulverized_fue_ash: "煤灰",
      expanded_polystyrene: "泡沫塑料",
      plastic: "塑膠",
      aggregate: "碎石骨料",
      excavated_materials: "挖掘料",
      rubber: "橡膠",
    };
    return mapping[label] || label;
  };

  const generateDescription = (label: string): string => {
    const chinese = mapLabelToType(label);
    return `AI 建議類型：${chinese}。此為自動辨識結果，請確認或修改。`;
  };

  const classifyImageBase64 = async (base64: string) => {
    try {
      if (!apiUrl || !modelId || !apiKey) {
        console.log("Missing Roboflow config:", {
          hasApiUrl: !!apiUrl,
          hasModelId: !!modelId,
          hasApiKey: !!apiKey,
        });
        return;
      }

      // Strip data URL prefix if present (data:image/jpeg;base64,...)
      const base64Data = base64.includes(",") ? base64.split(",")[1] : base64;

      // Roboflow hosted inference format:
      // https://infer.roboflow.com/{workspace}/{model}/{version}?api_key={key}
      // OR https://serverless.roboflow.com/{workspace}/{model}/{version}?api_key={key}
      const url = `${apiUrl.replace(
        /\/$/,
        ""
      )}/${modelId}?api_key=${encodeURIComponent(apiKey)}`;

      console.log("Calling Roboflow API:", url);

      // Try form-data format (common for Roboflow)
      const formData = new FormData();
      const blob = await fetch(base64).then((r) => r.blob());
      formData.append("file", blob, "image.jpg");

      const res = await fetch(url, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Roboflow API error:", res.status, errorText);

        // Fallback: try JSON format with base64
        try {
          const jsonRes = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: base64Data }),
          });
          if (jsonRes.ok) {
            const jsonData = await jsonRes.json();
            return processRoboflowResponse(jsonData);
          }
        } catch (e) {
          console.error("JSON fallback also failed:", e);
        }
        return;
      }

      const data = await res.json();
      processRoboflowResponse(data);
    } catch (e) {
      console.error("Classification failed:", e);
    }
  };

  const processRoboflowResponse = (data: any) => {
    console.log("Roboflow response:", data);

    // Roboflow returns predictions array
    const predictions = data.predictions || [];
    const top = predictions.length > 0 ? predictions[0] : null;

    if (top && top.class) {
      const label = top.class;
      const confidence = top.confidence || 0;

      console.log(
        `Classification result: ${label} (${(confidence * 100).toFixed(1)}%)`
      );

      // Only set if confidence is reasonable
      if (confidence >= 0.3) {
        setProductType(mapLabelToType(label));
        if (!productDescription) {
          setProductDescription(generateDescription(label));
        }
      } else {
        console.log("Confidence too low, ignoring prediction");
      }
    }
  };

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
          fontSize: window.innerWidth <= 768 ? "18px" : "24px",
          fontWeight: "bold",
          marginBottom: window.innerWidth <= 768 ? "16px" : "30px",
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
          maxWidth: window.innerWidth <= 768 ? "100%" : "1200px",
          backgroundColor: "white",
          padding: window.innerWidth <= 768 ? "16px" : "40px",
          borderRadius: "20px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
        }}
      >
        <form>
          <div
            style={{
              display: "flex",
              gap: window.innerWidth <= 768 ? "16px" : "40px",
              flexWrap: "wrap",
            }}
          >
            {/* Left Column: Form Fields */}
            <div style={{ flex: "1", minWidth: window.innerWidth <= 768 ? "100%" : "400px" }}>
              <div style={{ marginBottom: window.innerWidth <= 768 ? "12px" : "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: window.innerWidth <= 768 ? "6px" : "8px",
                    color: "#6c757d",
                    fontSize: window.innerWidth <= 768 ? "12px" : "14px",
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
                    padding: window.innerWidth <= 768 ? "10px 12px" : "12px 16px",
                    border: "2px solid #e9ecef",
                    borderRadius: "10px",
                    fontSize: window.innerWidth <= 768 ? "14px" : "16px",
                    outline: "none",
                    transition: "border-color 0.3s ease",
                    backgroundColor: isLoading ? "#f8f9fa" : "white",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#D59C00")}
                  onBlur={(e) => (e.target.style.borderColor = "#e9ecef")}
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom: window.innerWidth <= 768 ? "12px" : "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: window.innerWidth <= 768 ? "6px" : "8px",
                    color: "#6c757d",
                    fontSize: window.innerWidth <= 768 ? "12px" : "14px",
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

              <div style={{ marginBottom: window.innerWidth <= 768 ? "12px" : "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: window.innerWidth <= 768 ? "6px" : "8px",
                    color: "#6c757d",
                    fontSize: window.innerWidth <= 768 ? "12px" : "14px",
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
                    padding: window.innerWidth <= 768 ? "10px 12px" : "12px 16px",
                    border: "2px solid #e9ecef",
                    borderRadius: "10px",
                    fontSize: window.innerWidth <= 768 ? "14px" : "16px",
                    outline: "none",
                    transition: "border-color 0.3s ease",
                    backgroundColor: isLoading ? "#f8f9fa" : "white",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#D59C00")}
                  onBlur={(e) => (e.target.style.borderColor = "#e9ecef")}
                />
              </div>

              <div style={{ marginBottom: window.innerWidth <= 768 ? "12px" : "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: window.innerWidth <= 768 ? "6px" : "8px",
                    color: "#6c757d",
                    fontSize: window.innerWidth <= 768 ? "12px" : "14px",
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
                    padding: window.innerWidth <= 768 ? "10px 12px" : "12px 16px",
                    border: "2px solid #e9ecef",
                    borderRadius: "10px",
                    fontSize: window.innerWidth <= 768 ? "14px" : "16px",
                    outline: "none",
                    transition: "border-color 0.3s ease",
                    backgroundColor: isLoading ? "#f8f9fa" : "white",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#D59C00")}
                  onBlur={(e) => (e.target.style.borderColor = "#e9ecef")}
                />
              </div>

              <div style={{ marginBottom: window.innerWidth <= 768 ? "12px" : "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: window.innerWidth <= 768 ? "6px" : "8px",
                    color: "#6c757d",
                    fontSize: window.innerWidth <= 768 ? "12px" : "14px",
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
                    padding: window.innerWidth <= 768 ? "10px 12px" : "12px 16px",
                    border: "2px solid #e9ecef",
                    borderRadius: "10px",
                    fontSize: window.innerWidth <= 768 ? "14px" : "16px",
                    outline: "none",
                    transition: "border-color 0.3s ease",
                    backgroundColor: isLoading ? "#f8f9fa" : "white",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#D59C00")}
                  onBlur={(e) => (e.target.style.borderColor = "#e9ecef")}
                />
              </div>

              <div style={{ marginBottom: window.innerWidth <= 768 ? "12px" : "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: window.innerWidth <= 768 ? "6px" : "8px",
                    color: "#6c757d",
                    fontSize: window.innerWidth <= 768 ? "12px" : "14px",
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
                    padding: window.innerWidth <= 768 ? "10px 12px" : "12px 16px",
                    border: "2px solid #e9ecef",
                    borderRadius: "10px",
                    fontSize: window.innerWidth <= 768 ? "14px" : "16px",
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
            </div>

            {/* Right Column: Image Upload */}
            <div
              style={{
                flex: window.innerWidth <= 768 ? "1 1 100%" : "0 0 350px",
                position: window.innerWidth <= 768 ? "relative" : "sticky",
                top: window.innerWidth <= 768 ? "auto" : "20px",
                alignSelf: "flex-start",
                minWidth: window.innerWidth <= 768 ? "100%" : "350px",
              }}
            >
              <div style={{ marginBottom: window.innerWidth <= 768 ? "12px" : "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: window.innerWidth <= 768 ? "6px" : "8px",
                    color: "#6c757d",
                    fontSize: window.innerWidth <= 768 ? "12px" : "14px",
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
                      reader.onload = async () => {
                        const result = reader.result as string;
                        setImagePreview(result);
                        await classifyImageBase64(result);
                      };
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
                {!imagePreview && (
                  <div
                    style={{
                      width: "100%",
                      minHeight: "200px",
                      border: "2px dashed #e9ecef",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#6c757d",
                      fontSize: "14px",
                    }}
                  >
                    圖片預覽區域
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Buttons at bottom */}
          <div
            style={{
              display: "flex",
              gap: window.innerWidth <= 768 ? "10px" : "15px",
              justifyContent: "center",
              marginTop: window.innerWidth <= 768 ? "16px" : "30px",
            }}
          >
            <button
              type="button"
              onClick={handleSaveProduct}
              disabled={isLoading}
              style={{
                backgroundColor: "#D59C00",
                color: "white",
                border: "none",
                padding: window.innerWidth <= 768 ? "10px 20px" : "12px 30px",
                borderRadius: "25px",
                fontSize: window.innerWidth <= 768 ? "14px" : "16px",
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
                padding: window.innerWidth <= 768 ? "8px 18px" : "10px 30px",
                borderRadius: "25px",
                fontSize: window.innerWidth <= 768 ? "14px" : "16px",
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
