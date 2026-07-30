import React from "react";
import { Card } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import ShowPaymentInfo from "../cards/ShowPaymentInfo";

const Orders = ({ orders, handleStatusChange }) => {
  const showOrderInTable = (order) => (
    <table className="table table-bordered table-responsive">
      <thead className="thead-light">
        <tr>
          <th scope="col">IMG</th>
          <th scope="col">Title</th>
          <th scope="col">Price</th>
          <th scope="col">Brand</th>
          <th scope="col">Color</th>
          <th scope="col">Count</th>
          <th scope="col">Shipping</th>
        </tr>
      </thead>

      <tbody>
        {order.products.map((p, i) => (
          <tr key={i}>
            <td>
              <img
                src={p.product.images && p.product.images.length ? p.product.images[0].url : p.product.NoImg}
                style={{ maxWidth: "50px", objectFit: "cover" }}
                className="p-1"
              />
            </td>
            <td>{p.product.title}</td>
            <td>{p.product.price}</td>
            <td>{p.product.brand}</td>
            <td>{p.color}</td>
            <td>{p.count}</td>
            <td>
              {p.product.shipping === "Yes" ? (
                <CheckCircleOutlined style={{ color: "green" }} />
              ) : (
                <CloseCircleOutlined style={{ color: "red" }} />
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <>
      {orders.map((order) => (
        <Card key={order._id} className="mt-2 pb-2">
          <div>
            <ShowPaymentInfo order={order} showStatus={false} />

            <div className="row">
              <div className="col-sm-2"><div style={{ fontSize: 18 }}>สถานะการสั่งซื้อ</div></div>
              <div className="col-sm-10">
                <select
                  onChange={(e) => handleStatusChange(order._id, e.target.value)}
                  className="form-control"
                  defaultValue={order.orderStatus}
                  name="status"
                >
                  <option value="Not Processed">Not Processed</option>
                  <option value="Cash On Delivery">Cash On Delivery</option>
                  <option value="Processing">Processing</option>
                  <option value="Dispatched">Dispatched</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            {showOrderInTable(order)}
          </div>
        </Card>
      ))}
    </>
  )
};

export default Orders;
