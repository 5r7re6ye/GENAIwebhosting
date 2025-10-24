import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../../firebase/config";

interface OrdersProps {
  user: any;
}

function Orders({ user }: OrdersProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirmOrder = async (orderId: string) => {
    setIsLoading(true);
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: "confirmed",
        confirmedAt: new Date(),
      });
      alert("訂單已確認！");
    } catch (error) {
      console.error("Error confirming order:", error);
      alert("確認訂單失敗，請重試");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch orders for the current seller
  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, "orders"),
        where("sellerId", "==", user.uid)
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const ordersList: any[] = [];
        querySnapshot.forEach((doc) => {
          ordersList.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        console.log("Fetched seller orders:", ordersList);
        console.log("Current seller UID:", user.uid);
        console.log(
          "Orders with sellerId:",
          ordersList.filter((order) => order.sellerId === user.uid)
        );
        setOrders(ordersList);
      });

      return () => unsubscribe();
    }
  }, [user]);

  return (
    <div className="p-4">
      <h3 className="mb-4">訂單管理</h3>

      {orders.length === 0 ? (
        <div className="text-center text-muted">
          <p>尚無訂單記錄</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>訂單編號</th>
                <th>買家</th>
                <th>商品</th>
                <th>數量</th>
                <th>總金額</th>
                <th>訂單時間</th>
                <th>狀態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.orderNumber}</td>
                  <td>{order.buyerName || "未知買家"}</td>
                  <td>
                    {order.items.map((item: any, index: number) => (
                      <div key={index}>
                        {item.name} - ${item.price}
                      </div>
                    ))}
                  </td>
                  <td>
                    {order.items.map((item: any, index: number) => (
                      <div key={index}>{item.quantity}</div>
                    ))}
                  </td>
                  <td>${order.totalAmount.toFixed(2)}</td>
                  <td>
                    {order.createdAt
                      ? order.createdAt.toDate
                        ? order.createdAt.toDate().toLocaleDateString("zh-TW")
                        : new Date(
                            order.createdAt.seconds * 1000
                          ).toLocaleDateString("zh-TW")
                      : "未知"}
                  </td>
                  <td>
                    {order.status === "pending" ? (
                      <span className="badge bg-warning">待確認</span>
                    ) : (
                      <span className="badge bg-success">已確認</span>
                    )}
                  </td>
                  <td>
                    {order.status === "pending" && (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleConfirmOrder(order.id)}
                        disabled={isLoading}
                      >
                        {isLoading ? "確認中..." : "確認訂單"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Orders;
