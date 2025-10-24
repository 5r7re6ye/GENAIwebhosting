interface MenuItem {
  id: string;
  label: string;
  icon: string;
  badge?: string | number;
}

interface FunctionMenuProps {
  title: string;
  menuItems: MenuItem[];
  selectedFunction: string;
  onFunctionSelect: (functionId: string) => void;
}

function FunctionMenu({
  title,
  menuItems,
  selectedFunction,
  onFunctionSelect,
}: FunctionMenuProps) {
  return (
    <div className="col-md-3 bg-light border-end p-0">
      <div className="p-3">
        <h5 className="mb-3">{title}</h5>
        <div className="list-group list-group-flush">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`list-group-item list-group-item-action ${
                selectedFunction === item.id ? "active" : ""
              }`}
              onClick={() => onFunctionSelect(item.id)}
            >
              <i className={`${item.icon} me-2`}></i>
              {item.label}
              {item.badge && (
                <span className="badge bg-primary ms-2">{item.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default FunctionMenu;
