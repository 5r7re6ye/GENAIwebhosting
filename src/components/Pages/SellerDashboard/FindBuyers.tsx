import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  query,
  getDocs,
  where,
} from "firebase/firestore";
import { db } from "../../../firebase/config";

interface FindBuyersProps {
  user: any;
  onContactBuyer?: (buyerId: string, buyerName: string) => void;
  onViewBuyer?: (buyer: any) => void;
}

function FindBuyers({ user, onContactBuyer, onViewBuyer }: FindBuyersProps) {
  const [allBuyers, setAllBuyers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchCriteria, setSearchCriteria] = useState({
    location: "",
  });

  // Fetch all buyers
  useEffect(() => {
    const q = query(collection(db, "buyers"));

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const buyersList: any[] = [];

      for (const docSnapshot of querySnapshot.docs) {
        const buyerData = docSnapshot.data();

        // Fetch buyer profile information
        try {
          const profileQuery = query(
            collection(db, "buyerProfiles"),
            where("buyerId", "==", buyerData.userId)
          );
          const profileSnapshot = await getDocs(profileQuery);

          let profileData = {};
          if (!profileSnapshot.empty) {
            profileData = profileSnapshot.docs[0].data();
          }

          buyersList.push({
            id: docSnapshot.id,
            ...buyerData,
            ...profileData,
          });
        } catch (error) {
          console.error("Error fetching buyer profile:", error);
          buyersList.push({
            id: docSnapshot.id,
            ...buyerData,
          });
        }
      }

      setAllBuyers(buyersList);
    });

    return () => unsubscribe();
  }, []);

  const filteredBuyers = allBuyers.filter((buyer) => {
    // Basic name search
    const nameMatch = buyer.username
      ? buyer.username.toLowerCase().includes(searchTerm.toLowerCase())
      : true;

    // Location search
    const locationMatch =
      !searchCriteria.location ||
      (buyer.location &&
        buyer.location
          .toLowerCase()
          .includes(searchCriteria.location.toLowerCase()));

    return nameMatch && locationMatch;
  });

  const handleCriteriaChange = (field: string, value: string) => {
    setSearchCriteria((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSearchCriteria({
      location: "",
    });
  };

  return (
    <div className="p-4">
      <h3 className="mb-4">尋找買家</h3>

      {/* Search Form */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">搜尋條件</h5>
        </div>
        <div className="card-body">
          {/* Basic Search */}
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">買家名稱</label>
              <input
                type="text"
                className="form-control"
                placeholder="搜尋買家名稱..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-6 d-flex align-items-end">
              <button
                className="btn btn-outline-secondary"
                onClick={clearSearch}
              >
                清除搜尋
              </button>
            </div>
          </div>

          {/* Location Search */}
          <div className="row">
            <div className="col-md-6 col-lg-4 mb-3">
              <label className="form-label">地點</label>
              <input
                type="text"
                className="form-control"
                placeholder="搜尋地點..."
                value={searchCriteria.location}
                onChange={(e) =>
                  handleCriteriaChange("location", e.target.value)
                }
              />
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {filteredBuyers.length === 0 ? (
          <div className="col-12 text-center text-muted">
            {searchTerm || searchCriteria.location
              ? "找不到符合搜尋條件的買家"
              : "尚無買家資料"}
          </div>
        ) : (
          filteredBuyers.map((buyer) => (
            <div key={buyer.id} className="col-md-6 col-lg-4 mb-3">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">
                    {buyer.username || "未設定用戶名"}
                  </h5>
                  <p className="card-text">
                    <strong>電子郵件:</strong> {buyer.email}
                    <br />
                    {buyer.phoneNumber && (
                      <>
                        <strong>電話號碼:</strong> {buyer.phoneNumber}
                        <br />
                      </>
                    )}
                    {buyer.location && (
                      <>
                        <strong>地點:</strong> {buyer.location}
                        <br />
                      </>
                    )}
                    <strong>註冊時間:</strong>{" "}
                    {buyer.createdAt
                      ? new Date(
                          buyer.createdAt.seconds * 1000
                        ).toLocaleDateString("zh-TW")
                      : "未知"}
                  </p>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        if (onContactBuyer) {
                          onContactBuyer(
                            buyer.userId,
                            buyer.username || buyer.email
                          );
                        } else {
                          alert(`聯繫買家: ${buyer.username || buyer.email}`);
                        }
                      }}
                    >
                      <i className="fas fa-comment me-1"></i>
                      聯絡買家
                    </button>
                    <button
                      className="btn btn-outline-info btn-sm"
                      onClick={() => {
                        if (onViewBuyer) {
                          onViewBuyer(buyer);
                        } else {
                          alert(`查看買家資料: ${buyer.username || buyer.email}`);
                        }
                      }}
                    >
                      查看資料
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default FindBuyers;
