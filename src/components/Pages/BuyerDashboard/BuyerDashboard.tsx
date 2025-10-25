import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  addDoc,
  updateDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../firebase/config";
import GHeader from "../../Global/Header";
import Profile from "../../Global/Profile";
import Products from "./Products";
import Cart from "./Cart";
import SellerInfo from "./SellerInfo";
import Orders from "./Orders";
import ProductDetail from "./ProductDetail";
import FunctionMenu from "../../Global/FunctionMenu";
import Messages from "../../Global/Messages";
import FindUsers from "../../Global/FindUsers";
import AIChat from "../../Global/AIChat";

interface BuyerDashboardProps {
  user: any;
  onLogout: () => void;
}

function BuyerDashboard({ user, onLogout }: BuyerDashboardProps) {
  const [buyerSelectedFunction, setBuyerSelectedFunction] =
    useState("products");
  const [cart, setCart] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

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

  // Fetch orders for the current buyer
  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, "orders"),
        where("buyerId", "==", user.uid)
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const ordersList: any[] = [];
        querySnapshot.forEach((doc) => {
          ordersList.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        setOrders(ordersList);
      });

      return () => unsubscribe();
    }
  }, [user]);

  // Cart management functions
  const handleAddToCart = (product: any) => {
    const existingItem = cart.find((item) => item.id === product.id);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.id !== productId));
  };

  const handleUpdateCartQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(productId);
    } else {
      setCart(
        cart.map((item) =>
          item.id === productId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const handleConfirmOrder = async () => {
    if (cart.length === 0) {
      alert("購物車是空的，無法確認訂單");
      return;
    }

    try {
      // Debug: Check cart items
      console.log("Cart items before grouping:", cart);

      // Group cart items by seller
      const ordersBySeller = cart.reduce((acc, item) => {
        console.log("Processing cart item:", item);
        const sellerId = item.sellerId;
        if (!acc[sellerId]) {
          acc[sellerId] = {
            sellerId: sellerId,
            sellerName: item.sellerName,
            items: [],
            totalAmount: 0,
          };
        }
        acc[sellerId].items.push({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        });
        acc[sellerId].totalAmount += item.price * item.quantity;
        return acc;
      }, {});

      // Get buyer name
      const buyerQuery = query(
        collection(db, "buyers"),
        where("userId", "==", user.uid)
      );
      const buyerSnapshot = await getDocs(buyerQuery);
      const buyerName = buyerSnapshot.empty
        ? "未知買家"
        : buyerSnapshot.docs[0].data().username;

      // Create orders for each seller
      const orderPromises = Object.values(ordersBySeller).map(
        async (sellerOrder: any) => {
          console.log("Creating order for seller:", sellerOrder);
          const orderData = {
            buyerId: user.uid,
            buyerName: buyerName,
            sellerId: sellerOrder.sellerId,
            sellerName: sellerOrder.sellerName,
            items: sellerOrder.items,
            totalAmount: sellerOrder.totalAmount,
            status: "pending",
            createdAt: serverTimestamp(),
          };

          console.log("Order data to be saved:", orderData);

          // Add order to Firestore
          const docRef = await addDoc(collection(db, "orders"), orderData);

          // Generate order number
          const orderNumber = `ORD-${Date.now()}-${sellerOrder.sellerId.slice(
            -4
          )}`;
          await updateDoc(docRef, { orderNumber });

          return { id: docRef.id, orderNumber, ...orderData };
        }
      );

      await Promise.all(orderPromises);

      // Clear cart
      setCart([]);

      // Show success message and navigate to orders
      alert("訂單已提交，等待賣家確認！");
      setBuyerSelectedFunction("orders");
    } catch (error) {
      console.error("Error confirming order:", error);
      alert("訂單確認失敗，請重試");
    }
  };

  // Define menu items for buyer dashboard
  const buyerMenuItems = [
    {
      id: "products",
      label: "待回收廢料",
      icon: "fas fa-box",
    },
    {
      id: "cart",
      label: "購物車",
      icon: "fas fa-shopping-cart",
      badge: cart.length,
    },
    {
      id: "orders",
      label: "我的訂單",
      icon: "fas fa-list",
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

  const handleSellerClick = async (sellerId: string) => {
    try {
      // Fetch seller information
      const sellerQuery = query(
        collection(db, "sellers"),
        where("userId", "==", sellerId)
      );
      const sellerSnapshot = await getDocs(sellerQuery);

      if (!sellerSnapshot.empty) {
        const sellerData = sellerSnapshot.docs[0].data();

        // Fetch seller profile information
        const profileQuery = query(
          collection(db, "sellerProfiles"),
          where("sellerId", "==", sellerId)
        );
        const profileSnapshot = await getDocs(profileQuery);

        const profileData = profileSnapshot.empty
          ? {}
          : profileSnapshot.docs[0].data();

        setSelectedSeller({
          id: sellerId,
          username: sellerData.username,
          email: sellerData.email,
          phoneNumber: profileData.phoneNumber || "未提供",
          createdAt: sellerData.createdAt,
        });

        setBuyerSelectedFunction("sellerInfo");
      }
    } catch (error) {
      console.error("Error fetching seller info:", error);
    }
  };

  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
    setBuyerSelectedFunction("productDetail");
  };

  const renderBuyerMainPanel = () => {
    switch (buyerSelectedFunction) {
      case "products":
        return (
          <Products
            onAddToCart={handleAddToCart}
            onSellerClick={handleSellerClick}
            onProductClick={handleProductClick}
          />
        );

      case "cart":
        return (
          <Cart
            cart={cart}
            onUpdateCartQuantity={handleUpdateCartQuantity}
            onRemoveFromCart={handleRemoveFromCart}
            onNavigateToProducts={() => setBuyerSelectedFunction("products")}
            getTotalPrice={getTotalPrice}
            onConfirmOrder={handleConfirmOrder}
          />
        );

      case "orders":
        return <Orders orders={orders} />;

      case "sellerInfo":
        return (
          <SellerInfo
            selectedSeller={selectedSeller}
            onBackToProducts={() => setBuyerSelectedFunction("products")}
            onAddToCart={handleAddToCart}
            onContactSeller={(sellerId, sellerName) => {
              setSelectedChatUser({ userId: sellerId, userName: sellerName });
              setBuyerSelectedFunction("messages");
            }}
          />
        );

      case "messages":
        return (
          <div className="h-100">
            {messageView === "messages" ? (
              <Messages
                user={user}
                userType="buyer"
                onStartChat={(userId: string, userName: string) => {
                  setSelectedChatUser({ userId, userName });
                }}
                selectedChatUser={selectedChatUser}
              />
            ) : (
              <FindUsers
                user={user}
                userType="buyer"
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
                尋找賣家
              </button>
            </div>
          </div>
        );

      case "profile":
        return <Profile user={user} userType="buyer" />;

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

      case "productDetail":
        return (
          <ProductDetail
            product={selectedProduct}
            onBackToProducts={() => setBuyerSelectedFunction("products")}
            onAddToCart={handleAddToCart}
            onSellerClick={handleSellerClick}
            onContactSeller={(sellerId, sellerName) => {
              setSelectedChatUser({ userId: sellerId, userName: sellerName });
              setBuyerSelectedFunction("messages");
            }}
          />
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
      <div
        className="container-fluid"
        style={{ height: "100vh", position: "relative" }}
      >
        {/* Main Content */}
        <div className="row" style={{ height: "100vh" }}>
          {/* Function Selection Panel (Left) */}
          <FunctionMenu
            title="功能選單"
            menuItems={buyerMenuItems}
            selectedFunction={buyerSelectedFunction}
            onFunctionSelect={setBuyerSelectedFunction}
          />

          {/* Main Function Panel (Right) */}
          <div className="col-md-9 p-0">
            <div style={{ height: "100%", overflowY: "auto" }}>
              {renderBuyerMainPanel()}
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

export default BuyerDashboard;
