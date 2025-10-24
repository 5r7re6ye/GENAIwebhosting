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
  return (
    <div className="p-4">
      <h3 className="mb-4">購物車</h3>

      {cart.length === 0 ? (
        <div className="text-center text-muted">
          <p>購物車是空的</p>
          <button className="btn btn-primary" onClick={onNavigateToProducts}>
            瀏覽商品
          </button>
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

          <div className="mt-4">
            <div className="d-flex justify-content-between align-items-center">
              <h4>總計: ${getTotalPrice().toFixed(2)}</h4>
              <button
                className="btn btn-success btn-lg"
                onClick={onConfirmOrder}
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
