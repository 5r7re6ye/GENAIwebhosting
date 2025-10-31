interface CartProps {
  cart: any[];
  onUpdateCartQuantity: (productId: string, newQuantity: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onNavigateToProducts: () => void;
  getTotalPrice: () => number;
  onConfirmOrder: () => void;
}

function Cart({
  cart,
  onUpdateCartQuantity,
  onRemoveFromCart,
  onNavigateToProducts,
  getTotalPrice,
  onConfirmOrder,
}: CartProps) {
  const isMobile = window.innerWidth <= 768;
  
  return (
    <div className="p-4" style={{ padding: isMobile ? "12px" : "24px" }}>
      <h3 className="mb-4" style={{ fontSize: isMobile ? "18px" : "24px", marginBottom: isMobile ? "12px" : "24px" }}>
        購物車
      </h3>

      {cart.length === 0 ? (
        <div className="text-center text-muted">
          <p>購物車是空的</p>
          <button className="btn btn-primary" onClick={onNavigateToProducts}>
            瀏覽商品
          </button>
        </div>
      ) : isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
          {cart.map((item) => (
            <div key={item.id} style={{
              backgroundColor: "white",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #e9ecef",
              fontSize: "12px"
            }}>
              <div style={{ fontWeight: "bold", marginBottom: "6px" }}>{item.name}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span>單價: ${item.price}</span>
                <span style={{ fontWeight: "bold" }}>小計: ${(item.price * item.quantity).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="input-group" style={{ width: "100px" }}>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => onUpdateCartQuantity(item.id, item.quantity - 1)}
                    style={{ padding: "4px 8px", fontSize: "12px" }}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    className="form-control form-control-sm text-center"
                    value={item.quantity}
                    onChange={(e) => onUpdateCartQuantity(item.id, parseInt(e.target.value) || 0)}
                    min="1"
                    style={{ padding: "4px", fontSize: "12px" }}
                  />
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => onUpdateCartQuantity(item.id, item.quantity + 1)}
                    style={{ padding: "4px 8px", fontSize: "12px" }}
                  >
                    +
                  </button>
                </div>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => onRemoveFromCart(item.id)}
                  style={{ padding: "6px 12px", fontSize: "12px" }}
                >
                  移除
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>商品名稱</th>
                  <th>單價</th>
                  <th>數量</th>
                  <th>小計</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>${item.price}</td>
                    <td>
                      <div className="input-group" style={{ width: "120px" }}>
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() =>
                            onUpdateCartQuantity(item.id, item.quantity - 1)
                          }
                        >
                          -
                        </button>
                        <input
                          type="number"
                          className="form-control form-control-sm text-center"
                          value={item.quantity}
                          onChange={(e) =>
                            onUpdateCartQuantity(
                              item.id,
                              parseInt(e.target.value) || 0
                            )
                          }
                          min="1"
                        />
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() =>
                            onUpdateCartQuantity(item.id, item.quantity + 1)
                          }
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td>${(item.price * item.quantity).toFixed(2)}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => onRemoveFromCart(item.id)}
                      >
                        移除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4" style={{ marginTop: isMobile ? "12px" : "24px" }}>
            <div className="d-flex justify-content-between align-items-center">
              <h4 style={{ fontSize: isMobile ? "16px" : "20px", margin: 0 }}>
                總計: ${getTotalPrice().toFixed(2)}
              </h4>
              <button
                className="btn btn-success btn-lg"
                onClick={onConfirmOrder}
                style={{ padding: isMobile ? "8px 16px" : "12px 24px", fontSize: isMobile ? "13px" : "16px" }}
              >
                確認
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Cart;
