import { useState, useEffect, useRef } from "react";
import {
  collection,
  serverTimestamp,
  onSnapshot,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../../firebase/config";
import GHeader from "../../Global/Header";
import Alert from "../../Global/Alert";
import AddProduct from "./AddProduct";
import Orders from "./Orders";
import Dashboard from "./Dashboard";
import FindBuyers from "./FindBuyers";
import Profile from "../../Global/Profile";
import FunctionMenu from "../../Global/FunctionMenu";
import Messages from "../../Global/Messages";
import FindUsers from "../../Global/FindUsers";
import AIChat from "../../Global/AIChat";

interface SellerDashboardProps {
  user: any;
  onLogout: () => void;
}

function SellerDashboard({ user, onLogout }: SellerDashboardProps) {
  const [selectedFunction, setSelectedFunction] = useState("dashboard");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    type: "success" as "success" | "error" | "warning" | "info",
  });

  // Product-related states
  const [products, setProducts] = useState<any[]>([]);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    quantity: "",
    weight: "",
    type: "",
    price: "",
    description: "",
  });
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string>("");

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

      // Strip data URL prefix if present
      const base64Data = base64.includes(",") ? base64.split(",")[1] : base64;
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

    const predictions = data.predictions || [];
    const top = predictions.length > 0 ? predictions[0] : null;

    if (top && top.class) {
      const label = top.class;
      const confidence = top.confidence || 0;

      console.log(
        `Classification result: ${label} (${(confidence * 100).toFixed(1)}%)`
      );

      if (confidence >= 0.3) {
        setEditForm((prev) => {
          const newForm = { ...prev, type: mapLabelToType(label) };
          if (!prev.description) {
            newForm.description = generateDescription(label);
          }
          return newForm;
        });
      } else {
        console.log("Confidence too low, ignoring prediction");
      }
    }
  };

  // Message-related states
  const [messageView, setMessageView] = useState<"messages" | "findUsers">(
    "messages"
  );
  const [selectedChatUser, setSelectedChatUser] = useState<{
    userId: string;
    userName: string;
  } | null>(null);

  // Selected buyer profile for viewing
  const [selectedBuyer, setSelectedBuyer] = useState<any>(null);

  // AI Chat (overlay) state - no longer used for inline variant
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);

  // Fetch products for the current seller
  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, "products"),
        where("sellerId", "==", user.uid)
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const productsList: any[] = [];
        querySnapshot.forEach((doc) => {
          productsList.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        setProducts(productsList);
      });

      return () => unsubscribe();
    }
  }, [user]);

  // Product management functions
  const handleAddProduct = () => {
    setSelectedFunction("addProduct");
  };

  const handleAddProductSuccess = () => {
    setSelectedFunction("products");
  };

  const handleAddProductCancel = () => {
    setSelectedFunction("products");
  };

  // Define menu items for seller dashboard
  const sellerMenuItems = [
    {
      id: "dashboard",
      label: "儀表板",
      icon: "fas fa-tachometer-alt",
    },
    {
      id: "products",
      label: "廢料管理",
      icon: "fas fa-box",
    },
    {
      id: "orders",
      label: "訂單管理",
      icon: "fas fa-shopping-cart",
    },
    {
      id: "findBuyers",
      label: "尋找買家",
      icon: "fas fa-search",
    },
    {
      id: "messages",
      label: "訊息",
      icon: "fas fa-comments",
    },
    {
      id: "profile",
      label: "個人資料",
      icon: "fas fa-user",
    },
    {
      id: "aiChat",
      label: "AI 助手",
      icon: "fas fa-robot",
    },
  ];

  const showAlert = (
    message: string,
    type: "success" | "error" | "warning" | "info"
  ) => {
    setAlert({ show: true, message, type });
  };

  const hideAlert = () => {
    setAlert({ show: false, message: "", type: "success" });
  };

  const handleDeleteProduct = async (
    productId: string,
    productName: string
  ) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `確定要刪除廢料 "${productName}" 嗎？\n\n此操作無法復原！`
    );

    if (!confirmed) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Delete product from Firestore
      await deleteDoc(doc(db, "products", productId));
      console.log("Product deleted successfully");
      showAlert("廢料已成功刪除！", "success");
    } catch (error: any) {
      console.error("Error deleting product: ", error);
      setError("刪除失敗: " + error.message);
      showAlert("刪除失敗: " + error.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Edit product functions
  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      quantity: product.quantity.toString(),
      weight: product.weight.toString(),
      type: product.type,
      price: product.price.toString(),
      description: product.description || "",
    });
    setEditImageFile(null);
    setEditImagePreview(product.photoURL || "");
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;

    // Validate form
    if (
      !editForm.name ||
      !editForm.quantity ||
      !editForm.weight ||
      !editForm.type ||
      !editForm.price
    ) {
      setError("請填寫所有欄位");
      return;
    }

    const quantity = parseInt(editForm.quantity);
    const weight = parseFloat(editForm.weight);
    const price = parseFloat(editForm.price);

    if (isNaN(quantity) || quantity < 0) {
      setError("數量必須是大於等於0的整數");
      return;
    }

    if (isNaN(weight) || weight <= 0) {
      setError("重量必須是大於0的數字");
      return;
    }

    if (isNaN(price) || price <= 0) {
      setError("價格必須是大於0的數字");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Optional: convert image to base64 data URL (no Firebase Storage)
      let photoURL = editingProduct.photoURL || null;
      if (editImageFile) {
        photoURL = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(editImageFile);
        });
      }

      await updateDoc(doc(db, "products", editingProduct.id), {
        name: editForm.name,
        quantity: quantity,
        weight: weight,
        type: editForm.type,
        price: price,
        description: editForm.description,
        photoURL: photoURL,
        updatedAt: serverTimestamp(),
      });

      setEditingProduct(null);
      setEditImageFile(null);
      setEditImagePreview("");
      showAlert("廢料已成功更新！", "success");
    } catch (error: any) {
      console.error("Error updating product:", error);
      setError("更新失敗: " + error.message);
      showAlert("更新失敗: " + error.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setEditForm({
      name: "",
      quantity: "",
      weight: "",
      type: "",
      price: "",
      description: "",
    });
    setEditImageFile(null);
    setEditImagePreview("");
    setError("");
  };

  // Profile management function
  const renderMainPanel = () => {
    switch (selectedFunction) {
      case "dashboard":
        return <Dashboard user={user} />;

      case "products":
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
              廢料管理
            </h3>

            <div style={{ marginBottom: "20px" }}>
              <button
                onClick={handleAddProduct}
                style={{
                  backgroundColor: "#D59C00",
                  color: "white",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "25px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                創造請求
              </button>
            </div>

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

            {/* Edit Form */}
            {editingProduct && (
              <div
                style={{
                  backgroundColor: "white",
                  padding: "30px",
                  borderRadius: "20px",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
                  marginBottom: "30px",
                }}
              >
                <h4
                  style={{
                    color: "#6c757d",
                    fontSize: "20px",
                    fontWeight: "bold",
                    marginBottom: "20px",
                  }}
                >
                  編輯廢料
                </h4>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "20px",
                    marginBottom: "20px",
                  }}
                >
                  <div>
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
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
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

                  <div>
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
                      value={editForm.quantity}
                      onChange={(e) =>
                        setEditForm({ ...editForm, quantity: e.target.value })
                      }
                      disabled={isLoading}
                      min="0"
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

                  <div>
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
                      step="0.1"
                      value={editForm.weight}
                      onChange={(e) =>
                        setEditForm({ ...editForm, weight: e.target.value })
                      }
                      disabled={isLoading}
                      min="0"
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

                  <div>
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
                      step="0.01"
                      value={editForm.price}
                      onChange={(e) =>
                        setEditForm({ ...editForm, price: e.target.value })
                      }
                      disabled={isLoading}
                      min="0"
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
                </div>

                {/* Description */}
                <div style={{ marginTop: "10px", marginBottom: "20px" }}>
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
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
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
                <div style={{ marginBottom: "10px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      color: "#6c757d",
                      fontSize: "14px",
                      fontWeight: "bold",
                    }}
                  >
                    變更圖片 (選填)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isLoading}
                    onChange={(e) => {
                      const file = e.target.files && e.target.files[0];
                      if (file) {
                        setEditImageFile(file);
                        const reader = new FileReader();
                        reader.onload = async () => {
                          const result = reader.result as string;
                          setEditImagePreview(result);
                          await classifyImageBase64(result);
                        };
                        reader.readAsDataURL(file);
                      } else {
                        setEditImageFile(null);
                        setEditImagePreview(editingProduct?.photoURL || "");
                      }
                    }}
                    style={{ display: "block", marginBottom: "10px" }}
                  />
                  {editImagePreview && (
                    <img
                      src={editImagePreview}
                      alt="預覽"
                      style={{
                        maxWidth: "100%",
                        borderRadius: "8px",
                        border: "1px solid #e9ecef",
                      }}
                    />
                  )}
                </div>

                <div>
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
                    value={editForm.type}
                    onChange={(e) =>
                      setEditForm({ ...editForm, type: e.target.value })
                    }
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
                  style={{ display: "flex", gap: "15px", marginTop: "20px" }}
                >
                  <button
                    onClick={handleSaveEdit}
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
                    {isLoading ? "儲存中..." : "儲存"}
                  </button>
                  <button
                    onClick={handleCancelEdit}
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
              </div>
            )}

            {/* Desktop Table View */}
            <div
              className="d-none d-md-block"
              style={{
                backgroundColor: "white",
                borderRadius: "10px",
                overflow: "hidden",
                boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontFamily: "sans-serif",
                }}
              >
                <thead>
                  <tr
                    style={{
                      backgroundColor: "#f8f9fa",
                      borderBottom: "2px solid #e9ecef",
                    }}
                  >
                    <th
                      style={{
                        padding: "15px 20px",
                        textAlign: "left",
                        color: "#6c757d",
                        fontWeight: "bold",
                        fontSize: "14px",
                      }}
                    >
                      廢料名稱
                    </th>
                    <th
                      style={{
                        padding: "15px 20px",
                        textAlign: "left",
                        color: "#6c757d",
                        fontWeight: "bold",
                        fontSize: "14px",
                      }}
                    >
                      數量
                    </th>
                    <th
                      style={{
                        padding: "15px 20px",
                        textAlign: "left",
                        color: "#6c757d",
                        fontWeight: "bold",
                        fontSize: "14px",
                      }}
                    >
                      重量 (kg)
                    </th>
                    <th
                      style={{
                        padding: "15px 20px",
                        textAlign: "left",
                        color: "#6c757d",
                        fontWeight: "bold",
                        fontSize: "14px",
                      }}
                    >
                      種類
                    </th>
                    <th
                      style={{
                        padding: "15px 20px",
                        textAlign: "center",
                        color: "#6c757d",
                        fontWeight: "bold",
                        fontSize: "14px",
                      }}
                    >
                      價格 ($)
                    </th>
                    <th
                      style={{
                        padding: "15px 20px",
                        textAlign: "left",
                        color: "#6c757d",
                        fontWeight: "bold",
                        fontSize: "14px",
                      }}
                    >
                      建立時間
                    </th>
                    <th
                      style={{
                        padding: "15px 20px",
                        textAlign: "center",
                        color: "#6c757d",
                        fontWeight: "bold",
                        fontSize: "14px",
                      }}
                    >
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        style={{
                          textAlign: "center",
                          color: "#6c757d",
                          padding: "40px",
                          fontSize: "16px",
                        }}
                      >
                        尚無廢料資料
                      </td>
                    </tr>
                  ) : (
                    products.map((product, index) => (
                      <tr
                        key={product.id}
                        style={{
                          borderBottom:
                            index < products.length - 1
                              ? "1px solid #e9ecef"
                              : "none",
                        }}
                      >
                        <td
                          style={{
                            padding: "15px 20px",
                            color: "#6c757d",
                            fontSize: "14px",
                          }}
                        >
                          {product.name}
                        </td>
                        <td
                          style={{
                            padding: "15px 20px",
                            color: "#6c757d",
                            fontSize: "14px",
                          }}
                        >
                          {product.quantity}
                        </td>
                        <td
                          style={{
                            padding: "15px 20px",
                            color: "#6c757d",
                            fontSize: "14px",
                          }}
                        >
                          {product.weight}
                        </td>
                        <td
                          style={{
                            padding: "15px 20px",
                            color: "#6c757d",
                            fontSize: "14px",
                          }}
                        >
                          {product.type}
                        </td>
                        <td
                          style={{
                            padding: "15px 20px",
                            textAlign: "center",
                            color: "#6c757d",
                            fontSize: "14px",
                          }}
                        >
                          ${product.price}
                        </td>
                        <td
                          style={{
                            padding: "15px 20px",
                            color: "#6c757d",
                            fontSize: "14px",
                          }}
                        >
                          {product.createdAt
                            ? new Date(
                                product.createdAt.seconds * 1000
                              ).toLocaleDateString("zh-TW")
                            : "N/A"}
                        </td>
                        <td
                          style={{
                            padding: "15px 20px",
                            textAlign: "center",
                          }}
                        >
                          <button
                            onClick={() => handleEditProduct(product)}
                            disabled={isLoading}
                            style={{
                              backgroundColor: "#D59C00",
                              color: "white",
                              border: "none",
                              padding: "6px 12px",
                              borderRadius: "15px",
                              fontSize: "12px",
                              fontWeight: "bold",
                              cursor: isLoading ? "not-allowed" : "pointer",
                              marginRight: "8px",
                              opacity: isLoading ? 0.7 : 1,
                              transition: "all 0.3s ease",
                            }}
                          >
                            編輯
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteProduct(product.id, product.name)
                            }
                            disabled={isLoading}
                            style={{
                              backgroundColor: "#dc3545",
                              color: "white",
                              border: "none",
                              padding: "6px 12px",
                              borderRadius: "15px",
                              fontSize: "12px",
                              fontWeight: "bold",
                              cursor: isLoading ? "not-allowed" : "pointer",
                              opacity: isLoading ? 0.7 : 1,
                              transition: "all 0.3s ease",
                            }}
                          >
                            {isLoading ? "刪除中..." : "刪除"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="d-md-none">
              {products.length === 0 ? (
                <div style={{
                  textAlign: "center",
                  color: "#6c757d",
                  padding: "30px",
                  fontSize: "14px",
                  backgroundColor: "white",
                  borderRadius: "10px",
                }}>
                  尚無廢料資料
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {products.map((product) => (
                    <div key={product.id} style={{
                      backgroundColor: "white",
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid #e9ecef",
                      fontSize: "12px"
                    }}>
                      <div style={{ fontWeight: "bold", marginBottom: "6px", fontSize: "13px" }}>
                        {product.name}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "8px", fontSize: "11px", color: "#6c757d" }}>
                        <div>數量: {product.quantity}</div>
                        <div>重量: {product.weight} kg</div>
                        <div>種類: {product.type}</div>
                        <div>價格: ${product.price}</div>
                      </div>
                      <div style={{ fontSize: "10px", color: "#6c757d", marginBottom: "8px" }}>
                        {product.createdAt
                          ? new Date(product.createdAt.seconds * 1000).toLocaleDateString("zh-TW")
                          : "N/A"}
                      </div>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => handleEditProduct(product)}
                          disabled={isLoading}
                          style={{
                            backgroundColor: "#D59C00",
                            color: "white",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "bold",
                            cursor: isLoading ? "not-allowed" : "pointer",
                            opacity: isLoading ? 0.7 : 1,
                            transition: "all 0.3s ease",
                          }}
                        >
                          編輯
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          disabled={isLoading}
                          style={{
                            backgroundColor: "#dc3545",
                            color: "white",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "bold",
                            cursor: isLoading ? "not-allowed" : "pointer",
                            opacity: isLoading ? 0.7 : 1,
                            transition: "all 0.3s ease",
                          }}
                        >
                          {isLoading ? "刪除中..." : "刪除"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case "addProduct":
        return (
          <AddProduct
            user={user}
            onSuccess={handleAddProductSuccess}
            onCancel={handleAddProductCancel}
          />
        );

      case "orders":
        return <Orders user={user} />;

      case "findBuyers":
        return (
          <FindBuyers
            user={user}
            onContactBuyer={(buyerId, buyerName) => {
              setSelectedChatUser({ userId: buyerId, userName: buyerName });
              setSelectedFunction("messages");
            }}
            onViewBuyer={(buyer) => {
              setSelectedBuyer(buyer);
              setSelectedFunction("buyerInfo");
            }}
          />
        );

      case "messages":
        return (
          <div className="h-100">
            {messageView === "messages" ? (
              <Messages
                user={user}
                userType="seller"
                onStartChat={(userId: string, userName: string) => {
                  setSelectedChatUser({ userId, userName });
                }}
                selectedChatUser={selectedChatUser}
              />
            ) : (
              <FindUsers
                user={user}
                userType="seller"
                onStartChat={(userId: string, userName: string) => {
                  setSelectedChatUser({ userId, userName });
                  setMessageView("messages");
                }}
              />
            )}
            <div className="p-3 border-top">
              <button
                className={`btn me-2 ${
                  messageView === "messages"
                    ? "btn-primary"
                    : "btn-outline-primary"
                }`}
                onClick={() => setMessageView("messages")}
              >
                訊息列表
              </button>
              <button
                className={`btn ${
                  messageView === "findUsers"
                    ? "btn-primary"
                    : "btn-outline-primary"
                }`}
                onClick={() => setMessageView("findUsers")}
              >
                尋找買家
              </button>
            </div>
          </div>
        );

      case "profile":
        return <Profile user={user} userType="seller" />;

      case "aiChat":
        return (
          <div className="h-100">
            <AIChat variant="inline" />
          </div>
        );

      case "buyerInfo":
        return (
          <div className="h-100">
            {selectedBuyer ? (
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">買家資料</h5>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setSelectedFunction("findBuyers")}
                  >
                    返回
                  </button>
                </div>
                <div className="card-body">
                  <h5 className="card-title">
                    {selectedBuyer.username || "未設定用戶名"}
                  </h5>
                  <p className="card-text">
                    <strong>電子郵件:</strong> {selectedBuyer.email}
                    <br />
                    {selectedBuyer.phoneNumber && (
                      <>
                        <strong>電話號碼:</strong> {selectedBuyer.phoneNumber}
                        <br />
                      </>
                    )}
                    {selectedBuyer.location && (
                      <>
                        <strong>地點:</strong> {selectedBuyer.location}
                        <br />
                      </>
                    )}
                    <strong>註冊時間:</strong>{" "}
                    {selectedBuyer.createdAt
                      ? new Date(
                          selectedBuyer.createdAt.seconds * 1000
                        ).toLocaleDateString("zh-TW")
                      : "未知"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-muted">未選擇買家</div>
            )}
          </div>
        );

      default:
        return (
          <div className="p-4 text-center">
            <h3>選擇左側功能開始使用</h3>
          </div>
        );
    }
  };

  return (
    <div style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      <Alert
        show={alert.show}
        message={alert.message}
        type={alert.type}
        onClose={hideAlert}
      />

      {/* Header */}
      <div
        style={{
          backgroundColor: "white",
          padding: window.innerWidth <= 768 ? "12px 16px" : "20px 40px",
          borderBottom: "1px solid #e9ecef",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1
          style={{
            color: "#D59C00",
            fontSize: window.innerWidth <= 768 ? "24px" : "32px",
            fontWeight: "bold",
            margin: 0,
            fontFamily: "sans-serif",
          }}
        >
          CWRS
        </h1>
        <div
          style={{
            display: window.innerWidth <= 768 ? "none" : "flex",
            gap: "30px",
          }}
        >
          <a
            href="#"
            style={{
              color: "#6c757d",
              textDecoration: "none",
              fontSize: "16px",
            }}
          >
            About us
          </a>
          <a
            href="#"
            style={{
              color: "#6c757d",
              textDecoration: "none",
              fontSize: "16px",
            }}
          >
            Contact
          </a>
          <a
            href="#"
            style={{
              color: "#6c757d",
              textDecoration: "none",
              fontSize: "16px",
            }}
          >
            Update
          </a>
        </div>
      </div>

      <div style={{ display: "flex", height: "calc(100vh - 80px)" }}>
        {/* Sidebar (desktop/tablet) */}
        <div
          className="d-none d-md-flex"
          style={{
            width: "250px",
            backgroundColor: "#f1f3f4",
            padding: "20px 0",
            flexDirection: "column",
          }}
        >
          {sellerMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedFunction(item.id)}
              style={{
                backgroundColor:
                  selectedFunction === item.id ? "#D59C00" : "transparent",
                color: selectedFunction === item.id ? "white" : "#6c757d",
                border: "none",
                padding: "15px 20px",
                textAlign: "left",
                fontSize: "16px",
                cursor: "pointer",
                borderRadius:
                  selectedFunction === item.id ? "0 25px 25px 0" : "0",
                marginRight: selectedFunction === item.id ? "0" : "10px",
                transition: "all 0.3s ease",
              }}
            >
              <i className={`${item.icon} me-2`}></i>
              {item.label}
            </button>
          ))}

          {/* Logout Button */}
          <button
            onClick={onLogout}
            style={{
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "20px",
              fontSize: "14px",
              cursor: "pointer",
              margin: "auto 20px 20px 20px",
              width: "calc(100% - 40px)",
            }}
          >
            登出
          </button>
        </div>

        {/* Main Content */}
        <div
          style={{
            flex: 1,
            padding: window.innerWidth <= 768 ? "16px" : "30px",
            paddingBottom: window.innerWidth <= 768 ? "90px" : "30px",
            overflowY: "auto",
            backgroundColor: "#f8f9fa",
          }}
        >
          {renderMainPanel()}
        </div>
      </div>

      {/* Bottom navigation (mobile) */}
      <div
        className="d-md-none"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#ffffff",
          borderTop: "1px solid #e9ecef",
          display: "flex",
          justifyContent: "space-around",
          padding: "8px 6px",
          zIndex: 1000,
        }}
      >
        {sellerMenuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setSelectedFunction(item.id)}
            style={{
              background: "transparent",
              border: "none",
              color: selectedFunction === item.id ? "#D59C00" : "#6c757d",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              fontSize: "12px",
            }}
          >
            <i className={`${item.icon}`} style={{ fontSize: "18px" }}></i>
            <span style={{ marginTop: 4 }}>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Overlay AI Chat removed in favor of inline variant above */}
    </div>
  );
}

export default SellerDashboard;
