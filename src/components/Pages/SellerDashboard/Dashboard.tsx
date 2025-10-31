import { useState, useEffect } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../../firebase/config";

interface DashboardProps {
  user: any;
}

function Dashboard({ user }: DashboardProps) {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Fetch products count
    const productsQuery = query(
      collection(db, "products"),
      where("sellerId", "==", user.uid)
    );

    // Fetch orders
    const ordersQuery = query(
      collection(db, "orders"),
      where("sellerId", "==", user.uid)
    );

    const unsubscribeProducts = onSnapshot(
      productsQuery,
      (productsSnapshot) => {
        const productCount = productsSnapshot.size;

        const unsubscribeOrders = onSnapshot(ordersQuery, (ordersSnapshot) => {
          let totalRevenue = 0;
          let pendingOrders = 0;
          let confirmedOrders = 0;
          const orders: any[] = [];

          ordersSnapshot.forEach((doc) => {
            const orderData = doc.data();
            orders.push({
              id: doc.id,
              ...orderData,
            });

            totalRevenue += orderData.totalAmount || 0;

            if (orderData.status === "pending") {
              pendingOrders++;
            } else if (orderData.status === "confirmed") {
              confirmedOrders++;
            }
          });

          // Sort orders by creation date (most recent first)
          orders.sort((a, b) => {
            const dateA = a.createdAt?.toDate
              ? a.createdAt.toDate()
              : new Date(a.createdAt?.seconds * 1000);
            const dateB = b.createdAt?.toDate
              ? b.createdAt.toDate()
              : new Date(b.createdAt?.seconds * 1000);
            return dateB.getTime() - dateA.getTime();
          });

          setStats({
            totalProducts: productCount,
            totalOrders: ordersSnapshot.size,
            totalRevenue: totalRevenue,
            pendingOrders: pendingOrders,
            confirmedOrders: confirmedOrders,
          });

          setRecentOrders(orders.slice(0, 5)); // Show only 5 most recent orders
          setIsLoading(false);
        });

        return () => unsubscribeOrders();
      }
    );

    return () => unsubscribeProducts();
  }, [user]);

  if (isLoading) {
    return (
      <div className="p-4">
        <h3 className="mb-4">儀表板概覽</h3>
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">載入中...</span>
          </div>
        </div>
      </div>
    );
  }

  const isMobile = window.innerWidth <= 768;
  
  return (
    <div style={{ padding: isMobile ? "12px" : "0" }}>
      {/* Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
          gap: isMobile ? "8px" : "20px",
          marginBottom: isMobile ? "16px" : "40px",
        }}
      >
        <div
          style={{
            backgroundColor: "#D59C00",
            borderRadius: isMobile ? "12px" : "20px",
            padding: isMobile ? "12px" : "25px",
            color: "white",
            textAlign: "center",
          }}
        >
          <h4
            style={{
              margin: "0 0 8px 0",
              fontSize: isMobile ? "11px" : "16px",
              fontWeight: "normal",
            }}
          >
            待回收廢料
          </h4>
          <h1 style={{ margin: 0, fontSize: isMobile ? "28px" : "48px", fontWeight: "bold" }}>
            {stats.totalProducts}
          </h1>
        </div>

        <div
          style={{
            backgroundColor: "#D59C00",
            borderRadius: isMobile ? "12px" : "20px",
            padding: isMobile ? "12px" : "25px",
            color: "white",
            textAlign: "center",
          }}
        >
          <h4
            style={{
              margin: "0 0 8px 0",
              fontSize: isMobile ? "11px" : "16px",
              fontWeight: "normal",
            }}
          >
            回收確認中
          </h4>
          <h1 style={{ margin: 0, fontSize: isMobile ? "28px" : "48px", fontWeight: "bold" }}>
            {stats.pendingOrders}
          </h1>
        </div>

        <div
          style={{
            backgroundColor: "#D59C00",
            borderRadius: isMobile ? "12px" : "20px",
            padding: isMobile ? "12px" : "25px",
            color: "white",
            textAlign: "center",
          }}
        >
          <h4
            style={{
              margin: "0 0 8px 0",
              fontSize: isMobile ? "11px" : "16px",
              fontWeight: "normal",
            }}
          >
            廢料處理中
          </h4>
          <h1 style={{ margin: 0, fontSize: isMobile ? "28px" : "48px", fontWeight: "bold" }}>
            {stats.confirmedOrders}
          </h1>
        </div>

        <div
          style={{
            backgroundColor: "#D59C00",
            borderRadius: isMobile ? "12px" : "20px",
            padding: isMobile ? "12px" : "25px",
            color: "white",
            textAlign: "center",
          }}
        >
          <h4
            style={{
              margin: "0 0 8px 0",
              fontSize: isMobile ? "11px" : "16px",
              fontWeight: "normal",
            }}
          >
            總收入
          </h4>
          <h1 style={{ margin: 0, fontSize: isMobile ? "28px" : "48px", fontWeight: "bold" }}>
            ${stats.totalRevenue.toFixed(0)}
          </h1>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div>
        <h3
          style={{
            color: "#6c757d",
            fontSize: isMobile ? "16px" : "20px",
            fontWeight: "bold",
            marginBottom: isMobile ? "12px" : "20px",
          }}
        >
          最近回收訂單
        </h3>

        {recentOrders.length === 0 ? (
          <p
            style={{
              color: "#6c757d",
              textAlign: "center",
              fontSize: isMobile ? "12px" : "16px",
              padding: isMobile ? "20px" : "40px",
            }}
          >
            尚無訂單記錄
          </p>
        ) : isMobile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {recentOrders.map((order) => (
              <div key={order.id} style={{
                backgroundColor: "white",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #e9ecef",
                fontSize: "11px"
              }}>
                <div style={{ fontWeight: "bold", marginBottom: "6px", fontSize: "12px" }}>
                  {order.orderNumber || `#${order.id.slice(-8)}`}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span>{order.buyerName || "Buyertester"}</span>
                  <span style={{ fontWeight: "bold" }}>${order.totalAmount?.toFixed(0) || "10"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "10px", color: "#6c757d" }}>
                    {order.createdAt
                      ? order.createdAt.toDate
                        ? order.createdAt.toDate().toLocaleDateString("zh-TW")
                        : new Date(order.createdAt.seconds * 1000).toLocaleDateString("zh-TW")
                      : "2025/10/20"}
                  </span>
                  <span
                    style={{
                      backgroundColor: order.status === "confirmed" ? "#28a745" : "#ffc107",
                      color: "white",
                      padding: "2px 8px",
                      borderRadius: "10px",
                      fontSize: "10px",
                      fontWeight: "bold",
                    }}
                  >
                    {order.status === "confirmed" ? "已確認" : "待確認"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
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
                    訂單編號
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
                    回收者
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
                    金額
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
                    狀態
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
                    日期
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order, index) => (
                  <tr
                    key={order.id}
                    style={{
                      borderBottom:
                        index < recentOrders.length - 1
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
                      {order.orderNumber || `#${order.id.slice(-8)}`}
                    </td>
                    <td
                      style={{
                        padding: "15px 20px",
                        color: "#6c757d",
                        fontSize: "14px",
                      }}
                    >
                      {order.buyerName || "Buyertester"}
                    </td>
                    <td
                      style={{
                        padding: "15px 20px",
                        textAlign: "center",
                        color: "#6c757d",
                        fontSize: "14px",
                      }}
                    >
                      ${order.totalAmount?.toFixed(0) || "10"}
                    </td>
                    <td
                      style={{
                        padding: "15px 20px",
                        textAlign: "center",
                      }}
                    >
                      <span
                        style={{
                          backgroundColor:
                            order.status === "confirmed"
                              ? "#28a745"
                              : "#ffc107",
                          color: "white",
                          padding: "4px 12px",
                          borderRadius: "15px",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        {order.status === "confirmed" ? "已確認" : "待確認"}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "15px 20px",
                        color: "#6c757d",
                        fontSize: "14px",
                      }}
                    >
                      {order.createdAt
                        ? order.createdAt.toDate
                          ? order.createdAt.toDate().toLocaleDateString("zh-TW")
                          : new Date(
                              order.createdAt.seconds * 1000
                            ).toLocaleDateString("zh-TW")
                        : "2025/10/20"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
