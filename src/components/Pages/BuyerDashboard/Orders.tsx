interface OrdersProps {
  orders: any[];
}

function Orders({ orders }: OrdersProps) {
  return (
    <div className="p-4">
      <h3 className="mb-4">我的訂單</h3>

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
