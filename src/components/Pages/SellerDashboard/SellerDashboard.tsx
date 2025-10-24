import { useState, useEffect } from "react";
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
    price: "",
    quantity: "",
  });

  // Message-related states
  const [messageView, setMessageView] = useState<"messages" | "findUsers">(
    "messages"
  );
  const [selectedChatUser, setSelectedChatUser] = useState<{
    userId: string;
    userName: string;
  } | null>(null);

  // AI Chat state
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
      price: product.price.toString(),
      quantity: product.quantity.toString(),
    });
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;

    // Validate form
    if (!editForm.name || !editForm.price || !editForm.quantity) {
      setError("請填寫所有欄位");
      return;
    }

    const price = parseFloat(editForm.price);
    const quantity = parseInt(editForm.quantity);

    if (isNaN(price) || price <= 0) {
      setError("價格必須是大於0的數字");
      return;
    }

    if (isNaN(quantity) || quantity < 0) {
      setError("庫存必須是大於等於0的整數");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await updateDoc(doc(db, "products", editingProduct.id), {
        name: editForm.name,
        price: price,
        quantity: quantity,
        updatedAt: serverTimestamp(),
      });

      setEditingProduct(null);
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
    setEditForm({ name: "", price: "", quantity: "" });
    setError("");
  };

  // Profile management function
  const renderMainPanel = () => {
    switch (selectedFunction) {
      case "dashboard":
        return <Dashboard user={user} />;

      case "products":
        return (
          <div className="p-4">
            <h3 className="mb-4">廢料管理</h3>
            <div className="mb-3">
              <button className="btn btn-success" onClick={handleAddProduct}>
                創造請求
              </button>
            </div>

            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            {/* Edit Form */}
            {editingProduct && (
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">編輯廢料</h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-4">
                      <label className="form-label">廢料名稱</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                        disabled={isLoading}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">價格</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={editForm.price}
                        onChange={(e) =>
                          setEditForm({ ...editForm, price: e.target.value })
                        }
                        disabled={isLoading}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">庫存</label>
                      <input
                        type="number"
                        className="form-control"
                        value={editForm.quantity}
                        onChange={(e) =>
                          setEditForm({ ...editForm, quantity: e.target.value })
                        }
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <button
                      className="btn btn-success me-2"
                      onClick={handleSaveEdit}
                      disabled={isLoading}
                    >
                      {isLoading ? "儲存中..." : "儲存"}
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={handleCancelEdit}
                      disabled={isLoading}
                    >
                      取消
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>廢料名稱</th>
                    <th>價格</th>
                    <th>庫存</th>
                    <th>建立時間</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-muted">
                        尚無廢料資料
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product.id}>
                        <td>{product.name}</td>
                        <td>${product.price}</td>
                        <td>{product.quantity}</td>
                        <td>
                          {product.createdAt
                            ? new Date(
                                product.createdAt.seconds * 1000
                              ).toLocaleDateString("zh-TW")
                            : "N/A"}
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-primary me-2"
                            onClick={() => handleEditProduct(product)}
                            disabled={isLoading}
                          >
                            編輯
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() =>
                              handleDeleteProduct(product.id, product.name)
                            }
                            disabled={isLoading}
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
          <div className="d-flex align-items-center justify-content-center h-100">
            <div className="text-center">
              <i className="fas fa-robot fa-4x text-primary mb-3"></i>
              <h3>AI 助手</h3>
              <p className="text-muted mb-4">點擊下方按鈕開始與 AI 助手對話</p>
              <button
                className="btn btn-primary btn-lg"
                onClick={() => setIsAIChatOpen(true)}
              >
                <i className="fas fa-comments me-2"></i>
                開始對話
              </button>
            </div>
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
    <div>
      <GHeader />
      <Alert
        show={alert.show}
        message={alert.message}
        type={alert.type}
        onClose={hideAlert}
      />
      <div
        className="container-fluid"
        style={{ height: "100vh", position: "relative" }}
      >
        {/* Main Content */}
        <div className="row" style={{ height: "100vh" }}>
          {/* Function Selection Panel (Left) */}
          <FunctionMenu
            title="功能選單"
            menuItems={sellerMenuItems}
            selectedFunction={selectedFunction}
            onFunctionSelect={setSelectedFunction}
          />

          {/* Main Function Panel (Right) */}
          <div className="col-md-9 p-0">
            <div style={{ height: "100%", overflowY: "auto" }}>
              {renderMainPanel()}
            </div>
          </div>
        </div>

        {/* Logout Button - Bottom Left */}
        <button
          className="btn btn-outline-danger position-fixed"
          style={{ bottom: "20px", left: "20px", zIndex: 1000 }}
          onClick={onLogout}
        >
          登出
        </button>

        {/* AI Chat Component */}
        <AIChat isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(false)} />
      </div>
    </div>
  );
}

export default SellerDashboard;
