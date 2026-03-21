"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Order {
  id: string;
  reagentName: string;
  type: string;
  orderDate: string;
  price: number;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  isVerified: boolean;
  isReimbursed: boolean;
  userId: string;
  user: {
    username: string;
  };
}

export default function OrderDetailView({
  order,
  isAdmin,
}: {
  order: Order;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    reagentName: order.reagentName,
    type: order.type,
    orderDate: order.orderDate.split("T")[0],
    price: String(order.price),
    invoiceNumber: order.invoiceNumber || "",
    invoiceDate: order.invoiceDate ? order.invoiceDate.split("T")[0] : "",
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setMessage("保存成功");
        setEditing(false);
        router.refresh();
      } else {
        const data = await res.json();
        setMessage(data.error || "保存失败");
      }
    } catch (err) {
      setMessage("保存失败，请稍后重试");
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleDelete = async () => {
    if (!confirm("确定要删除这个订单吗？")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/dashboard");
      } else {
        const data = await res.json();
        setMessage(data.error || "删除失败");
      }
    } catch (err) {
      setMessage("删除失败，请稍后重试");
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleToggleVerified = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVerified: !order.isVerified }),
      });
      if (res.ok) {
        setMessage("状态已更新");
        router.refresh();
      }
    } catch (err) {
      setMessage("更新失败");
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleToggleReimbursed = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isReimbursed: !order.isReimbursed }),
      });
      if (res.ok) {
        setMessage("状态已更新");
        router.refresh();
      }
    } catch (err) {
      setMessage("更新失败");
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">试剂管理系统</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                返回仪表盘
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div className="mb-4 rounded-md bg-green-50 p-4">
            <div className="text-sm text-green-700">{message}</div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-gray-900">订单详情</h2>
            <div className="flex space-x-2">
              {editing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="text-sm text-green-600 hover:text-green-900 disabled:opacity-50"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    取消
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    className="text-sm text-indigo-600 hover:text-indigo-900"
                  >
                    编辑
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="text-sm text-red-600 hover:text-red-900 disabled:opacity-50"
                  >
                    删除
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">
                试剂名称/规格
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.reagentName}
                  onChange={(e) =>
                    setFormData({ ...formData, reagentName: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
                />
              ) : (
                <p className="mt-1 text-sm text-gray-900">{order.reagentName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">
                试剂类型
              </label>
              {editing ? (
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
                >
                  <option value="PERSONAL_REAGENT">个人试剂</option>
                  <option value="PUBLIC_REAGENT">公共试剂</option>
                </select>
              ) : (
                <p className="mt-1 text-sm text-gray-900">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      order.type === "PUBLIC_REAGENT"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {order.type === "PUBLIC_REAGENT" ? "公共试剂" : "个人试剂"}
                  </span>
                </p>
              )}
            </div>

            {isAdmin && (
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  订购人
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {order.user.username}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-500">
                订购日期
              </label>
              {editing ? (
                <input
                  type="date"
                  value={formData.orderDate}
                  onChange={(e) =>
                    setFormData({ ...formData, orderDate: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
                />
              ) : (
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(order.orderDate).toLocaleDateString("zh-CN")}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">
                价格
              </label>
              {editing ? (
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
                />
              ) : (
                <p className="mt-1 text-sm text-gray-900">
                  ¥{Number(order.price).toFixed(2)}
                </p>
              )}
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-4">
                发票信息
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-500">
                  发票号
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.invoiceNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, invoiceNumber: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
                    placeholder="无发票可留空"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">
                    {order.invoiceNumber || "无发票"}
                  </p>
                )}
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-500">
                  开票日期
                </label>
                {editing ? (
                  <input
                    type="date"
                    value={formData.invoiceDate}
                    onChange={(e) =>
                      setFormData({ ...formData, invoiceDate: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">
                    {order.invoiceDate
                      ? new Date(order.invoiceDate).toLocaleDateString("zh-CN")
                      : "-"}
                  </p>
                )}
              </div>
            </div>

            {isAdmin && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-4">
                  管理员操作
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">核查状态</span>
                    <button
                      onClick={handleToggleVerified}
                      disabled={loading}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        order.isVerified ? "bg-green-600" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          order.isVerified ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">报销状态</span>
                    <button
                      onClick={handleToggleReimbursed}
                      disabled={loading}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        order.isReimbursed ? "bg-green-600" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          order.isReimbursed ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex space-x-4">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      order.isVerified
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {order.isVerified ? "已核查" : "待核查"}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      order.isReimbursed
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {order.isReimbursed ? "已报销" : "未报销"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}