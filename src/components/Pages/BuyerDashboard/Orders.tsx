interface OrdersProps {
  orders: any[];
}

function Orders({ orders }: OrdersProps) {
  const isMobile = window.innerWidth <= 768;
  
  return (
    <div className="p-4" style={{ padding: isMobile ? "12px" : "24px" }}>
      <h3 className="mb-4" style={{ fontSize: isMobile ? "18px" : "24px", marginBottom: isMobile ? "12px" : "24px" }}>
        我的訂單
      </h3>

      {orders.length === 0 ? (
        <div className="text-center text-muted">
          <p>尚無訂單記錄</p>
        </div>
      ) : isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {orders.map((order) => (
            <div key={order.id} style={{ 
              backgroundColor: "white", 
              padding: "10px", 
              borderRadius: "8px",
              border: "1px solid #e9ecef",
              fontSize: "12px"
            }}>
              <div style={{ fontWeight: "bold", marginBottom: "6px" }}>
                {order.orderNumber || order.id}
              </div>
              <div style={{ marginBottom: "4px", fontSize: "11px", color: "#6c757d" }}>
                {order.items.map((item: any, idx: number) => (
                  <div key={idx}>{item.name} x{item.quantity} - ${item.price}</div>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
                <span style={{ fontWeight: "bold" }}>${order.totalAmount.toFixed(2)}</span>
                <span className={`badge ${order.status === "pending" ? "bg-warning" : "bg-success"}`} style={{ fontSize: "10px" }}>
                  {order.status === "pending" ? "等待確認" : "已確認"}
                </span>
              </div>
              <div style={{ fontSize: "10px", color: "#6c757d", marginTop: "4px" }}>
                {order.createdAt
                  ? order.createdAt.toDate
                    ? order.createdAt.toDate().toLocaleDateString("zh-TW")
                    : new Date(order.createdAt.seconds * 1000).toLocaleDateString("zh-TW")
                  : "未知"}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>訂單編號</th>
                <th>商品</th>
                <th>數量</th>
                <th>總金額</th>
                <th>訂單時間</th>
                <th>狀態</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.orderNumber}</td>
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
                      <span className="badge bg-warning">等待賣家確認</span>
                    ) : (
                      <span className="badge bg-success">已確認</span>
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
