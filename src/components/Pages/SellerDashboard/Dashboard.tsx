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

  return (
    <div className="p-4">
      <h3 className="mb-4">儀表板概覽</h3>

      {/* Statistics Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h5 className="card-title">總產品</h5>
                  <h2 className="mb-0">{stats.totalProducts}</h2>
                </div>
                <div className="align-self-center">
                  <i className="fas fa-box fa-2x"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h5 className="card-title">總訂單</h5>
                  <h2 className="mb-0">{stats.totalOrders}</h2>
                </div>
                <div className="align-self-center">
                  <i className="fas fa-shopping-cart fa-2x"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h5 className="card-title">待確認</h5>
                  <h2 className="mb-0">{stats.pendingOrders}</h2>
                </div>
                <div className="align-self-center">
                  <i className="fas fa-clock fa-2x"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card bg-info text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h5 className="card-title">總收入</h5>
                  <h2 className="mb-0">${stats.totalRevenue.toFixed(2)}</h2>
                </div>
                <div className="align-self-center">
                  <i className="fas fa-dollar-sign fa-2x"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">最近訂單</h5>
            </div>
            <div className="card-body">
              {recentOrders.length === 0 ? (
                <p className="text-muted text-center">尚無訂單記錄</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>訂單編號</th>
                        <th>買家</th>
                        <th>金額</th>
                        <th>狀態</th>
                        <th>日期</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order) => (
                        <tr key={order.id}>
                          <td>{order.orderNumber}</td>
                          <td>{order.buyerName || "未知買家"}</td>
                          <td>${order.totalAmount?.toFixed(2) || "0.00"}</td>
                          <td>
                            {order.status === "pending" ? (
                              <span className="badge bg-warning">待確認</span>
                            ) : (
                              <span className="badge bg-success">已確認</span>
                            )}
                          </td>
                          <td>
                            {order.createdAt
                              ? order.createdAt.toDate
                                ? order.createdAt
                                    .toDate()
                                    .toLocaleDateString("zh-TW")
                                : new Date(
                                    order.createdAt.seconds * 1000
                                  ).toLocaleDateString("zh-TW")
                              : "未知"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
